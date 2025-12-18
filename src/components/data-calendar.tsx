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
  SlotInfo,
} from "react-big-calendar";
import { Event } from "~/db/types";
import "./data-calendar.css";
import { Button } from "./ui/button";
import {
  CalendarIcon,
  CalendarPlus,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useAddMeetingModalStore } from "~/store/use-add-meeting-modal-store";

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

const CustomEvent = ({ event }: { event: EventProps<Event> }) => {
  return (
    <div className="border border-input border-l-primary bg-muted rounded-md p-1.5">
      <p className="text-foreground">{event.title}</p>
      <p className="text-muted-foreground text-sm">{event.event.agenda}</p>
      <p className="text-muted-foreground text-sm">{event.event.platform}</p>
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
  const onOpen = useAddMeetingModalStore((state) => state.onOpen);
  return (
    <div className="flex mb-4 items-center gap-x-2 w-full lg:w-auto justify-start">
      <Button variant="outline" size="icon" onClick={() => onNavigate("PREV")}>
        <ChevronLeftIcon className="size-4" />
      </Button>
      <div className="flex items-center border border-input rounded-md px-2 py-3 h-9 justify-center lg:w-auto">
        <CalendarIcon className="size-4 mr-2" />
        <p className="text-sm">{format(date, "MMMM yyyy")}</p>
      </div>
      <Button variant="outline" size="icon" onClick={() => onNavigate("NEXT")}>
        <ChevronRightIcon className="size-4" />
      </Button>
      <Button variant="outline" className="ml-auto" onClick={() => onOpen()}>
        <CalendarPlus className="size-4" />
        New Meeting
      </Button>
    </div>
  );
};

interface DataCalendaProps {
  data: Event[];
}

export const DataCalendar = ({ data }: DataCalendaProps) => {
  const [value, setValue] = useState(
    data.length > 0 ? new Date(data[0].startDate) : new Date()
  );

  const events = useMemo(() => {
    if (!data) return [];

    return data.map((event) => ({
      ...event,
      start: event.startDate,
      end: event.endDate,
    }));
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

  const onOpen = useAddMeetingModalStore((state) => state.onOpen);

  const onSelectSlot = (slotInfo: SlotInfo) => {
    // Open the modal with the selected slot information
    onOpen({
      start: slotInfo.start,
      end: slotInfo.end,
    });
  };

  return (
    <>
      <Calendar
        localizer={localizer}
        date={value}
        toolbar
        events={events}
        showAllEvents
        className="h-full"
        views={["month"]}
        defaultView="month"
        selectable
        onSelectSlot={onSelectSlot}
        max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
        formats={{
          weekdayFormat: (date, culture, localizer) =>
            localizer?.format(date, "EEE", culture) ?? "",
        }}
        components={{
          event: (event) => <CustomEvent event={event} />,
          toolbar: () => (
            <CustomToolbar date={value} onNavigate={handleNavigate} />
          ),
        }}
      />
    </>
  );
};
