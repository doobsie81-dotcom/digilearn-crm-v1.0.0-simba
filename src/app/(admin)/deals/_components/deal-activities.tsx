"use client";

import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { trpc } from "~/trpc/client";
import { Circle, Users, Zap, Mail, ScrollText, Lock } from "lucide-react";
import { activityTypeEnum, taskStatusEnum } from "~/db/schema";
import { useState, useMemo } from "react";
import { ActivityCard } from "./activity-card";
import { Badge } from "~/components/ui/badge";

interface DealActivitiesProps {
  dealId: string;
  leadId?: string;
}
export type ActivityType = (typeof activityTypeEnum)[number];
export type TaskStatus = (typeof taskStatusEnum)[number];

export const DealActivities = ({ dealId, leadId }: DealActivitiesProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "task":
        return <Zap className="w-5 h-5" />;
      case "meeting":
        return <Users className="w-5 h-5" />;
      case "email":
        return <Mail className="w-5 h-5" />;
      case "note":
        return <ScrollText className="w-5 h-5" />;
      default:
        return <Circle className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: ActivityType, isReadOnly?: boolean) => {
    const baseColor = (() => {
      switch (type) {
        case "task":
          return "bg-muted/10 border-l-primary/50 border-l-2 ";
        case "meeting":
          return "bg-muted/10 border-l-purple-200 border-l-2 ml-4";
        case "email":
          return "bg-muted/10 border-l-green-200 border-l-2";
        case "note":
          return "bg-muted border-none border-l border-l-amber-200 border-l-2 ml-4";
        default:
          return "bg-gray-50 border-l-gray-200 border-l-2";
      }
    })();

    return isReadOnly ? `${baseColor} opacity-75` : baseColor;
  };

  const getStatusBadge = (type: ActivityType, status: TaskStatus) => {
    if (type === "task") {
      const taskStatus =
        status === "done"
          ? "Completed"
          : status === "in-progress"
            ? "In Progress"
            : "Scheduled";
      const statusColor =
        status === "done"
          ? "bg-green-100 text-green-800"
          : status === "in-progress"
            ? "bg-blue-100 text-blue-800"
            : "bg-gray-100 text-gray-800";
      return (
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}
        >
          {taskStatus}
        </span>
      );
    }
    if (type === "meeting") {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary">
          Scheduled
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
        {status}
      </span>
    );
  };

  // Fetch deal activities
  const { data: dealActivities, isLoading: dealActivitiesLoading } =
    trpc.activities.getAllActivities.useQuery({
      dealId,
    });

  // Fetch lead activities if leadId is provided
  const { data: leadActivities, isLoading: leadActivitiesLoading } =
    trpc.activities.getAllActivities.useQuery(
      {
        leadId: leadId!,
      },
      {
        enabled: !!leadId,
      }
    );

  // Combine and sort activities
  const allActivities = useMemo(() => {
    const deal = (dealActivities || []).map((activity) => ({
      ...activity,
      isReadOnly: false,
      source: "deal" as const,
    }));

    const lead = (leadActivities || []).map((activity) => ({
      ...activity,
      isReadOnly: true,
      source: "lead" as const,
    }));

    // Combine and sort by date (newest first)
    return [...deal, ...lead].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [dealActivities, leadActivities]);

  const isLoading = dealActivitiesLoading || leadActivitiesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-8 w-full",
              i % 2 === 0 && "w-[calc(100% - 100px)] ml-[100px]"
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {leadId && leadActivities && leadActivities.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
          <Lock className="h-4 w-4" />
          <span>
            Activities from the lead are shown below as read-only and marked with{" "}
            <Badge variant="outline" className="ml-1">
              From Lead
            </Badge>
          </span>
        </div>
      )}

      {allActivities && allActivities.length > 0 ? (
        allActivities.map((activity) => (
          <div key={`${activity.source}-${activity.id}`} className="relative">
            {activity.isReadOnly && (
              <div className="absolute -top-2 right-0 z-10">
                <Badge variant="outline" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  From Lead
                </Badge>
              </div>
            )}
            <ActivityCard
              activity={activity}
              isExpanded={expandedId === `${activity.source}-${activity.id}`}
              onToggle={() =>
                setExpandedId(
                  expandedId === `${activity.source}-${activity.id}`
                    ? null
                    : `${activity.source}-${activity.id}`
                )
              }
              getActivityIcon={getActivityIcon}
              getActivityColor={(type) => getActivityColor(type, activity.isReadOnly)}
              getStatusBadge={getStatusBadge}
              isReadOnly={activity.isReadOnly}
            />
          </div>
        ))
      ) : (
        <div className="text-center text-muted-foreground py-8">
          No activities found
        </div>
      )}
    </div>
  );
};
