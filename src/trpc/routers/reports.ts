import { z } from "zod";
import { eq, sql, and, gte, lte, lt, desc, like, or } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "~/db";
import { invoices, leads, deals, leadStatusEnum, raffles, raffleEntries, companies, contacts, leadQualificationCriteria } from "~/db/schema";
import { TRPCError } from "@trpc/server";

export const reportsRouter = createTRPCRouter({
  revenueReport: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/reports/revenue" } })
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(["Paid", "Draft", "all"]).default("Paid"),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate, status } = input;

      // Build where conditions
      const conditions = [];

      if (status !== "all") {
        conditions.push(eq(invoices.status, status));
      }

      if (startDate) {
        conditions.push(gte(invoices.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(invoices.createdAt, new Date(endDate)));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Query using Drizzle's aggregate functions
      const result = await db
        .select({
          totalCompanies: sql<number>`COUNT(DISTINCT ${invoices.clientId})`,
          totalRevenue: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
        })
        .from(invoices)
        .where(whereClause);

      const totalCompanies = Number(result[0]?.totalCompanies ?? 0);
      const totalRevenue = Number(result[0]?.totalRevenue ?? 0);
      const avgRevenue = totalCompanies > 0 ? totalRevenue / totalCompanies : 0;

      return {
        totalCompanies,
        totalRevenue,
        avgRevenuePerCompany: avgRevenue,
      };
    }),

  // Alternative: Get detailed breakdown by company
  revenueByCompany: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/reports/revenue-by-company" } })
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: z.enum(["Paid", "Draft", "all"]).default("Paid"),
      })
    )
    .query(async ({ input }) => {
      const { startDate, endDate, status } = input;

      const conditions = [];

      if (status !== "all") {
        conditions.push(eq(invoices.status, status));
      }

      if (startDate) {
        conditions.push(gte(invoices.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(invoices.createdAt, new Date(endDate)));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get revenue grouped by company
      const companyRevenue = await db
        .select({
          companyId: invoices.clientId,
          totalRevenue: sql<number>`SUM(${invoices.total})`,
          invoiceCount: sql<number>`COUNT(*)`,
        })
        .from(invoices)
        .where(whereClause)
        .groupBy(invoices.clientId);

      return companyRevenue.map((row) => ({
        companyId: row.companyId,
        totalRevenue: Number(row.totalRevenue),
        invoiceCount: Number(row.invoiceCount),
      }));
    }),

  getMetrics: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/reports/metrics" } })
    .query(async () => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    // const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 1. Get new leads for current and previous month
    const [currentLeads] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(gte(leads.createdAt, currentMonthStart));

    const [previousLeads] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(
        and(
          gte(leads.createdAt, previousMonthStart),
          lt(leads.createdAt, currentMonthStart)
        )
      );

    // 2. Get active deals for current and previous month
    const [currentActiveDeals] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(
        and(
          eq(deals.closeStatus, "ongoing"),
          gte(deals.createdAt, currentMonthStart)
        )
      );

    const [previousActiveDeals] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(
        and(
          eq(deals.closeStatus, "ongoing"),
          gte(deals.createdAt, previousMonthStart),
          lt(deals.createdAt, currentMonthStart)
        )
      );

    // 3. Get total revenue (paid invoices) for current and previous month
    const [currentRevenue] = await db
      .select({ total: sql<number>`COALESCE(SUM(${invoices.total}), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, "Paid"),
          gte(invoices.paidDate, currentMonthStart)
        )
      );

    const [previousRevenue] = await db
      .select({ total: sql<number>`COALESCE(SUM(${invoices.total}), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, "Paid"),
          gte(invoices.paidDate, previousMonthStart),
          lt(invoices.paidDate, currentMonthStart)
        )
      );

    // Calculate percentage changes
    const leadsChange =
      previousLeads.count > 0
        ? ((currentLeads.count - previousLeads.count) / previousLeads.count) *
          100
        : 0;

    const dealsChange =
      previousActiveDeals.count > 0
        ? ((currentActiveDeals.count - previousActiveDeals.count) /
            previousActiveDeals.count) *
          100
        : 0;

    const revenueChange =
      previousRevenue.total > 0
        ? ((currentRevenue.total - previousRevenue.total) /
            previousRevenue.total) *
          100
        : 0;

    return {
      currentMonth: {
        leads: currentLeads.count,
        activeDeals: currentActiveDeals.count,
        revenue: parseFloat(currentRevenue.total.toString()),
      },
      previousMonth: {
        leads: previousLeads.count,
        activeDeals: previousActiveDeals.count,
        revenue: parseFloat(previousRevenue.total.toString()),
      },
      changes: {
        leads: parseFloat(leadsChange.toFixed(1)),
        activeDeals: parseFloat(dealsChange.toFixed(1)),
        revenue: parseFloat(revenueChange.toFixed(1)),
      },
    };
  }),
  getRevenueTrend: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/reports/revenue-trend" } })
    .query(async () => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Get revenue grouped by month for the last 6 months
    const revenueByMonth = await db
      .select({
        month: sql<string>`DATE_FORMAT(${invoices.paidDate}, '%Y-%m')`,
        revenue: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
      })
      .from(invoices)
      .where(
        and(eq(invoices.status, "Paid"), gte(invoices.paidDate, sixMonthsAgo))
      )
      .groupBy(sql`DATE_FORMAT(${invoices.paidDate}, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(${invoices.paidDate}, '%Y-%m')`);

    // Format the data for the chart
    const formattedData = revenueByMonth.map((item) => {
      const [_, month] = item.month.split("-");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      return {
        month: monthNames[parseInt(month) - 1],
        revenue: parseFloat(item.revenue.toString()),
        fullDate: item.month,
      };
    });

    // Fill in missing months with 0 revenue
    const completeData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const existing = formattedData.find((d) => d.fullDate === monthKey);
      completeData.push({
        month: monthNames[date.getMonth()],
        revenue: existing ? existing.revenue : 0,
      });
    }

    return completeData;
  }),

  getConversionFunnel: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/reports/conversion-funnel" } })
    .input(
      z
        .object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      // Build date filters if provided
      const dateFilters = [];
      if (input?.startDate) {
        dateFilters.push(gte(leads.createdAt, new Date(input.startDate)));
      }
      if (input?.endDate) {
        dateFilters.push(lt(leads.createdAt, new Date(input.endDate)));
      }

      // Get lead pipeline stages count
      const leadStagesQuery = db
        .select({
          stage: leads.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(leads)
        .$dynamic();

      if (dateFilters.length > 0) {
        leadStagesQuery.where(and(...dateFilters));
      }

      const leadStages = await leadStagesQuery.groupBy(leads.status);

      // Get deal pipeline stages count
      const dealStagesQuery = db
        .select({
          stage: deals.currentStatus,
          count: sql<number>`COUNT(*)`,
        })
        .from(deals)
        .$dynamic();

      // we only need ones with closed status of ongoing here
      // so we build the condition to cater for that
      const conditions = [eq(deals.closeStatus, "ongoing")];
      if (dateFilters.length > 0) {
        conditions.push(...dateFilters);
      }
      dealStagesQuery.where(and(...conditions));

      const dealStages = await dealStagesQuery.groupBy(deals.currentStatus);

      // Get total counts
      const totalLeadsQuery = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(leads)
        .$dynamic();

      if (dateFilters.length > 0) {
        totalLeadsQuery.where(and(...dateFilters));
      }

      const [totalLeads] = await totalLeadsQuery;

      const totalDealsQuery = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(deals)
        .$dynamic();

      totalDealsQuery.where(and(...conditions));

      const [totalDeals] = await totalDealsQuery;

      // Get won deals
      const wonDealsQuery = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(deals)
        .where(eq(deals.closeStatus, "won"))
        .$dynamic();

      if (dateFilters.length > 0) {
        wonDealsQuery.where(and(eq(deals.closeStatus, "won"), ...dateFilters));
      }

      const [wonDeals] = await wonDealsQuery;

      // Get lost deals
      const lostDealsQuery = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(deals)
        .where(eq(deals.closeStatus, "lost"))
        .$dynamic();

      if (dateFilters.length > 0) {
        lostDealsQuery.where(
          and(eq(deals.closeStatus, "lost"), ...dateFilters)
        );
      }

      const [lostDeals] = await lostDealsQuery;

      // Build lead pipeline with all stages
      const leadPipeline = leadStatusEnum.map((stage) => ({
        stage,
        label:
          stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, " "),
        count: 0,
      }));

      leadStages.forEach((item) => {
        const stageItem = leadPipeline.find((s) => s.stage === item.stage);
        if (stageItem) {
          stageItem.count = Number(item.count);
        }
      });

      // Build deal pipeline with all stages
      const stages = await db.query.PipelineStageSchema.findMany({
        orderBy: (stage, { asc }) => asc(stage.order),
      });
      const dealPipeline = stages.map((stage) => ({
        stage: stage.id,
        label: stage.name,
        count: 0,
      }));

      dealStages.forEach((item) => {
        const stageItem = dealPipeline.find((s) => s.label === item.stage);
        if (stageItem) {
          stageItem.count = Number(item.count);
        }
      });

      // add won and lost deals to the pipeline
      dealPipeline.push({
        stage: "Closed Deals",
        label: "Closed Deals",
        count: Number(wonDeals.count) + Number(lostDeals.count),
      });

      // Calculate conversion rates
      const qualifiedLeads =
        leadPipeline.find((s) => s.stage === "qualified")?.count || 0;
      const leadToQualified =
        totalLeads.count > 0
          ? (qualifiedLeads / Number(totalLeads.count)) * 100
          : 0;

      const leadToDeal =
        totalLeads.count > 0
          ? (Number(totalDeals.count) / Number(totalLeads.count)) * 100
          : 0;

      const dealToWon =
        totalDeals.count > 0
          ? (Number(wonDeals.count) / Number(totalDeals.count)) * 100
          : 0;

      const overallConversion =
        totalLeads.count > 0
          ? (Number(wonDeals.count) / Number(totalLeads.count)) * 100
          : 0;

      return {
        leadPipeline,
        dealPipeline,
        summary: {
          totalLeads: Number(totalLeads.count),
          totalDeals: Number(totalDeals.count),
          wonDeals: Number(wonDeals.count),
          lostDeals: Number(lostDeals.count),
          leadToQualifiedRate: parseFloat(leadToQualified.toFixed(2)),
          leadToDealRate: parseFloat(leadToDeal.toFixed(2)),
          dealToWonRate: parseFloat(dealToWon.toFixed(2)),
          overallConversionRate: parseFloat(overallConversion.toFixed(2)),
        },
      };
    }),

  // Get funnel by time period comparison
  getFunnelComparison: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/reports/funnel-comparison" } })
    .input(
      z.object({
        period: z.enum(["week", "month", "quarter", "year"]),
      })
    )
    .query(async ({ input }) => {
      const now = new Date();
      let currentStart: Date;
      let previousStart: Date;
      let currentEnd: Date;

      switch (input.period) {
        case "week":
          currentStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 7
          );
          previousStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 14
          );
          currentEnd = now;
          break;
        case "month":
          currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
          previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          currentEnd = now;
          break;
        case "quarter":
          const currentQuarter = Math.floor(now.getMonth() / 3);
          currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
          previousStart = new Date(
            now.getFullYear(),
            (currentQuarter - 1) * 3,
            1
          );
          currentEnd = now;
          break;
        case "year":
          currentStart = new Date(now.getFullYear(), 0, 1);
          previousStart = new Date(now.getFullYear() - 1, 0, 1);
          currentEnd = now;
          break;
      }

      // Current period metrics
      const [currentLeads] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(leads)
        .where(
          and(
            gte(leads.createdAt, currentStart),
            lt(leads.createdAt, currentEnd)
          )
        );

      const [currentDeals] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(deals)
        .where(
          and(
            gte(deals.createdAt, currentStart),
            lt(deals.createdAt, currentEnd)
          )
        );

      const [currentWon] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(deals)
        .where(
          and(
            eq(deals.closeStatus, "won"),
            gte(deals.createdAt, currentStart),
            lt(deals.createdAt, currentEnd)
          )
        );

      // Previous period metrics
      const [previousLeads] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(leads)
        .where(
          and(
            gte(leads.createdAt, previousStart),
            lt(leads.createdAt, currentStart)
          )
        );

      const [previousDeals] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(deals)
        .where(
          and(
            gte(deals.createdAt, previousStart),
            lt(deals.createdAt, currentStart)
          )
        );

      const [previousWon] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(deals)
        .where(
          and(
            eq(deals.closeStatus, "won"),
            gte(deals.createdAt, previousStart),
            lt(deals.createdAt, currentStart)
          )
        );

      // Calculate changes
      const leadsChange =
        previousLeads.count > 0
          ? ((Number(currentLeads.count) - Number(previousLeads.count)) /
              Number(previousLeads.count)) *
            100
          : 0;

      const dealsChange =
        previousDeals.count > 0
          ? ((Number(currentDeals.count) - Number(previousDeals.count)) /
              Number(previousDeals.count)) *
            100
          : 0;

      const wonChange =
        previousWon.count > 0
          ? ((Number(currentWon.count) - Number(previousWon.count)) /
              Number(previousWon.count)) *
            100
          : 0;

      const currentConversion =
        currentLeads.count > 0
          ? (Number(currentWon.count) / Number(currentLeads.count)) * 100
          : 0;

      const previousConversion =
        previousLeads.count > 0
          ? (Number(previousWon.count) / Number(previousLeads.count)) * 100
          : 0;

      return {
        current: {
          leads: Number(currentLeads.count),
          deals: Number(currentDeals.count),
          won: Number(currentWon.count),
          conversionRate: parseFloat(currentConversion.toFixed(2)),
        },
        previous: {
          leads: Number(previousLeads.count),
          deals: Number(previousDeals.count),
          won: Number(previousWon.count),
          conversionRate: parseFloat(previousConversion.toFixed(2)),
        },
        changes: {
          leads: parseFloat(leadsChange.toFixed(1)),
          deals: parseFloat(dealsChange.toFixed(1)),
          won: parseFloat(wonChange.toFixed(1)),
          conversionRate: parseFloat(
            (currentConversion - previousConversion).toFixed(2)
          ),
        },
      };
    }),

  // Get stage duration analytics
  getStageDurations: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/reports/stage-durations" } })
    .query(async () => {
    // Get average time in each lead stage
    const leadDurations = await db.execute(sql`
      SELECT 
        stage,
        AVG(TIMESTAMPDIFF(DAY, created_at, updated_at)) as avg_days
      FROM ${leads}
      GROUP BY stage
      ORDER BY 
        FIELD(status, 'new', 'contacted', 'qualified', 'proposal', 'negotiation')
    `);

    // Get average time in each deal stage
    const dealDurations = await db.execute(sql`
      SELECT 
        stage,
        AVG(TIMESTAMPDIFF(DAY, created_at, updated_at)) as avg_days
      FROM ${deals}
      GROUP BY stage
      ORDER BY 
        FIELD(currentStatus, 'qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost')
    `);

    return {
      leadStageDurations: leadDurations.entries,
      dealStageDurations: dealDurations.entries,
    };
  }),

  // Raffle Dashboard Metrics (Admin only)
  getRaffleDashboard: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/reports/raffle-dashboard" } })
    .query(async ({ ctx }) => {
      // Only admins can access this
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can access the raffle dashboard",
        });
      }

      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

      // Get total leads from last 6 months
      const [totalLeads] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(leads)
        .where(gte(leads.createdAt, sixMonthsAgo));

      // Get total raffle entries
      const [totalRaffleEntries] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(raffleEntries);

      // Get total active raffles
      const [totalActiveRaffles] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(raffles)
        .where(
          and(
            lte(raffles.startDate, now),
            gte(raffles.endDate, now)
          )
        );

      return {
        totalLeads: Number(totalLeads.count),
        totalRaffleEntries: Number(totalRaffleEntries.count),
        totalActiveRaffles: Number(totalActiveRaffles.count),
      };
    }),

  // List searchable new leads from last 6 months (Admin only)
  getRaffleLeads: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/reports/raffle-leads" } })
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Only admins can access this
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can access raffle leads",
        });
      }

      const { search, limit, offset } = input;
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

      // Build where conditions
      const conditions = [gte(leads.createdAt, sixMonthsAgo)];

      // Add search condition if provided
      const searchConditions = [];
      if (search) {
        const searchPattern = `%${search}%`;
        searchConditions.push(
          like(leads.name, searchPattern),
          like(companies.name, searchPattern)
        );
      }

      // Get total count
      const countQuery = db
        .select({ count: sql<number>`COUNT(DISTINCT ${leads.id})` })
        .from(leads)
        .leftJoin(companies, eq(leads.companyId, companies.id));

      if (searchConditions.length > 0) {
        countQuery.where(and(...conditions, or(...searchConditions)));
      } else {
        countQuery.where(and(...conditions));
      }

      const [totalResult] = await countQuery;
      const total = Number(totalResult?.count ?? 0);

      // Get paginated leads with full details
      const leadsQuery = db
        .select({
          lead: leads,
          company: companies,
          primaryContact: contacts,
          qualification: leadQualificationCriteria,
        })
        .from(leads)
        .leftJoin(companies, eq(leads.companyId, companies.id))
        .leftJoin(contacts, eq(leads.primaryContactId, contacts.id))
        .leftJoin(
          leadQualificationCriteria,
          eq(leads.id, leadQualificationCriteria.leadId)
        )
        .orderBy(desc(leads.createdAt))
        .limit(limit)
        .offset(offset);

      if (searchConditions.length > 0) {
        leadsQuery.where(and(...conditions, or(...searchConditions)));
      } else {
        leadsQuery.where(and(...conditions));
      }

      const raffleLeads = await leadsQuery;

      // Map to consistent structure
      const formattedLeads = raffleLeads.map((row) => ({
        ...row.lead,
        company: row.company,
        primaryContact: row.primaryContact,
        qualification: row.qualification,
        qualificationPercentage: row.qualification?.completionPercentage ?? 0,
      }));

      return {
        total,
        leads: formattedLeads,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),

  // Get single lead details with qualification (Admin only)
  getRaffleLeadDetails: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/reports/raffle-leads/{id}" } })
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Only admins can access this
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can access raffle lead details",
        });
      }

      const lead = await db.query.leads.findFirst({
        where: eq(leads.id, input.id),
        with: {
          company: true,
          primaryContact: true,
          qualification: true,
          contactAssociations: {
            with: {
              contact: true,
            },
          },
          activities: {
            orderBy: [desc(leads.createdAt)],
            limit: 10,
          },
          tagAssociations: {
            with: {
              tag: true,
            },
          },
        },
      });

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found",
        });
      }

      return {
        ...lead,
        qualificationPercentage: lead.qualification?.completionPercentage ?? 0,
      };
    }),
});
