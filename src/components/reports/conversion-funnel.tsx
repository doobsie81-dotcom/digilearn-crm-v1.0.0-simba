"use client";
// components/ConversionFunnel.tsx
import React from "react";
import { ResponsiveFunnel } from "@nivo/funnel";
import { ResponsiveBar } from "@nivo/bar";
import {
  Target,
  Users,
  ArrowRight,
  Award,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type {
  FunnelData,
  NivoFunnelData,
  ConversionFunnelProps,
  FunnelMetricCardProps,
} from "~/types/funnel-types";

const MetricCard: React.FC<FunnelMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}) => (
  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm text-gray-500">{subtitle}</p>
  </div>
);

const ConversionFunnel: React.FC<ConversionFunnelProps> = ({
  data,
  loading = false,
  onStageClick,
}) => {
  // Transform data for Nivo Funnel
  const transformToNivoFunnel = (
    pipeline: Array<{ label: string; count: number }>
  ): NivoFunnelData[] => {
    return pipeline.map((stage) => ({
      id: stage.label,
      value: stage.count,
      label: `${stage.label}: ${stage.count}`,
    }));
  };

  const leadFunnelData = transformToNivoFunnel(data.leadPipeline);
  const dealFunnelData = transformToNivoFunnel(
    data.dealPipeline.filter((s) => s.stage !== "closed_lost")
  );

  // Calculate conversion rates between stages
  const calculateConversionRate = (
    current: number,
    previous: number
  ): string => {
    if (previous === 0) return "0.0";
    return ((current / previous) * 100).toFixed(1);
  };

  // Prepare data for bar charts
  const leadBarData = data.leadPipeline.map((stage, index) => ({
    stage: stage.label,
    count: stage.count,
    conversion:
      index > 0
        ? parseFloat(
            calculateConversionRate(
              stage.count,
              data.leadPipeline[index - 1].count
            )
          )
        : 100,
  }));

  const dealBarData = data.dealPipeline.map((stage, index) => ({
    stage: stage.label,
    count: stage.count,
    conversion:
      index > 0
        ? parseFloat(
            calculateConversionRate(
              stage.count,
              data.dealPipeline[index - 1].count
            )
          )
        : 100,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading funnel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Overall Conversion Rate"
          value={`${data.summary.overallConversionRate}%`}
          subtitle="Leads to Won Deals"
          icon={Target}
          color="bg-purple-100 text-purple-600"
        />
        <MetricCard
          title="Lead Qualification Rate"
          value={`${data.summary.leadToQualifiedRate}%`}
          subtitle="New to Qualified"
          icon={Users}
          color="bg-blue-100 text-blue-600"
        />
        <MetricCard
          title="Lead to Deal Rate"
          value={`${data.summary.leadToDealRate}%`}
          subtitle="Qualified to Active Deal"
          icon={ArrowRight}
          color="bg-green-100 text-green-600"
        />
        <MetricCard
          title="Deal Win Rate"
          value={`${data.summary.dealToWonRate}%`}
          subtitle="Active Deals Won"
          icon={Award}
          color="bg-yellow-100 text-yellow-600"
        />
      </div>

      {/* Lead Pipeline Section */}
      <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Lead Pipeline
          </h2>
          <p className="text-gray-600">
            From initial contact to qualified opportunity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">
          {/* Nivo Funnel Chart */}
          <div className="h-96 mb-8 bg-muted rounded-md p-4">
            <ResponsiveFunnel
              data={leadFunnelData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              shapeBlending={0.66}
              colors={{ scheme: "blues" }}
              borderWidth={20}
              borderColor={{
                from: "color",
                modifiers: [["darker", 0.3]],
              }}
              borderOpacity={0.65}
              labelColor={{
                from: "color",
                modifiers: [["darker", 3]],
              }}
              beforeSeparatorLength={100}
              beforeSeparatorOffset={20}
              afterSeparatorLength={100}
              afterSeparatorOffset={20}
              currentPartSizeExtension={10}
              currentBorderWidth={40}
              motionConfig="gentle"
              enableLabel={true}
              // label={(d) => `${d.data.value}`}
              valueFormat={(value) => `${value.toLocaleString()}`}
              onClick={(data) => {
                if (onStageClick) {
                  const stage = data.data.id;
                  onStageClick(stage, "lead");
                }
              }}
            />
          </div>

          <div className="space-y-6">
            {/* Conversion Rates Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Drop-off
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.leadPipeline.map((stage, index) => {
                    const prevCount =
                      index > 0
                        ? data.leadPipeline[index - 1].count
                        : stage.count;
                    const conversionRate = calculateConversionRate(
                      stage.count,
                      prevCount
                    );
                    const dropOff = prevCount - stage.count;
                    const dropOffRate =
                      prevCount > 0
                        ? ((dropOff / prevCount) * 100).toFixed(1)
                        : "0.0";

                    return (
                      <tr key={stage.stage} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stage.label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {stage.count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {index > 0 && (
                              <>
                                <span
                                  className={`font-semibold ${
                                    parseFloat(conversionRate) >= 50
                                      ? "text-green-600"
                                      : "text-orange-600"
                                  }`}
                                >
                                  {conversionRate}%
                                </span>
                                {parseFloat(conversionRate) >= 50 ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-orange-600" />
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {index > 0 && `${dropOff} (${dropOffRate}%)`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bar Chart */}
            {/* <div className="mt-8 h-64">
              <ResponsiveBar
                data={leadBarData}
                keys={["count"]}
                indexBy="stage"
                margin={{ top: 20, right: 30, bottom: 80, left: 60 }}
                padding={0.3}
                colors={{ scheme: "blues" }}
                borderColor={{
                  from: "color",
                  modifiers: [["darker", 1.6]],
                }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: "Stage",
                  legendPosition: "middle",
                  legendOffset: 60,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: "Count",
                  legendPosition: "middle",
                  legendOffset: -50,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{
                  from: "color",
                  modifiers: [["darker", 1.6]],
                }}
                animate={true}
                motionConfig="gentle"
              />
            </div> */}
          </div>
        </div>
      </div>

      {/* Deal Pipeline Section */}
      <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Deal Pipeline
          </h2>
          <p className="text-gray-600">From opportunity to closed deal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">
          {/* Nivo Funnel Chart */}
          <div className="h-96 mb-8 bg-muted rounded-md p-4">
            <ResponsiveFunnel
              data={dealFunnelData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              shapeBlending={0.66}
              colors={{ scheme: "greens" }}
              borderWidth={20}
              borderColor={{
                from: "color",
                modifiers: [["darker", 0.3]],
              }}
              borderOpacity={0.65}
              labelColor={{
                from: "color",
                modifiers: [["darker", 3]],
              }}
              beforeSeparatorLength={100}
              beforeSeparatorOffset={20}
              afterSeparatorLength={100}
              afterSeparatorOffset={20}
              currentPartSizeExtension={10}
              currentBorderWidth={40}
              motionConfig="gentle"
              enableLabel={true}
              //label={(d) => `${d.data.value}`}
              valueFormat={(value) => `${value.toLocaleString()}`}
              onClick={(data) => {
                if (onStageClick) {
                  const stage = data.data.id;
                  onStageClick(stage, "deal");
                }
              }}
            />
          </div>

          <div className="space-y-6">
            {/* Conversion Rates Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Drop-off
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.dealPipeline.map((stage, index) => {
                    const prevCount =
                      index > 0
                        ? data.dealPipeline[index - 1].count
                        : stage.count;
                    const conversionRate = calculateConversionRate(
                      stage.count,
                      prevCount
                    );
                    const dropOff = prevCount - stage.count;
                    const dropOffRate =
                      prevCount > 0
                        ? ((dropOff / prevCount) * 100).toFixed(1)
                        : "0.0";

                    return (
                      <tr key={stage.stage} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stage.label}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {stage.count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            {index > 0 && (
                              <>
                                <span
                                  className={`font-semibold ${
                                    parseFloat(conversionRate) >= 50
                                      ? "text-green-600"
                                      : "text-orange-600"
                                  }`}
                                >
                                  {conversionRate}%
                                </span>
                                {parseFloat(conversionRate) >= 50 ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-orange-600" />
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {index > 0 && stage.stage !== "closed_lost" && (
                            <span className="text-red-600">
                              {dropOff} ({dropOffRate}%)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bar Chart */}
            {/* <div className="mt-8 h-64">
              <ResponsiveBar
                data={dealBarData}
                keys={["count"]}
                indexBy="stage"
                margin={{ top: 20, right: 30, bottom: 80, left: 60 }}
                padding={0.3}
                colors={{ scheme: "greens" }}
                borderColor={{
                  from: "color",
                  modifiers: [["darker", 1.6]],
                }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: "Stage",
                  legendPosition: "middle",
                  legendOffset: 60,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: "Count",
                  legendPosition: "middle",
                  legendOffset: -50,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{
                  from: "color",
                  modifiers: [["darker", 1.6]],
                }}
                animate={true}
                motionConfig="gentle"
              />
            </div> */}

            {/* Summary Stats */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Pipeline</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.summary.totalDeals} deals
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Deals Won</p>
                  <p className="text-2xl font-bold text-green-600">
                    {data.summary.wonDeals} deals
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Deals Lost</p>
                  <p className="text-2xl font-bold text-red-600">
                    {data.summary.lostDeals} deals
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionFunnel;
