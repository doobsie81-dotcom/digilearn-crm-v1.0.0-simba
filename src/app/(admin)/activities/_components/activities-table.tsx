import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  createColumnHelper,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  CheckCircle2,
  Inbox,
  Phone,
  Video,
  Mail,
  type LucideIcon,
  Clock,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Task, LeadActivity, Email, Deal, Event, Lead } from "~/db/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { TaskSheet } from "~/components/task-sheet";

type taskUser = { id: string; name: string; email?: string };

export type Activity = LeadActivity & {
  task: Task;
  email: Email;
  meeting: Event;
  assignedToUser: taskUser | null;
  createdByUser: taskUser;
  lead: Lead;
  deal: Deal | null;
};

type ActivityWithExtras = Activity;

interface ActivitiesTableProps {
  data: ActivityWithExtras[];
}

const columnHelper = createColumnHelper<ActivityWithExtras>();

// Activity type badge
const ActivityTypeBadge = ({ type }: { type: LeadActivity["type"] }) => {
  const config: Record<
    LeadActivity["type"],
    { icon: LucideIcon; label: string; color: string }
  > = {
    task: {
      icon: CheckCircle2,
      label: "Task",
      color: "bg-blue-100 text-blue-700 border-blue-300",
    },
    meeting: {
      icon: Video,
      label: "Meeting",
      color: "bg-purple-100 text-purple-700 border-purple-300",
    },
    call: {
      icon: Phone,
      label: "Call",
      color: "bg-green-100 text-green-700 border-green-300",
    },
    email: {
      icon: Mail,
      label: "Email",
      color: "bg-orange-100 text-orange-700 border-orange-300",
    },
    sms: {
      icon: Mail,
      label: "SMS",
      color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    },
    note: {
      icon: Mail,
      label: "Note",
      color: "bg-gray-100 text-gray-700 border-gray-300",
    },
  };

  const { icon: Icon, label, color } = config[type];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${color}`}
    >
      <Icon size={14} />
      {label}
    </span>
  );
};

export const ActivitiesTable = ({ data }: ActivitiesTableProps) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const columns = useMemo(
    () => [
      columnHelper.accessor("subject", {
        header: "Activity",
        cell: (info) => {
          const row = info.row.original;
          const { deal, lead, description, meeting, email } = row;

          return (
            <div className="flex flex-col gap-1 py-2">
              {/* Activity title */}
              <div className="font-medium text-gray-900">{info.getValue()}</div>

              {/* Description */}
              {description && (
                <div className="text-sm text-gray-500">{description}</div>
              )}

              {/* Meeting info */}
              {meeting && (
                <div className="text-xs text-gray-600">
                  Type:{" "}
                  <span className="font-medium capitalize">
                    {meeting.agenda}
                  </span>
                  {meeting.location && (
                    <span className="ml-2">Location: {meeting.location}</span>
                  )}
                </div>
              )}

              {/* Email info */}
              {email && (
                <div className="text-xs text-gray-600">
                  Subject: {email.subject}
                </div>
              )}

              {/* Deal or Lead context */}
              {deal ? (
                <div className="text-xs text-gray-700">
                  <span className="font-medium text-gray-900">Deal:</span>{" "}
                  {deal.title} •{" "}
                  <span className="capitalize">{deal.currentStatus}</span> •{" "}
                  <span>
                    {deal.value} {deal.currency}
                  </span>
                </div>
              ) : lead ? (
                <div className="text-xs text-gray-700">
                  <span className="font-medium text-gray-900">Lead:</span>{" "}
                  {lead.name} •{" "}
                  <span className="capitalize">{lead.status}</span> • Source:{" "}
                  <span className="capitalize">{lead.source}</span>
                </div>
              ) : null}
            </div>
          );
        },
        size: 350,
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: (info) => <ActivityTypeBadge type={info.getValue()} />,
        size: 120,
      }),
      columnHelper.accessor("scheduledAt", {
        header: "Scheduled",
        cell: (info) => {
          const date = info.getValue();
          if (!date) return <span className="text-gray-400">-</span>;
          return (
            <div className="flex flex-col gap-0.5">
              <div className="text-sm text-gray-900">
                {new Date(date).toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(date).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>
          );
        },
        size: 130,
      }),
      columnHelper.accessor("duration", {
        header: "Duration",
        cell: (info) => {
          const duration = info.getValue();
          if (!duration) return <span className="text-gray-400">-</span>;
          return (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Clock size={14} />
              {duration} min
            </div>
          );
        },
        size: 100,
      }),
      columnHelper.accessor("assignedToUser", {
        header: "Assignee",
        cell: (info) =>
          !!info.getValue() ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                {info
                  .getValue()
                  ?.name.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {info.getValue()?.name}
                </span>
              </div>
            </div>
          ) : (
            <span>unassigned</span>
          ),
        size: 180,
      }),
      // columnHelper.display({
      //   id: "actions",
      //   header: "",
      //   cell: () => (
      //     <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
      //       <MoreHorizontal size={16} className="text-gray-500" />
      //     </button>
      //   ),
      //   size: 50,
      // }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 capitalize tracking-wider"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox size={48} className="text-gray-300" />
                    <p className="text-gray-500 font-medium">
                      No activities found
                    </p>
                    <p className="text-sm text-gray-400">
                      Try adjusting your filters
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isTask = row.original.type === "task" && row.original.task?.id;
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (isTask) {
                        setSelectedTaskId(row.original.task.id);
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-1">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Task Sheet */}
      <Sheet open={!!selectedTaskId} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Task Details</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {selectedTaskId && <TaskSheet taskId={selectedTaskId} />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
