"use client";

import { Checkbox } from "~/components/ui/checkbox";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "~/components/ui/popover";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

export const MultiStatusSelect = ({
  selectedStatuses,
  setSelectedStatus,
  options,
}: {
  selectedStatuses: string[];
  setSelectedStatus: (statuses: string[]) => void;
  options: { label: string; value: string }[];
}) => {
  const [open, setOpen] = useState(false);

  const toggleStatus = (status: string) => {
    setSelectedStatus(
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((s) => s !== status)
        : [...selectedStatuses, status]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="truncate">
            {selectedStatuses.length > 0
              ? selectedStatuses
                  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                  .join(" | ")
              : "Select Status"}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0">
        <div className="p-2 space-y-2">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-2 px-2 py-1"
            >
              <Checkbox
                id={option.value}
                checked={selectedStatuses.includes(option.value)}
                onCheckedChange={() => toggleStatus(option.value)}
              />
              <label
                htmlFor={option.value}
                className="text-sm font-medium cursor-pointer capitalize flex-1"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
