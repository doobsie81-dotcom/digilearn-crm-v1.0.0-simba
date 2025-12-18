"use client";

import { trpc } from "~/trpc/client";
import { DataKanban, TaskStatus } from "../../leads/_components/data-kanban";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskFormValues, addTaskSchema } from "~/validation/tasks";
import { Form } from "~/components/ui/form";
import { User } from "~/db/types";
import AddTaskModal from "~/components/modals/add-task-modal";
import { useTaskModalStore } from "~/store/use-add-task-modal-store";
import { toast } from "sonner";

interface DealTasksProps {
  id: string | null;
  users: User[];
  leadId: string;
}

export const DealTasks = ({ id, users, leadId }: DealTasksProps) => {
  const onClose = useTaskModalStore((state) => state.onClose);
  const utils = trpc.useUtils();
  const { data: tasks } = trpc.tasks.getDealTasks.useQuery(
    { dealId: id! },
    { enabled: !!id }
  );
  const { mutateAsync: createTask, isPending: isCreatingTask } =
    trpc.tasks.createTask.useMutation();

  const { mutateAsync: bulkUpdate } =
    trpc.tasks.bulkUpdate.useMutation();

  const handleOnCreateTask = async (data: TaskFormValues) => {
    try {
      await createTask(data, {
        onSuccess: () => {
          utils.tasks.getDealTasks.invalidate();
        },
      });
      toast.success("New task was created!");
      handleOnCloseTaskModal();
    } catch (error) {
      console.log(error);
    }
  };

  const handleOnCloseTaskModal = () => {
    onClose();
    taskForm.reset();
  };

  const onKanbanChange = async (
    tasks: { id: string; status: TaskStatus; position: number }[]
  ) => {
    await bulkUpdate({
      tasks,
    });
  };

  const taskForm = useForm<TaskFormValues>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      title: "",
      status: "todo",
      leadId: leadId,
      dealId: id!,
      assignedTo: "",
    },
  });

  if (!id) {
    return null;
  }

  return (
    <div>
      <DataKanban
        data={tasks || []}
        onChange={onKanbanChange}
        //users={}
      />
      <Form {...taskForm}>
        <AddTaskModal
          isPending={isCreatingTask}
          onSubmit={handleOnCreateTask}
          onClose={handleOnCloseTaskModal}
          users={users || []}
        />
      </Form>
    </div>
  );
};
