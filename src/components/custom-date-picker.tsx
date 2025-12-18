import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";
import { Button, buttonVariants } from "./ui/button";
import React, { ReactNode, useState } from "react";
import { VariantProps } from "class-variance-authority";

interface CustomPickerProps {
  disabledDateCheck?: (date: Date) => boolean;
  trigger?: ReactNode | ((formattedValue: string) => ReactNode);
  value: Date | undefined;
  onSelectChange: (date: Date | undefined) => void;
  variant?: VariantProps<typeof buttonVariants>["variant"];
}

const CustomDatePicker: React.FC<CustomPickerProps> = ({
  trigger,
  value,
  onSelectChange,
  disabledDateCheck,
  variant = "secondary",
}) => {
  const [open, setOpen] = useState(false);

  const isDateDisabled = (date: Date): boolean => {
    if (disabledDateCheck) {
      return disabledDateCheck(date);
    }
    return false;
  };

  const formattedValue = value ? format(value, "dd-MM-yyyy") : "";
  const defaultTrigger = (
    <Button variant={variant} className="w-full justify-between">
      <span className="truncate">{formattedValue || "Select date"}</span>
      <CalendarIcon className="h-4 w-4 opacity-50 ml-2" />
    </Button>
  );

  const triggerContent = trigger
    ? typeof trigger === "function"
      ? trigger(formattedValue || "Select date")
      : trigger
    : defaultTrigger;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerContent}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={onSelectChange}
          disabled={isDateDisabled}
        />
      </PopoverContent>
    </Popover>
  );
};

export default CustomDatePicker;
