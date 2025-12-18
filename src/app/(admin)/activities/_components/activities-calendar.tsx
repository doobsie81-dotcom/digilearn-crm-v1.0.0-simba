"use client";

import {
  addMonths,
  format,
  subMonths,
  getDay,
  parse,
  startOfWeek,
} from "date-fns";
import { enUS } from "date-fns/locale";
import { useMemo, useState } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  EventProps,
} from "react-big-calendar";
import "~/components/data-calendar.css";
import { Button } from "~/components/ui/button";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Phone,
  Video,
  Mail,
  CheckCircle2,
  MessageSquare,
  FileText,
} from "lucide-react";
import { Activity } from "./activities-table";

const locales = {
  "en-us": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  getDay,
  parse,
  startOfWeek,
  locales,
});

const getActivityIcon = (type: string) => {
  switch (type) {
    case "meeting":
      return Video;
    case "call":
      return Phone;
    case "email":
      return Mail;
    case "task":
      return CheckCircle2;
    case "sms":
      return MessageSquare;
    case "note":
      return FileText;
    default:
      return FileText;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case "meeting":
      return "bg-purple-100 text-purple-700 border-l-purple-500";
    case "call":
      return "bg-green-100 text-green-700 border-l-green-500";
    case "email":
      return "bg-orange-100 text-orange-700 border-l-orange-500";
    case "task":
      return "bg-blue-100 text-blue-700 border-l-blue-500";
    case "sms":
      return "bg-yellow-100 text-yellow-700 border-l-yellow-500";
    case "note":
      return "bg-gray-100 text-gray-700 border-l-gray-500";
    default:
      return "bg-gray-100 text-gray-700 border-l-gray-500";
  }
};

const CustomEvent = ({ event }: EventProps) => {
  const Icon = getActivityIcon(event.resource?.type || "");
  const colorClass = getActivityColor(event.resource?.type || "");

  return (
    <div
      className={`${colorClass} border border-input border-l-4 rounded-md p-1.5 text-xs h-full`}
    >
      <div className="flex items-start gap-1">
        <Icon className="h-3 w-3 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{event.title}</p>
          {event.resource?.description && (
            <p className="text-xs opacity-75 truncate">
              {event.resource.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomToolbar = ({
  date,
  onNavigate,
}: {
  date: Date;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
}) => {
  return (
    <div className="flex mb-4 items-center gap-x-2 w-full lg:w-auto justify-start">
      <Button variant="outline" size="icon" onClick={() => onNavigate("PREV")}>
        <ChevronLeftIcon className="size-4" />
      </Button>
      <div className="flex items-center border border-input rounded-md px-2 py-3 h-9 justify-center lg:w-auto min-w-[150px]">
        <CalendarIcon className="size-4 mr-2" />
        <p className="text-sm">{format(date, "MMMM yyyy")}</p>
      </div>
      <Button variant="outline" size="icon" onClick={() => onNavigate("NEXT")}>
        <ChevronRightIcon className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onNavigate("TODAY")}
        className="ml-2"
      >
        Today
      </Button>
    </div>
  );
};

interface ActivitiesCalendarProps {
  data: Activity[];
}

export const ActivitiesCalendar = ({ data }: ActivitiesCalendarProps) => {
  const [value, setValue] = useState(new Date());

  const events = useMemo(() => {
    if (!data) return [];

    // Filter activities that have a scheduled date and convert to calendar events
    return data
      .filter((activity) => activity.scheduledAt)
      .map((activity) => {
        const startDate = new Date(activity.scheduledAt!);
        const endDate = activity.duration
          ? new Date(startDate.getTime() + activity.duration * 60000)
          : new Date(startDate.getTime() + 60 * 60000); // Default 1 hour if no duration

        const { status, ...activityRest } = activity;

        return {
          id: activity.id,
          title: activity.subject,
          start: startDate,
          end: endDate,
          resource: {
            ...activityRest,
            type: activity.type,
            description: activity.description,
            status: status,
            assignedTo: activity.assignedToUser?.name,
          },
        };
      });
  }, [data]);

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
    if (action === "PREV") {
      setValue(subMonths(value, 1));
    } else if (action === "NEXT") {
      setValue(addMonths(value, 1));
    } else if (action === "TODAY") {
      setValue(new Date());
    }
  };

  return (
    <div className="p-4">
      <Calendar
        localizer={localizer}
        date={value}
        toolbar
        events={events}
        showAllEvents
        className="h-[600px]"
        views={["month"]}
        defaultView="month"
        selectable={false}
        max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
        formats={{
          weekdayFormat: (date, culture, localizer) =>
            localizer?.format(date, "EEE", culture) ?? "",
        }}
        components={{
          event: (event) => <CustomEvent {...event} />,
          toolbar: () => (
            <CustomToolbar date={value} onNavigate={handleNavigate} />
          ),
        }}
      />
    </div>
  );
};
