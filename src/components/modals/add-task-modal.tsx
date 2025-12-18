"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import Modal from "../ui/modal";
import { TaskFormValues } from "~/validation/tasks";
import { taskStatusEnum } from "~/db/schema";
import { User } from "~/db/types";
import AddOptionCombo from "../add-option";
import { useTaskModalStore } from "~/store/use-add-task-modal-store";
import CustomDatePicker from "../custom-date-picker";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "~/lib/utils";

interface AddTaskModalProps {
  onClose: () => void;
  onSubmit: (data: TaskFormValues) => void;
  isPending: boolean;
  users: User[];
}

export default function AddTaskModal({
  onClose,
  onSubmit,
  isPending,
  users,
}: AddTaskModalProps) {
  const form = useFormContext<TaskFormValues>();
  const isOpen = useTaskModalStore((state) => state.isOpen);

  return (
    <Modal
      title="Add New Task"
      description="Create a new task"
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Title</FormLabel>
              <FormControl>
                <Input placeholder="New Task" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {taskStatusEnum.map((status) => (
                    <SelectItem
                      key={status}
                      value={status}
                      className="capitalise"
                    >
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        {users && users.length > 0 && (
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Assignee</FormLabel>
                <FormControl>
                  <AddOptionCombo
                    options={(users || []).map((user) => ({
                      label: `${user.name || user.email}`,
                      value: user.id,
                    }))}
                    placeholder="Add assignee"
                    onSelect={field.onChange}
                    value={field.value}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Due Date</FormLabel>
              <CustomDatePicker
                trigger={
                  <FormControl>
                    <Button
                      variant="outline"
                      type="button"
                      className={cn(
                        "pl-3 text-left font-normal w-full",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                }
                value={field.value}
                onSelectChange={field.onChange}
              />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
