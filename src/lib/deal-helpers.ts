// lib/deal-health-calculator.ts
import { db } from "~/db";
import {
  deals,
  dealStakeholders,
  dealCompetitors,
  dealHealthHistory,
  dealStageHistorySchema,
} from "~/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { DealHealthScore } from "~/db/types";

interface HealthCalculationParams {
  dealId: string;
  userId?: string;
}

/**
 * Calculate stakeholder engagement score (0-100)
 * Factors:
 * - Number of stakeholders mapped
 * - Presence of decision makers and champions
 * - Recent contact frequency
 * - Sentiment distribution
 */
async function calculateStakeholderEngagement(dealId: string): Promise<number> {
  const stakeholders = await db.query.dealStakeholders.findMany({
    where: eq(dealStakeholders.dealId, dealId),
  });

  if (stakeholders.length === 0) return 0;

  let score = 0;

  // Base score for having stakeholders (max 30 points)
  const stakeholderCount = Math.min(stakeholders.length, 6);
  score += (stakeholderCount / 6) * 30;

  // Decision makers and champions (max 30 points)
  const hasDecisionMaker = stakeholders.some(
    (s) => s.role === "decision_maker"
  );
  const hasChampion = stakeholders.some((s) => s.sentiment === "champion");
  const hasInfluencers = stakeholders.filter(
    (s) => s.role === "influencer"
  ).length;

  if (hasDecisionMaker) score += 15;
  if (hasChampion) score += 10;
  score += Math.min(hasInfluencers * 2.5, 5);

  // Engagement level (max 25 points)
  const engagedCount = stakeholders.filter((s) => s.engaged).length;
  const engagementRate = engagedCount / stakeholders.length;
  score += engagementRate * 25;

  // Recent contact (max 15 points)
  const now = new Date();
  const recentlyContacted = stakeholders.filter((s) => {
    if (!s.lastContactedAt) return false;
    const daysSinceContact =
      (now.getTime() - s.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceContact <= 7;
  });
  const recentContactRate = recentlyContacted.length / stakeholders.length;
  score += recentContactRate * 15;

  return Math.round(Math.min(score, 100));
}

/**
 * Calculate timing score (0-100)
 * Factors:
 * - Days until expected close
 * - Stage progression velocity
 * - SLA compliance
 * - Deal age vs expected cycle
 */
async function calculateTiming(dealId: string): Promise<number> {
  const deal = await db.query.deals.findFirst({
    where: eq(deals.id, dealId),
    with: {
      stageHistory: {
        orderBy: desc(dealStageHistorySchema.movedAt),
      },
    },
  });

  if (!deal) return 50;

  let score = 100;
  const now = new Date();

  // Expected close date alignment (deduct up to 30 points)
  if (deal.expectedCloseDate) {
    const daysToClose =
      (deal.expectedCloseDate.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24);

    if (daysToClose < 0) {
      // Past expected close date
      const daysOverdue = Math.abs(daysToClose);
      score -= Math.min(daysOverdue * 2, 30);
    } else if (daysToClose < 7) {
      // Very close to deadline - potential rush
      score -= 10;
    }
  }

  //SLA compliance (deduct up to 25 points)
  // if (deal) {
  //   score -= 25;
  // } else if (deal.slaDeadline) {
  //   const hoursToDeadline =
  //     (deal.slaDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  //   if (hoursToDeadline < 24) {
  //     score -= 15; // Approaching SLA deadline
  //   } else if (hoursToDeadline < 48) {
  //     score -= 8;
  //   }
  // }

  // Stage stagnation (deduct up to 20 points)
  const daysInCurrentStage =
    (now.getTime() - deal.currentStageSince.getTime()) / (1000 * 60 * 60 * 24);
  if (daysInCurrentStage > 30) {
    score -= 20;
  } else if (daysInCurrentStage > 14) {
    score -= 10;
  }

  // Deal age vs typical cycle (deduct up to 25 points)
  const dealAge =
    (now.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const typicalCycle = 90; // Assume 90 day sales cycle
  if (dealAge > typicalCycle * 1.5) {
    score -= 25;
  } else if (dealAge > typicalCycle) {
    score -= 15;
  }

  return Math.round(Math.max(score, 0));
}

/**
 * Calculate competition score (0-100)
 * Factors:
 * - Number of competitors
 * - Competitor strength
 * - Our competitive position
 * - Active vs eliminated competitors
 */
async function calculateCompetition(dealId: string): Promise<number> {
  const competitors = await db.query.dealCompetitors.findMany({
    where: eq(dealCompetitors.dealId, dealId),
  });

  if (competitors.length === 0) return 100; // No known competition = good

  let score = 100;

  const activeCompetitors = competitors.filter((c) => c.status === "active");
  const eliminatedCompetitors = competitors.filter(
    (c) => c.status === "eliminated"
  );

  // Number of active competitors (deduct up to 30 points)
  score -= Math.min(activeCompetitors.length * 10, 30);

  // Competitor strength (deduct up to 40 points)
  if (activeCompetitors.length > 0) {
    const avgStrength =
      activeCompetitors.reduce(
        (sum, c) => sum + (c.competitorStrength || 50),
        0
      ) / activeCompetitors.length;
    const strengthPenalty = ((avgStrength - 50) / 50) * 40; // Max 40 point deduction if all are very strong
    score -= Math.max(0, strengthPenalty);
  }

  // Bonus for eliminated competitors (add up to 20 points)
  score += Math.min(eliminatedCompetitors.length * 5, 20);

  // No competitive intelligence penalty (deduct 10 points)
  const unknownCompetitors = competitors.filter((c) => c.status === "unknown");
  if (unknownCompetitors.length > 0) {
    score -= 10;
  }

  return Math.round(Math.max(Math.min(score, 100), 0));
}

/**
 * Calculate budget score (0-100)
 * Factors:
 * - Budget confirmed vs unconfirmed
 * - Deal value alignment
 * - Payment terms
 * - Proposal acknowledgment
 */
async function calculateBudget(dealId: string): Promise<number> {
  const deal = await db.query.deals.findFirst({
    where: eq(deals.id, dealId),
  });

  if (!deal) return 50;

  let score = 50; // Start neutral

  // // Proposal sent and acknowledged (add 30 points)
  // if (deal.proposalSentAt && deal.proposalAcknowledgedAt) {
  //   score += 30;
  // } else if (deal.proposalSentAt) {
  //   score += 15; // Sent but not acknowledged
  // }

  // Stage progression indicates budget alignment (add up to 20 points)
  const stageScores: Record<string, number> = {
    lead_qualification: 0,
    stakeholder_discovery: 5,
    needs_assessment: 10,
    solution_proposal: 15,
    procurement_process: 18,
    contract_finalization: 20,
    implementation_delivery: 20,
    closed_won: 20,
    closed_lost: 0,
  };
  score += stageScores[deal.currentStatus] || 0;

  // Deal value reasonableness (add/deduct up to 20 points)
  const dealValue = parseFloat(deal.value);
  if (dealValue > 0) {
    if (dealValue < 10000) {
      score += 10; // Small deals are easier to budget
    } else if (dealValue > 200000) {
      score -= 10; // Large deals need more budget scrutiny
    }
  }

  // Probability alignment (add up to 30 points)
  if (deal.probability >= 80) {
    score += 30;
  } else if (deal.probability >= 60) {
    score += 20;
  } else if (deal.probability >= 40) {
    score += 10;
  }

  return Math.round(Math.max(Math.min(score, 100), 0));
}

/**
 * Calculate overall deal health score
 */
export async function calculateDealHealth({
  dealId,
  userId = "system",
}: HealthCalculationParams): Promise<DealHealthScore> {
  const [stakeholderEngagement, timing, competition, budget] =
    await Promise.all([
      calculateStakeholderEngagement(dealId),
      calculateTiming(dealId),
      calculateCompetition(dealId),
      calculateBudget(dealId),
    ]);

  // Weighted average (customize weights as needed)
  const weights = {
    stakeholderEngagement: 0.3, // 30%
    timing: 0.25, // 25%
    competition: 0.2, // 20%
    budget: 0.25, // 25%
  };

  const overallScore = Math.round(
    stakeholderEngagement * weights.stakeholderEngagement +
      timing * weights.timing +
      competition * weights.competition +
      budget * weights.budget
  );

  const healthScore: DealHealthScore = {
    score: overallScore,
    factors: {
      stakeholderEngagement,
      timing,
      competition,
      budget,
    },
    lastCalculated: new Date().toISOString(),
  };

  // Update deal record
  await db
    .update(deals)
    .set({
      healthScore: overallScore,
      healthScoreStakeholderEngagement: stakeholderEngagement,
      healthScoreTiming: timing,
      healthScoreCompetition: competition,
      healthScoreBudget: budget,
      healthScoreLastCalculated: new Date(),
    })
    .where(eq(deals.id, dealId));

  // Record in history
  await db.insert(dealHealthHistory).values({
    dealId,
    overallScore,
    stakeholderEngagement,
    timing,
    competition,
    budget,
    calculatedBy: userId,
  });

  return healthScore;
}

/**
 * Get current health score from database
 */
export async function getDealHealth(
  dealId: string
): Promise<DealHealthScore | null> {
  const deal = await db.query.deals.findFirst({
    where: eq(dealStageHistorySchema.id, dealId),
  });

  if (!deal || !deal.healthScore) return null;

  return {
    score: deal.healthScore,
    factors: {
      stakeholderEngagement: deal.healthScoreStakeholderEngagement || 0,
      timing: deal.healthScoreTiming || 0,
      competition: deal.healthScoreCompetition || 0,
      budget: deal.healthScoreBudget || 0,
    },
    lastCalculated:
      deal.healthScoreLastCalculated?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Get health score trend over time
 */
export async function getDealHealthTrend(dealId: string, days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return await db.query.dealHealthHistory.findMany({
    where: and(
      eq(dealHealthHistory.dealId, dealId)
      // Add date filter when needed
    ),
    orderBy: desc(dealHealthHistory.createdAt),
  });
}

/**
 * Batch calculate health scores for multiple deals
 */
export async function batchCalculateHealthScores(
  dealIds: string[],
  userId = "system"
) {
  return await Promise.all(
    dealIds.map((dealId) => calculateDealHealth({ dealId, userId }))
  );
}

/**
 * Get health score color/status
 */
export function getHealthScoreStatus(score: number): {
  status: "excellent" | "good" | "fair" | "poor" | "critical";
  color: string;
  label: string;
} {
  if (score >= 80) {
    return { status: "excellent", color: "bg-green-500", label: "Excellent" };
  } else if (score >= 65) {
    return { status: "good", color: "bg-blue-500", label: "Good" };
  } else if (score >= 50) {
    return { status: "fair", color: "bg-yellow-500", label: "Fair" };
  } else if (score >= 35) {
    return { status: "poor", color: "bg-orange-500", label: "Poor" };
  } else {
    return { status: "critical", color: "bg-red-500", label: "Critical" };
  }
}
