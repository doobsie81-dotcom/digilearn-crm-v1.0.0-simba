import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  change: string; // percentage change as string
  icon: LucideIcon;
  prefix?: string;
  suffix?: string;
}

const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  prefix = "",
  suffix = "",
}: MetricCardProps) => {
  const isPositive = parseFloat(change) >= 0;

  return (
    <div className="bg-card rounded-md p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-gray-600 font-medium">{title}</h3>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">
            {prefix}
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix}
          </p>
        </div>

        <div
          className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            isPositive ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span
            className={`text-sm font-semibold ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {isPositive ? "+" : ""}
            {change}%
          </span>
        </div>
      </div>

      {/* <p className="text-sm text-gray-500 mt-2">vs. previous month</p> */}
    </div>
  );
};

export default MetricCard;
