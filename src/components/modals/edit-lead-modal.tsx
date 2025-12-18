"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Lead } from "~/db/types";
import { leadSourceEnum } from "~/db/schema";

const editLeadSchema = z.object({
  name: z.string().min(1, "Lead name is required"),
  source: z.enum(leadSourceEnum),
  estimatedValue: z.number().optional(),
});

type EditLeadFormValues = z.infer<typeof editLeadSchema>;

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditLeadFormValues) => void;
  leadData: Lead;
  isPending: boolean;
}

export function EditLeadModal({
  isOpen,
  onClose,
  onSubmit,
  leadData,
  isPending,
}: EditLeadModalProps) {
  const form = useForm<EditLeadFormValues>({
    resolver: zodResolver(editLeadSchema),
    defaultValues: {
      name: leadData.name,
      source: leadData.source,
      estimatedValue: leadData.estimatedValue
        ? parseFloat(leadData.estimatedValue)
        : undefined,
    },
  });

  const handleSubmit = (data: EditLeadFormValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>
            Update the lead information. Company cannot be changed here.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter lead name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leadSourceEnum.map((source) => (
                        <SelectItem key={source} value={source}>
                          <span className="capitalize">
                            {source.replace(/_/g, " ")}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Value (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
