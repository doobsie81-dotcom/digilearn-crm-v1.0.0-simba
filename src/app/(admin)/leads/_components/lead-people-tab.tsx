"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Mail, Phone, User, Briefcase, Trash } from "lucide-react";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
import { LeadContact, Contact } from "~/db/types";

interface LeadPeopleTabProps {
  contactAssociations: (LeadContact & { contact: Contact })[];
  onDeleteContact: (id: string) => Promise<void>;
  isPending: boolean;
}

export function LeadPeopleTab({
  contactAssociations,
  onDeleteContact,
  isPending,
}: LeadPeopleTabProps) {
  return (
    <div className="max-w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Contacts</CardTitle>
          <CardDescription>People associated with this lead</CardDescription>
          <CardAction></CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-x-4 space-y-4">
            {contactAssociations.map(({ role, contact }) => (
              <div
                key={contact.id}
                className="flex items-start gap-4 rounded-lg border border-border bg-muted/30 p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="font-medium text-foreground capitalize">
                      {contact.firstName} {contact.lastName} | {role}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground capitalize">
                        {contact.jobTitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {contact.email && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                    {contact.phoneNumber && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{contact.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-auto">
                  <ConfirmDialog
                    btnText={<Trash className="h-4 w-4" />}
                    onConfirm={() => onDeleteContact(contact.id)}
                    title="Are you sure?"
                    description="This action cannot be undone. This will permanently delete the contact."
                    confirmText={isPending ? "Deleting..." : "Delete"}
                    cancelText={isPending ? "Cancel" : "Cancel"}
                    isProcessing={isPending}
                    variant="destructive"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
