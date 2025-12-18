"use client";

import { DollarSign, FileText, Users } from "lucide-react";
import ConversionFunnel from "~/components/reports/conversion-funnel";
import MetricCard from "~/components/reports/metric-card";
import { RevenueChart } from "~/components/reports/revenue-chart";
import { trpc } from "~/trpc/client";

export function Dashboard() {
  const { data: reportData, isLoading } = trpc.reports.getMetrics.useQuery();
  const { data: revenueData } = trpc.reports.getRevenueTrend.useQuery();
  const { data: funnelData } = trpc.reports.getConversionFunnel.useQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Sample data - replace with your actual data
  const currentMonth = {
    leads: reportData?.currentMonth.leads || 0,
    activeDeals: reportData?.currentMonth.activeDeals || 0,
    revenue: reportData?.currentMonth.revenue || 0,
  };

  // Calculate percentage changes
  const leadsChange = reportData?.changes.leads.toFixed(2) ?? "0";
  const dealsChange = reportData?.changes.activeDeals.toFixed(2) ?? "0";
  const revenueChange = reportData?.changes.revenue.toFixed(2) ?? "0";

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="New Leads This Month"
          value={currentMonth.leads}
          change={leadsChange}
          icon={Users}
        />

        <MetricCard
          title="Active Deals"
          value={currentMonth.activeDeals}
          change={dealsChange}
          icon={FileText}
        />

        <MetricCard
          title="Total Revenue (Paid)"
          value={currentMonth.revenue}
          change={revenueChange}
          icon={DollarSign}
          prefix="$"
        />
      </section>
      {/* Revenue Chart */}
      <RevenueChart revenueData={revenueData || []} />

      <ConversionFunnel
        data={
          funnelData || {
            leadPipeline: [],
            dealPipeline: [],
            summary: {
              totalLeads: 0,
              totalDeals: 0,
              wonDeals: 0,
              lostDeals: 0,
              leadToQualifiedRate: 0,
              leadToDealRate: 0,
              dealToWonRate: 0,
              overallConversionRate: 0,
            },
          }
        }
        onStageClick={(stage, type) => {
          console.log(`Clicked ${type}: ${stage}`);
          // Navigate or show details
        }}
      />
    </div>
  );
}
