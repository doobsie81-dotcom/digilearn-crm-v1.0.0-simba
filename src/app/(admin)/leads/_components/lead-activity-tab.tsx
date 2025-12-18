"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Form } from "~/components/ui/form";
import { DataKanban, TaskStatus } from "./data-kanban";
import { DataCalendar } from "~/components/data-calendar";
import { LeadNotes } from "./lead-notes";
import AddTaskModal from "~/components/modals/add-task-modal";
import { AddMeetingModal } from "~/components/modals/add-meeting-modal";
import { CallRecorder } from "~/components/call-recorder";
import { TaskFormValues } from "~/validation/tasks";
import { AddMeetingValues } from "~/validation/events";
import { User, Task, Event, Contact } from "~/db/types";
import { Button } from "~/components/ui/button";

const ActivitySubTabs = ["notes", "tasks", "meetings", "calls"] as const;
type ActivitySubTabType = (typeof ActivitySubTabs)[number];

interface LeadActivityTabProps {
  leadId: string;
  tasks: Task[];
  meetings: Event[];
  contacts: Contact[];
  users: User[];
  loadingMeetings: boolean;
  meetingsError: unknown;
  taskForm: UseFormReturn<TaskFormValues>;
  meetingForm: UseFormReturn<AddMeetingValues>;
  isCreatingTask: boolean;
  isCreatingMeeting: boolean;
  onCreateTask: (data: TaskFormValues) => Promise<void>;
  onCreateMeeting: (data: AddMeetingValues) => Promise<void>;
  onCloseTaskModal: () => void;
  onCloseMeetingModal: () => void;
  onKanbanChange: (
    tasks: { id: string; status: TaskStatus; position: number }[]
  ) => Promise<void>;
  isActionsLocked?: boolean;
  lockedReason?: "unassigned" | "converted";
}

export function LeadActivityTab({
  leadId,
  tasks,
  meetings,
  contacts,
  users,
  loadingMeetings,
  meetingsError,
  taskForm,
  meetingForm,
  isCreatingTask,
  isCreatingMeeting,
  onCreateTask,
  onCreateMeeting,
  onCloseTaskModal,
  onCloseMeetingModal,
  onKanbanChange,
  isActionsLocked = false,
  lockedReason,
}: LeadActivityTabProps) {
  const [activeSubTab, setActiveSubTab] =
    useState<ActivitySubTabType>("notes");

  return (
    <div>
      {isActionsLocked && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {lockedReason === "unassigned"
            ? "This lead is unassigned. Assign an owner before creating notes, tasks, meetings or calls."
            : "This lead has been converted and is now read-only. Activities cannot be modified."}
        </div>
      )}
      {/* Sub-tabs */}
      <div className="mb-6">
        <nav className="flex gap-2">
          {ActivitySubTabs.map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              variant={activeSubTab === tab ? "default" : "outline"}
            >
              {tab}
            </Button>
          ))}
        </nav>
      </div>

      {/* Sub-tab content */}
      {activeSubTab === "notes" && (
        <LeadNotes leadId={leadId} isReadOnly={isActionsLocked} />
      )}

      {activeSubTab === "tasks" && (
        <>
          <DataKanban
            data={tasks || []}
            onChange={isActionsLocked ? async () => {} : onKanbanChange}
            isReadOnly={isActionsLocked}
          />

          {!isActionsLocked && (
            <Form {...taskForm}>
              <AddTaskModal
                isPending={isCreatingTask}
                onSubmit={onCreateTask}
                onClose={onCloseTaskModal}
                users={users || []}
              />
            </Form>
          )}
        </>
      )}

      {activeSubTab === "meetings" && (
        <>
          {loadingMeetings ? (
            <div>
              <p>Loading Meetings</p>
            </div>
          ) : meetingsError ? null : (
            meetings && <DataCalendar data={meetings} />
          )}
          {!isActionsLocked && (
            <Form {...meetingForm}>
              <AddMeetingModal
                onSubmit={onCreateMeeting}
                onClose={onCloseMeetingModal}
                isSubmitting={isCreatingMeeting}
                contacts={contacts || []}
              />
            </Form>
          )}
        </>
      )}

      {activeSubTab === "calls" && (
        <CallRecorder leadId={leadId} readOnly={isActionsLocked} />
      )}
    </div>
  );
}
