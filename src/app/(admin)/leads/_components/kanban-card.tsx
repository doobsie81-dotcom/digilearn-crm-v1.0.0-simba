import { format } from "date-fns";
import { Task } from "~/db/types";

interface KanbanCardProps {
  task: Task;
  onTaskClick?: (taskId: string) => void;
}

export const KanbanCard = ({ task, onTaskClick }: KanbanCardProps) => {
  return (
    <div
      className="bg-white p-2.5 mb-1.5 rounded shadow-sm space-y-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={(e) => {
        e.stopPropagation();
        onTaskClick?.(task.id);
      }}
    >
      <div className="flex items-start justify-between gap-x-2">
        <p className="text-sm line-clamp-2">{task.title}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">
          {format(task.dueDate, "dd-MM-yyyy")}
        </p>
      </div>
    </div>
  );
};
