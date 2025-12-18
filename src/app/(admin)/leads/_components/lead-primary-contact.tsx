"use client";

import { Contact, Lead } from "~/db/types";

interface LeadContactProps {
  lead?: Lead;
  contact: Contact | undefined;
}

export function PrimaryContact({ contact, lead }: LeadContactProps) {
  return (
    <div className="flex w-full">
      {/* contact info */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">
          {contact?.firstName} {contact?.lastName}
        </h3>
        <div className="flex gap-2">
          <p className="text-foreground/80">{lead?.name}</p>
          <p className="text-foreground/80">
            {contact?.email ?? "Update Email"}{" "}
          </p>
        </div>
      </div>
    </div>
  );
}
