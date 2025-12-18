import { DollarSign } from "lucide-react";
import { Company, Deal, PipelineStage } from "~/db/types";
import { useRouter } from "next/navigation";
import { differenceInBusinessDays } from "date-fns";

interface DealCardProps {
  deal: Deal & { company: Company };
  stage: PipelineStage;
  isDragging?: boolean;
  onEdit?: (deal: Deal) => void;
  onDelete?: (dealId: string) => void;
}

// Compact deal card with minimal information
export default function CompactDealCard({
  deal,
  stage,
  isDragging = false,
  // onEdit,
  // onDelete,
}: DealCardProps & { onClick?: () => void }) {
  const router = useRouter();
  const healthScore = deal.healthScore;
  const daysInStage = differenceInBusinessDays(
    new Date(),
    deal.currentStageSince
  );
  const isOverdue = daysInStage > (stage.slaDays ?? 0);

  // use sla days insteadof health score.
  const getHealthColorBackground = (score: number) => {
    if (score >= 70) return "bg-green-50 border-green-200";
    if (score >= 40) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const getHealthColorDot = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div
      className={`group cursor-grab border active:cursor-grabbing transition-all duration-300 rounded-md ${
        isDragging
          ? "opacity-70 rotate-2 shadow-xl"
          : "hover:shadow-md hover:-translate-y-1"
      } ${getHealthColorBackground(healthScore)}`}
      onClick={() => router.push(`/deals/${deal.id}`)}
    >
      <div className="p-3">
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2  mb-2.5">
            <h3 className="font-medium text-xs text-black line-clamp-2 flex-1 min-w-0">
              {deal.title}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* {onEdit && onDelete && (
                <DealCardActions
                  deal={deal}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              )} */}
              <span className="sr-only">{isOverdue}</span>
              <div
                className={`w-2 h-2 rounded-full ${getHealthColorDot(healthScore)}`}
              />
              <span className="text-xs text-black/70">{deal.probability}%</span>
            </div>
          </div>

          {/* to include lead details */}
          <div className="text-xs text-black/70 truncate">
            {deal.company.name}
          </div>

          <div className="flex items-center gap-1 text-xs mb-4">
            <DollarSign className="h-3 w-3 text-black/70 flex-shrink-0" />
            <span className="font-medium text-black truncate">
              ${deal.value.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="truncate text-black/70">
              {deal.assignedToEmail}
            </span>
            {/* <DealStatusIndicator deal={deal} /> */}
          </div>
        </div>
      </div>
    </div>
  );
}
