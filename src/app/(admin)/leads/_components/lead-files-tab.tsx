"use client";

import { FileManager } from "~/components/file-manager";

interface LeadFilesTabProps {
  leadId: string;
}

export function LeadFilesTab({ leadId }: LeadFilesTabProps) {
  return (
    <div className="max-w-full">
      <FileManager leadId={leadId} />
    </div>
  );
}
