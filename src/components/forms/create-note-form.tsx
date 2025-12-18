"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { trpc } from "~/trpc/client";
import { createNoteSchema, CreateNoteValues } from "~/validation/notes";
import { Form, FormControl, FormField, FormItem } from "../ui/form";
import { LexEditor } from "~/components/lexical-editor";
import { WithContext as ReactTags, type Tag } from "react-tag-input";
import { useState } from "react";
import { Button } from "../ui/button";

interface CreateNoteFormProps {
  leadId: string;
  dealId?: string;
}

export const CreateNoteForm = ({ leadId, dealId }: CreateNoteFormProps) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const form = useForm<CreateNoteValues>({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      leadId,
      dealId,
    },
  });

  const utils = trpc.useUtils();
  const createNoteMutation = trpc.notes.addNote.useMutation({
    onSuccess: () => {
      utils.notes.getLeadNotes.invalidate();
      if (dealId) {
        utils.notes.getDealNotes.invalidate();
      }
      toast.success("Note was added successfully");
      form.reset();
      setTags([]);
    },
    onError: () => {
      toast.error("There was an error adding your note");
    },
  });

  const handleSubmit = async (data: CreateNoteValues) => {
    try {
      await createNoteMutation.mutateAsync(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddition = (tag: Tag) => {
    const newTags = [...tags, tag];
    setTags(newTags);
    form.setValue("tags", newTags.join(", "));
  };

  const handleDelete = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    setTags(newTags);
    form.setValue("tags", newTags.join(", "));
  };
  const onClearAll = () => {
    setTags([]);
    form.setValue("tags", "");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          name="note"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <LexEditor value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name="tags"
          control={form.control}
          render={() => (
            <FormItem className="flex justify-between items-center border-t border-input bg-muted gap-x-2 p-2.5">
              <FormControl>
                <ReactTags
                  tags={tags}
                  separators={["Enter", "Comma"]}
                  handleDelete={handleDelete}
                  handleAddition={handleAddition}
                  editable
                  clearAll
                  onClearAll={onClearAll}
                  maxTags={7}
                  inputFieldPosition="inline"
                  classNames={{
                    tag: "bg-primary/30 text-xs rounded-sm px-2 py-1.5",
                    tags: "flex items-center flex-row gap-x-2",
                    remove: "ml-2 text-muted-foreground",
                    tagInputField:
                      "focus:outline-none h-9 bg-transparent px-3 py-1 text-base",
                  }}
                />
              </FormControl>
              <Button size="sm" type="submit">
                {createNoteMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};
