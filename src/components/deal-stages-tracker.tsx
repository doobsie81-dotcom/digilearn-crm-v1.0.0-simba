"use client";

import { differenceInBusinessDays, format } from "date-fns";
import { useMemo, useState } from "react";
import { Deal, DealStageHistory } from "~/db/types";
import { cn } from "~/lib/utils";
import { trpc } from "~/trpc/client";
import { Flag } from "lucide-react";
import {
  CloseDealButton,
  CloseStatus,
} from "~/app/(admin)/deals/_components/close-deal-button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface DealStageTrackerProps {
  dealStages: DealStageHistory[];
  deal: Deal;
  // onUpdate Stage
}

const DealStageTracker: React.FC<DealStageTrackerProps> = ({
  dealStages,
  deal,
}) => {
  const utils = trpc.useUtils();

  const { mutateAsync: closeDeal } = trpc.deals.closeDeal.useMutation();

  // Fetch available pipeline stages
  const { data: pipelineStages } = trpc.pipelines.getPipelines.useQuery({
    stage: "",
  });

  const activeStage = useMemo(() => {
    return dealStages.find((stage) => stage.toStatus === deal.currentStatus);
  }, [dealStages, deal]);

  const handleOnCloseDeal = async (payload: {
    status: CloseStatus;
    reason: string;
  }) => {
    try {
      await closeDeal(
        {
          id: deal.id,
          deal: { closeStatus: payload.status, lostReason: payload.reason },
        },
        {
          onSuccess: () => {
            utils.deals.getDealDetails.invalidate();
            toast.success(`Deal was successfully set as ${payload.status}`);
          },
        }
      );
    } catch (error) {
      console.log(error);
      toast.error(`Failed to set deal as ${payload.status}`);
    }
  };

  // const handleStageChange = async (stageId: string) => {
  //   setIsUpdating(true);
  //   try {
  //     const selectedStage = pipelineStages?.find((s) => s.id === stageId);
  //     if (!selectedStage) return;

  //     await updateDeal({
  //       id: deal.id,
  //       currentStageId: stageId,
  //       currentStatus: selectedStage.name,
  //     });

  //     // Invalidate both deal details and kanban board
  //     await utils.deals.getDealDetails.invalidate();
  //     await utils.deals.listByStage.invalidate();

  //     toast.success(`Deal moved to ${selectedStage.name}`);
  //   } catch (error) {
  //     console.error(error);
  //     toast.error("Failed to update deal stage");
  //   } finally {
  //     setIsUpdating(false);
  //   }
  // };

  return (
    <div className="flex items-start gap-4 w-full">
      <div className={cn("min-w-[360px] space-y-2")}>
        {/* <Select
          value={deal.currentStageId}
          onValueChange={handleStageChange}
          disabled={isUpdating || deal.closeStatus !== "ongoing"}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select stage" />
          </SelectTrigger>
          <SelectContent>
            {pipelineStages?.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select> */}

        <div className="w-full bg-primary/10 flex items-center gap-x-2 rounded-md p-2">
          <Flag className="h-4 w-4 text-primary" />
          <span className="font-semibold">{activeStage?.toStatus}</span>
        </div>

        <p className="text-sm text-muted-foreground">
          On: {format(activeStage?.movedAt || new Date(), "yyyy-MM-dd")}, By:{" "}
          {activeStage?.movedBy}
        </p>
        <p className="text-sm">
          Days in Stage:{" "}
          {differenceInBusinessDays(
            new Date(),
            activeStage?.movedAt || new Date()
          )}{" "}
        </p>
      </div>
      {deal.closeStatus === "ongoing" && (
        <div className="ml-auto flex items-center gap-2">
          <CloseDealButton status="won" onSave={handleOnCloseDeal} />
          <CloseDealButton status="lost" onSave={handleOnCloseDeal} />
        </div>
      )}
    </div>
  );
};

export default DealStageTracker;
