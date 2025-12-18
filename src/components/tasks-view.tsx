"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Inbox,
  MoreHorizontal,
  Tag,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { TaskSheet } from "./task-sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Task, Deal, Lead } from "~/db/types";

type taskUser = { id: string; name: string; email?: string };

type TaskWithUser = Task & {
  activity: {
    assignedToUser: taskUser | null;
    deal: Deal | null;
    lead: Lead;
    createdByUser: taskUser;
  };
};

interface TasksViewProps {
  tasks: TaskWithUser[];
}

// Status badge component
const StatusBadge = ({ status }: { status: Task["status"] }) => {
  const config = {
    todo: {
      icon: Circle,
      label: "To Do",
      color: "bg-gray-100 text-gray-700 border-gray-300",
    },
    "in-progress": {
      icon: Clock,
      label: "In Progress",
      color: "bg-blue-100 text-blue-700 border-blue-300",
    },
    done: {
      icon: CheckCircle2,
      label: "Done",
      color: "bg-green-100 text-green-700 border-green-300",
    },
    backlog: {
      icon: Inbox,
      label: "Backlog",
      color: "bg-purple-100 text-purple-700 border-purple-300",
    },
  };

  const { icon: Icon, label, color } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${color}`}
    >
      <Icon size={14} />
      {label}
    </span>
  );
};

// Reference type badge
const ReferenceBadge = ({
  type,
  id,
}: {
  type: "lead" | "deal";
  id: string;
}) => {
  const color =
    type === "lead"
      ? "bg-amber-100 text-amber-700 border-amber-300"
      : "bg-indigo-100 text-indigo-700 border-indigo-300";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${color}`}
    >
      <Tag size={12} />
      {type.toUpperCase()} #{id.slice(-4)}
    </span>
  );
};

// User Avatar Component
const UserAvatar = ({ user }: { user: taskUser }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
        {user.name
          .split(" ")
          .map((n) => n[0])
          .join("")}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">{user.name}</span>
        <span className="text-xs text-gray-500">{user.email}</span>
      </div>
    </div>
  );
};

const columnHelper = createColumnHelper<TaskWithUser>();

const TaskView: React.FC<TasksViewProps> = ({ tasks }) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Task",
        cell: (info) => {
          const { deal, lead } = info.row.original.activity;
          return (
            <div className="flex flex-col gap-2 py-2">
              <div className="font-medium text-gray-900">{info.getValue()}</div>
              {info.row.original.description && (
                <div className="text-sm text-gray-500">
                  {info.row.original.description}
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
        size: 280,
      }),
      columnHelper.accessor("dueDate", {
        header: "Due Date",
        cell: (info) => {
          const dueDate = info.getValue();
          if (!dueDate) {
            return (
              <span className="text-sm text-gray-400 italic">No due date</span>
            );
          }

          const date = new Date(dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const due = new Date(date);
          due.setHours(0, 0, 0, 0);

          const isOverdue = due < today;
          const isDueToday = due.getTime() === today.getTime();

          let colorClass = "text-gray-600";
          if (isOverdue) colorClass = "text-red-600 font-medium";
          else if (isDueToday) colorClass = "text-orange-600 font-medium";

          return (
            <div className={`flex items-center gap-1.5 text-sm ${colorClass}`}>
              <Calendar size={14} />
              {date.toLocaleDateString()}
              {isOverdue && <span className="text-xs">(Overdue)</span>}
              {isDueToday && <span className="text-xs">(Today)</span>}
            </div>
          );
        },
        size: 140,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
        size: 140,
      }),
      columnHelper.accessor((info) => info.activity.assignedToUser, {
        id: "assignee",
        header: "Assignee",
        cell: (info) => {
          const assignedUser = info.getValue();
          if (!assignedUser) {
            return (
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <User size={14} />
                Unassigned
              </div>
            );
          }
          return <UserAvatar user={assignedUser} />;
        },
        size: 200,
      }),
      columnHelper.accessor((info) => info.activity.createdByUser, {
        id: "createdBy",
        header: "Created By",
        cell: (info) => {
          const creator = info.getValue();
          return <UserAvatar user={creator} />;
        },
        size: 200,
      }),
      columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (info) => (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Clock size={14} />
            {new Date(info.getValue()).toLocaleDateString()}
          </div>
        ),
        size: 120,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: () => (
          <button className="p-2 hover:bg-gray-100 rounded-md transition-colors">
            <MoreHorizontal size={16} className="text-gray-500" />
          </button>
        ),
        size: 50,
      }),
    ],
    []
  );

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize() }}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Inbox size={48} className="text-gray-300" />
                  <p className="text-gray-500 font-medium">No tasks found</p>
                  <p className="text-sm text-gray-400">
                    Try adjusting your filters
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                data-state={row.getIsSelected() && "selected"}
                onClick={() => setSelectedTaskId(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="px-6 py-4 border-t flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {table.getRowModel().rows.length} of {tasks.length} tasks
        </div>
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

export default TaskView;
