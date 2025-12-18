import { useCallback, useEffect, useState } from "react";
import { taskStatusEnum } from "~/db/schema";
import { Task } from "~/db/types";
import { KanbanCard } from "./kanban-card";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useTaskModalStore } from "~/store/use-add-task-modal-store";
import { Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { TaskSheet } from "~/components/task-sheet";

export type TaskStatus = (typeof taskStatusEnum)[number];

type TasksState = {
  [key in TaskStatus]: Task[];
};

interface DataKanbanProps {
  data: Task[];
  onChange: (
    tasks: { id: string; status: TaskStatus; position: number }[]
  ) => void;
  isReadOnly?: boolean;
}

export const DataKanban = ({ data, onChange, isReadOnly = false }: DataKanbanProps) => {
  const onOpen = useTaskModalStore((state) => state.onOpen);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TasksState>(() => {
    const initialTasks: TasksState = {
      backlog: [],
      todo: [],
      "in-progress": [],
      done: [],
    };

    data.forEach((task) => {
      initialTasks[task.status].push(task);
    });

    Object.keys(initialTasks).forEach((status) => {
      initialTasks[status as TaskStatus].sort(
        (a, b) => a.position - b.position
      );
    });

    return initialTasks;
  });

  useEffect(() => {
    const newTasks: TasksState = {
      backlog: [],
      todo: [],
      "in-progress": [],
      done: [],
    };

    data.forEach((task) => {
      newTasks[task.status].push(task);
    });

    Object.keys(newTasks).forEach((status) => {
      newTasks[status as TaskStatus].sort((a, b) => a.position - b.position);
    });

    setTasks(newTasks);
  }, [data]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (isReadOnly) return;
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    const updatesPayload: { id: string; status: TaskStatus; position: number }[] =
      [];

    setTasks((prevTasks) => {
      const newTasks = { ...prevTasks };

      const sourceColumn = [...newTasks[sourceStatus]];
      const [movedTask] = sourceColumn.splice(source.index, 1);
      if (!movedTask) {
        console.error("No task found at the source index");
        return prevTasks;
      }

      const updatedMovedTask =
        sourceStatus !== destStatus
          ? { ...movedTask, status: destStatus }
          : movedTask;

      // update source column
      newTasks[sourceStatus] = sourceColumn;

      // add the task to the new destination column
      const destColumn = [...newTasks[destStatus]];
      destColumn.splice(destination.index, 0, updatedMovedTask);
      newTasks[destStatus] = destColumn;

      // always payload
      updatesPayload.push({
        id: updatedMovedTask.id,
        status: destStatus,
        position: Math.min((destination.index + 1) * 1000, 1_000_000),
      });

      //  UPdate positions for affected tasks in the destination column
      newTasks[destStatus].forEach((task, index) => {
        if (task && task.id !== updatedMovedTask.id) {
          const newPosition = Math.min((index + 1) * 1000, 1_000_000);
          if (task.position !== newPosition) {
            updatesPayload.push({
              id: task.id,
              status: destStatus,
              position: newPosition,
            });
          }
        }
      });

      if (sourceStatus !== destStatus) {
        newTasks[sourceStatus].forEach((task, index) => {
          if (task) {
            const newPosition = Math.min((index + 1) * 1000, 1_000_000);
            if (task.position !== newPosition) {
              updatesPayload.push({
                id: task.id,
                status: sourceStatus,
                position: newPosition,
              });
            }
          }
        });
      }

      return newTasks;
    });

    onChange(updatesPayload);
  }, []);

  if (isReadOnly) {
    return (
      <>
        <div className="flex overflow-x-auto">
          {taskStatusEnum.map((status) => (
            <div className="flex-1 mx-2 bg-muted p-1.5 rounded" key={status}>
              <div className="flex items-center mb-1.5 justify-between">
                <h3 className="capitalize">{status}</h3>
                <Badge variant={status === "backlog" ? "destructive" : "default"}>
                  {tasks[status].length}
                </Badge>
              </div>
              <div className="min-w-200px mb-1.5">
                {tasks[status].map((task) => (
                  <div key={task.id}>
                    <KanbanCard task={task} onTaskClick={setSelectedTaskId} />
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full gap-2 bg-transparent"
                size="sm"
                disabled
              >
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </div>
          ))}
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
      </>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex overflow-x-auto">
        {taskStatusEnum.map((status) => (
          <div className="flex-1 mx-2 bg-muted p-1.5 rounded" key={status}>
            <div className="flex items-center mb-1.5 justify-between">
              <h3 className="capitalize">{status}</h3>
              <Badge variant={status === "backlog" ? "destructive" : "default"}>
                {tasks[status].length}
              </Badge>
            </div>
            <Droppable droppableId={status}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="min-w-200px mb-1.5"
                >
                  {tasks[status].map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <KanbanCard task={task} onTaskClick={setSelectedTaskId} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            <Button
              variant="outline"
              className="w-full gap-2 bg-transparent"
              size="sm"
              onClick={onOpen}
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        ))}
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
    </DragDropContext>
  );
};
