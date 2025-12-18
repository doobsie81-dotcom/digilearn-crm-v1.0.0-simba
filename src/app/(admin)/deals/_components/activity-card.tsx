"use client";

import { LeadActivity, Task, Email, Event, Note } from "~/db/types";
import {
  TaskContent,
  MeetingContent,
  EmailContent,
  NoteContent,
} from "./activity-content-cards";
import { ActivityType, TaskStatus } from "./deal-activities";

type taskUser = { id: string; name: string; email?: string };

interface ActivityCardProps {
  activity: LeadActivity & {
    task: Task;
    email: Email;
    meeting: Event;
    note: Note;
    assignedToUser: taskUser | null;
    createdByUser: taskUser;
  };
  isExpanded: boolean;
  onToggle: () => void;
  getActivityIcon: (type: ActivityType) => React.ReactNode;
  getActivityColor: (type: ActivityType) => string;
  getStatusBadge: (type: ActivityType, status: TaskStatus) => React.ReactNode;
  isReadOnly?: boolean;
}

export const ActivityCard = ({
  activity,
  isExpanded,
  onToggle,
  getActivityIcon,
  getActivityColor,
  getStatusBadge,
}: ActivityCardProps) => {
  const renderActivityContent = () => {
    switch (activity.type) {
      case "task":
        return <TaskContent activity={activity} />;
      case "meeting":
        return <MeetingContent activity={activity} />;
      case "email":
        return <EmailContent activity={activity} />;
      case "note":
        return <NoteContent activity={activity} />;
      default:
        return null;
    }
  };

  const colorClass = getActivityColor(activity.type);

  return (
    <div className={`rounded-lg border transition-all ${colorClass}`}>
      <div
        role="button"
        onClick={onToggle}
        className="w-full px-4 py-2.5 flex items-start justify-between hover:opacity-90 transition-opacity"
      >
        <div className="flex items-start gap-4 flex-1">
          <div className="mt-1 flex-shrink-0">
            {getActivityIcon(activity.type)}
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-x-3 mb-2">
              <h3 className="font-semibold text">{activity.subject}</h3>
              <span className="text-xs font-bold uppercase tracking-wide opacity-70">
                {activity.type}
              </span>
              {getStatusBadge(
                activity.type,
                activity.task?.status || activity.status
              )}
            </div>
            <div className="flex items-center gap-4 text-sm opacity-75">
              {activity.assignedToUser && (
                <span>
                  Assigned to: <strong>{activity.assignedToUser.name}</strong>
                </span>
              )}
              {activity.createdByUser && (
                <span>
                  Created by: <strong>{activity.createdByUser.name}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-2xl opacity-30 flex-shrink-0">
          {isExpanded ? "−" : "+"}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t opacity-80">
          {renderActivityContent()}
        </div>
      )}
    </div>
  );
};
