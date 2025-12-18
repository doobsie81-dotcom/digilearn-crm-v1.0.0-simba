"use client";

import { format } from "date-fns";
import { MapPin, Video } from "lucide-react";
import { ReadOnlyLexicalRenderer } from "~/components/lexical-serializer";
import { Email, Event, LeadActivity, Note, Task } from "~/db/types";

interface TaskContentProps {
  activity: LeadActivity & { task: Task };
}

interface MeetingContentProps {
  activity: LeadActivity & { meeting: Event };
}

interface EmailContentProps {
  activity: LeadActivity & { email: Email };
}

interface NoteContentProps {
  activity: LeadActivity & { note: Note };
}

export const TaskContent = ({ activity }: TaskContentProps) => {
  return (
    <div className="space-y-3 pt-3 text-sm">
      <div>
        <p className="text-xs font-semibold opacity-60 mb-1">STATUS</p>
        <p className="capitalize font-medium">
          {activity.task?.status || activity.status}
        </p>
      </div>
      {activity.task?.dueDate && (
        <div>
          <p className="text-xs font-semibold opacity-60 mb-1">DUE DATE</p>
          <p className="font-medium">{format(activity.task.dueDate, "Ppp")}</p>
        </div>
      )}
      {activity.description && (
        <div>
          <p className="text-xs font-semibold opacity-60 mb-1">DESCRIPTION</p>
          <p>{activity.description}</p>
        </div>
      )}
    </div>
  );
};

export const MeetingContent = ({ activity }: MeetingContentProps) => {
  const meeting = activity.meeting;
  const attendees = (
    meeting?.attendees ? JSON.parse(meeting.attendees) : []
  ) as string[];

  return (
    <div className="space-y-3 pt-3 text-sm">
      {activity.description && (
        <div>
          <p className="text-xs font-semibold opacity-60 mb-1">DESCRIPTION</p>
          <p>{activity.description}</p>
        </div>
      )}
      {meeting?.startDate && (
        <div>
          <p className="text-xs font-semibold opacity-60 mb-1">DATE & TIME</p>
          <p className="font-medium">
            {format(meeting.startDate, "dd-MM-yyyy")}
          </p>
        </div>
      )}
      <div>
        <p className="text-xs font-semibold opacity-60 mb-1">FORMAT</p>
        <div className="flex items-center gap-2">
          {meeting?.platform === "in_person" ? (
            <>
              <MapPin className="w-4 h-4" />
              <span>In-Person</span>
            </>
          ) : (
            <>
              <Video className="w-4 h-4" />
              <span>Virtual</span>
            </>
          )}
        </div>
      </div>
      {meeting?.location && (
        <div>
          <p className="text-xs font-semibold opacity-60 mb-1">LOCATION</p>
          <p>{meeting.location}</p>
        </div>
      )}
      {attendees.length > 0 && (
        <div>
          <p className="text-xs font-semibold opacity-60 mb-1">ATTENDEES</p>
          <div className="space-y-1">
            {attendees.map((email, idx) => (
              <p key={idx}>{email}</p>
            ))}
          </div>
        </div>
      )}
      {meeting?.agenda && (
        <div>
          <p className="text-xs font-semibold opacity-60 mb-1">AGENDA</p>
          <p className="capitalize">{meeting.agenda.replace("-", " ")}</p>
        </div>
      )}
    </div>
  );
};

export const EmailContent = ({ activity }: EmailContentProps) => {
  return (
    <div className="space-y-3 pt-3 text-sm">
      {activity.email.subject && (
        <div>
          <p className="text-xs font-semibold opacity-60 mb-1">MESSAGE</p>
          <p>{activity.email.body}</p>
        </div>
      )}
      {activity.email && (
        <div>
          <p className="text-xs font-semibold opacity-60 mb-1">
            EMAIL RECIPIENTS
          </p>
          <p>{activity.email.recipients}</p>
        </div>
      )}
    </div>
  );
};

export const NoteContent = ({ activity }: NoteContentProps) => {
  return (
    <div className="space-y-3 pt-3 text-sm">
      {activity.note.content ? (
        <ReadOnlyLexicalRenderer content={activity.note.content} />
      ) : (
        <p className="opacity-60 italic">No note content</p>
      )}
    </div>
  );
};
