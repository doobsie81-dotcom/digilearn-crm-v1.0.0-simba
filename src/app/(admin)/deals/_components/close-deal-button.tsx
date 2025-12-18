"use client";

import { closeStatusEnum } from "~/db/schema";
import { Button, buttonVariants } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { LucideIcon, ThumbsDown, ThumbsUp } from "lucide-react";
import { VariantProps } from "class-variance-authority";
import { ChangeEvent, useState } from "react";

export type CloseStatus = Exclude<(typeof closeStatusEnum)[number], "ongoing">;

interface CloseDealButtonProps {
  status: CloseStatus;
  onSave: (data: { reason: string; status: CloseStatus }) => void;
}

export const CloseDealButton = ({ status, onSave }: CloseDealButtonProps) => {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  const handleOnConfirm = () => {
    onSave({
      status,
      reason,
    });
    setOpen(false);
    setReason("");
  };

  const buttonTitles: Record<
    CloseStatus,
    {
      icon: LucideIcon;
      title: string;
      variant?: VariantProps<typeof buttonVariants>["variant"];
    }
  > = {
    won: {
      icon: ThumbsUp,
      title: "Mark as won",
      variant: "default",
    },
    lost: {
      icon: ThumbsDown,
      title: "Mark as lost",
      variant: "destructive",
    },
  };

  const Icon = buttonTitles[status].icon;
  const title = buttonTitles[status].title;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={buttonTitles[status].variant}>
          <Icon className="h-4 w-4 mr-2" /> {title}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-4">
        <p className="font-semibold text-lg">{title}</p>
        <p className="text-muted-forground text-sm">
          You are about to set deal as {status}. Are you sure
        </p>
        {status === "lost" && (
          <div>
            <Input
              placeholder="Enter reason for losing deal"
              className="bg-muted"
              value={reason}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setReason(e.target.value)
              }
            />
          </div>
        )}
        <div className="flex itemx-center justify-end gap-x-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleOnConfirm}>Confirm</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
