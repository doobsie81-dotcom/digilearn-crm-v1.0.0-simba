import { leadStatusEnum } from "~/db/schema";
export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
}

export interface LeadStage extends FunnelStage {
  stage: (typeof leadStatusEnum)[number];
}

export interface DealStage extends FunnelStage {
  stage: string;
}

export interface FunnelSummary {
  totalLeads: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  leadToQualifiedRate: number;
  leadToDealRate: number;
  dealToWonRate: number;
  overallConversionRate: number;
}

export interface FunnelData {
  leadPipeline: LeadStage[];
  dealPipeline: DealStage[];
  summary: FunnelSummary;
}

export interface NivoFunnelData {
  id: string;
  value: number;
  label: string;
  [key: string]: string | number;
}

export interface FunnelMetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export interface ConversionFunnelProps {
  data: FunnelData;
  loading?: boolean;
  onStageClick?: (stage: string, type: "lead" | "deal") => void;
}
