"use client";

import { Badge } from "~/components/ui/badge";
import { Deal } from "~/db/types";
import { cn } from "~/lib/utils";

interface KanbanHeaderProps {
  stage: { description: string | null; name: string; color?: string };
  deals: Deal[];
}

export const KanbanHeader = ({ stage, deals }: KanbanHeaderProps) => {
  const totalValue = deals.reduce((sum, deal) => sum + Number(deal.value), 0);
  const overdueDeals = deals.filter(
    (deal) => deal.expectedCloseDate! < new Date()
  ).length;
  const avgHealthScore =
    deals.length > 0
      ? Math.round(
          deals.reduce((sum, deal) => {
            const health = deal.healthScore;
            return sum + health;
          }, 0) / deals.length
        )
      : 0;
  return (
    <div
      className={cn(
        "flex-shrink-0 p-2 border-b border-border bg-gray-50",
        `border-t-${stage?.color ?? "border"}`
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 bg-gray-400`} />
          <h2
            className="font-medium text-xs text-black truncate"
            title={stage.description ?? ""}
          >
            {stage.name.replace(" & ", " ")}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs px-1 py-0 text-black border border-gray-300",
              "bg-background"
            )}
          >
            {deals.length}
          </Badge>
        </div>
      </div>
      <div className="text-xs text-black/70 space-y-0.5">
        <div className="truncate">${totalValue.toFixed(2)}</div>
        <div className="truncate">Overdue: {overdueDeals}</div>
        {avgHealthScore > 0 ? (
          <div className="flex items-center gap-1">
            <div
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                avgHealthScore >= 70
                  ? "bg-green-500"
                  : avgHealthScore >= 40
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
            />
            <span className="truncate">{avgHealthScore}%</span>
          </div>
        ) : (
          <span>N/A</span>
        )}
      </div>
    </div>
  );
};
