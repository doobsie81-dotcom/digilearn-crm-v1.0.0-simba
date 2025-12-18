"use client";

import { ResponsiveLine } from "@nivo/line";

interface RevenueChartProps {
  revenueData: { month: string; revenue: number }[];
}

export const RevenueChart = ({ revenueData }: RevenueChartProps) => {
  // Transform data for Nivo format
  const formattedData = [
    {
      id: "revenue",
      data: revenueData.map((d) => ({
        x: d.month,
        y: d.revenue,
      })),
    },
  ];

  return (
    <div className="bg-card rounded-md p-6 border border-border">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Revenue Overview - 6 Month Trend
        </h2>
        <p className="text-gray-600">
          Tracking paid invoices over the last 6 months
        </p>
      </div>

      <div className="h-[300px]">
        <ResponsiveLine
          data={formattedData}
          margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
          xScale={{
            type: "point",
          }}
          yScale={{
            type: "linear",
            min: "auto",
            max: "auto",
          }}
          curve="monotoneX"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            format: (value) => `$${(value / 1000).toFixed(0)}k`,
          }}
          pointSize={8}
          pointColor="#2563eb"
          pointBorderWidth={2}
          pointBorderColor="#2563eb"
          pointLabelYOffset={-12}
          enableGridX={true}
          enableGridY={true}
          colors={["#2563eb"]}
          useMesh={true}
          gridXValues={5}
          gridYValues={5}
          theme={{
            grid: {
              line: {
                stroke: "#e5e7eb",
                strokeDasharray: "3 3",
              },
            },
            axis: {
              ticks: {
                text: {
                  fontSize: 14,
                  fill: "#6b7280",
                },
              },
            },
          }}
          tooltip={({ point }) => (
            <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
              <strong>${point.data.yFormatted.toLocaleString()}</strong>
              <div className="text-gray-600 text-sm">
                {point.data.xFormatted}
              </div>
            </div>
          )}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
        <div>
          <p className="text-sm text-gray-600">Average Monthly</p>
          <p className="text-lg font-semibold text-gray-900">
            $
            {(
              revenueData.reduce((sum, d) => sum + d.revenue, 0) /
              revenueData.length
            ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Highest Month</p>
          <p className="text-lg font-semibold text-gray-900">
            ${Math.max(...revenueData.map((d) => d.revenue)).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Lowest Month</p>
          <p className="text-lg font-semibold text-gray-900">
            ${Math.min(...revenueData.map((d) => d.revenue)).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">6-Month Total</p>
          <p className="text-lg font-semibold text-gray-900">
            $
            {revenueData
              .reduce((sum, d) => sum + d.revenue, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
