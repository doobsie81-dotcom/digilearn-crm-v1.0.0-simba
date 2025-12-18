"use client";

import PageHeader from "~/components/page-header";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { CalendarIcon, List, X } from "lucide-react";
import { activityTypeEnum } from "~/db/schema";
import { Card } from "~/components/ui/card";
import { ActivitiesTable } from "./activities-table";
import { ActivitiesCalendar } from "./activities-calendar";
import { trpc } from "~/trpc/client";

type ActivityLayout = "List" | "Calendar";
type ActivityType = (typeof activityTypeEnum)[number];

// here we're just going to show emails, calls, etc, the calendar is for schedules...

const ActivitiesComponent = () => {
  const [activeLayout, setActiveLayout] = useState<ActivityLayout>("List");
  const [filters, setFilters] = useState<ActivityType[]>([]);

  const [activities] = trpc.activities.getAllActivities.useSuspenseQuery({});

  const handleSelectFilter = (filter: ActivityType) => {
    setFilters((prevFilters) => {
      const newFilters = prevFilters.some((f) => f === filter)
        ? prevFilters.filter((f) => f !== filter)
        : [...prevFilters, filter];
      return newFilters;
    });
  };

  // Filter activities based on selected filters
  const filteredActivities = filters.length > 0
    ? activities.filter((activity) => filters.includes(activity.type))
    : activities;

  return (
    <div className="space-y-6">
      <PageHeader title="Activities" />
      <div className="flex items-center">
        <div className="flex items-center gap-x-2">
          <Button
            size="icon"
            variant={activeLayout === "List" ? "secondary" : "outline"}
            className={activeLayout === "List" ? "border border-primary" : ""}
            onClick={() => setActiveLayout("List")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant={activeLayout === "Calendar" ? "secondary" : "outline"}
            className={
              activeLayout === "Calendar" ? "border border-primary" : ""
            }
            onClick={() => setActiveLayout("Calendar")}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
          {/* <Button>
            <Plus className="h-4 w-4" />
            Add Activity
          </Button> */}
        </div>
      </div>
      <div className="flex items-center">
        <div className="flex items-center gap-x-2">
          {activityTypeEnum.map((filter) => {
            const isSelected = filters.includes(filter);
            return (
              <Button
                variant="link"
                key={filter}
                size="sm"
                className={
                  isSelected
                    ? "text-primary bg-card/50"
                    : "text-muted-foreground"
                }
                onClick={() => handleSelectFilter(filter)}
              >
                {filter}
              </Button>
            );
          })}
          {filters.length > 0 && (
            <Button
              variant="link"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setFilters([])}
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>
      <Card>
        {activeLayout === "List" && <ActivitiesTable data={filteredActivities || []} />}
        {activeLayout === "Calendar" && (
          <ActivitiesCalendar data={filteredActivities || []} />
        )}
      </Card>
    </div>
  );
};

export default ActivitiesComponent;
