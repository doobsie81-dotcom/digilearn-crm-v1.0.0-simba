"use client";

import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../ui/form";
import { EventValues } from "../modals/add-lead-form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { calculateDuration, generateTimeOptions } from "~/lib/events-helper";
import { useState } from "react";
import { addHours, format } from "date-fns";
import { Checkbox } from "../ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "~/lib/utils";
import { Calendar } from "../ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";

const timeOptions = generateTimeOptions();

const EventForm = ({
  onSubmit,
  handleBack,
  isSubmitting,
}: {
  onSubmit: (data: EventValues) => void;
  handleBack: () => void;
  isSubmitting: boolean;
}) => {
  const form = useFormContext<EventValues>();

  const [allDay, setAllDay] = useState(false);
   

  // Handle all-day toggle
  const handleAllDayChange = (checked: boolean) => {
    setAllDay(checked);
    if (checked) {
      form.setValue("startTime", "00:00");
      form.setValue("endTime", "23:59");
    } else {
      // Reset to current time with 1-hour duration
      const now = new Date();
      const currentTime = format(now, "HH:mm");
      const oneHourLater = format(addHours(now, 1), "HH:mm");
      form.setValue("startTime", currentTime);
      form.setValue("endTime", oneHourLater);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <CalendarIcon className="w-4 h-4" />
        <span>Schedule an initial meeting or appointment with this lead</span>
      </div>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Title *</FormLabel>
            <FormControl>
              <Input placeholder="Initial Meeting" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Discuss project requirements and timeline..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="space-y-4">
        {/* All-day checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="all-day"
            checked={allDay}
            onCheckedChange={handleAllDayChange}
          />
          <label
            htmlFor="all-day"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            All day
          </label>
        </div>

        {/* Date and Time Selection */}
        <div className="space-y-4">
          {/* Start Date & Time Row */}
          <div className="flex items-end gap-3">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) => {
                          field.onChange(
                            date ? format(date, "yyyy-MM-dd") : ""
                          );
                          // Also set end date to same date by default
                          if (date && !form.getValues("endDate")) {
                            form.setValue(
                              "endDate",
                              format(date, "yyyy-MM-dd")
                            );
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!allDay && (
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="w-32">
                    <FormLabel>Time</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Time">
                            {field.value && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {
                                  timeOptions.find(
                                    (t) => t.value === field.value
                                  )?.label
                                }
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* End Date & Time Row */}
          <div className="flex items-end gap-3">
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) => {
                          field.onChange(
                            date ? format(date, "yyyy-MM-dd") : ""
                          );
                        }}
                        disabled={(date) => {
                          const startDate = form.getValues("startDate");
                          return startDate ? date < new Date(startDate) : false;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!allDay && (
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="w-32">
                    <FormLabel>Time</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Time">
                            {field.value && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {
                                  timeOptions.find(
                                    (t) => t.value === field.value
                                  )?.label
                                }
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* Duration display */}
        {!allDay &&
          form.watch("startDate") &&
          form.watch("startTime") &&
          form.watch("endDate") &&
          form.watch("endTime") && (
            <div className="text-sm text-muted-foreground">
              Duration:{" "}
              {calculateDuration(
                form.watch("startDate") ?? "",
                form.watch("startTime") ?? "",
                form.watch("endDate") ?? "",
                form.watch("endTime") ?? ""
              )}
            </div>
          )}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={handleBack}>
          Back
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Lead"}
        </Button>
      </div>
    </form>
  );
};

export default EventForm;
