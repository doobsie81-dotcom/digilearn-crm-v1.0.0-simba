"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { EmailItem } from "~/components/email-item";
import { EmailComposerModal } from "~/components/modals/compose-email-modal";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Form } from "~/components/ui/form";
import { Contact, Email } from "~/db/types";
import { useComposeEmailModalStore } from "~/store/use-compose-email-modal-store";
import {
  composeEmailSchema,
  ComposeEmailFormValues,
} from "~/validation/emails";

interface DealEmailsProps {
  id: string | null;
  leadId: string;
  contacts: Contact[];
}

export const DealEmails = ({ leadId, id, contacts }: DealEmailsProps) => {
  const onOpen = useComposeEmailModalStore((state) => state.onOpen);
  const onClose = useComposeEmailModalStore((state) => state.onClose);
  const [emails, setEmails] = useState<Email[]>([
    {
      id: "1",
      subject: "Sample Email",
      recipients: "john@example.com, jane@example.com",
      body: "This is a sample email body.",
      createdAt: new Date(),
      updatedAt: new Date(),
      leadId,
      dealId: id!,
      activityId: "687646487jhfhbnlkjn",
      composerId: "7tfkfot087",
    },
  ]);

  const composeEmailForm = useForm<ComposeEmailFormValues>({
    resolver: zodResolver(composeEmailSchema),
    defaultValues: {
      recipients: [],
      subject: "",
      body: "",
      leadId,
      dealId: id!,
    },
  });

  // TODO: Replace with actual tRPC query
  // const { data: emails } = trpc.deals.getEmails.useQuery({ dealId });
  // const deleteEmailMutation = trpc.deals.deleteEmail.useMutation();

  const handleDeleteEmail = (emailId: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== emailId));
    // TODO: Call delete mutation
    // deleteEmailMutation.mutate({ emailId });
  };

  const handleClose = () => {
    onClose();
    composeEmailForm.reset();
  };

  const handleSubmitEmail = (data: ComposeEmailFormValues) => {
    // TODO: Call mutation to save email to database
    // createEmailMutation.mutate({ dealId, ...data });
    console.log(data)
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center">
        <Button onClick={onOpen}>
          <Plus className="w-4 h-4 mr-2" />
          Compose Email
        </Button>
      </div>

      <div className="space-y-2">
        {emails.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No emails yet. Start by composing one!</p>
          </Card>
        ) : (
          emails.map((email) => (
            <EmailItem
              key={email.id}
              email={email}
              onDelete={handleDeleteEmail}
            />
          ))
        )}
      </div>
      <Form {...composeEmailForm}>
        <EmailComposerModal
          onClose={handleClose}
          onSubmit={handleSubmitEmail}
          contacts={contacts}
        />
      </Form>
    </div>
  );
};
