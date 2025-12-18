"use client";

import { useState } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Building2, MapPin, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import AddVerificationModal from "~/components/modals/add-verification-modal";
import { Lead, Company, Contact, User } from "~/db/types";
import { AssigneeSelector } from "~/components/assignee-selector";
import { TagManager } from "~/components/tags/tag-manager";
import { LeadQualificationChecklist } from "~/components/lead-qualification-checklist";

interface Tag {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

interface LeadDetailsTabProps {
  leadData: Lead & { company?: Company | null; assignee: User | null };
  primaryContact: Contact | null;
  tags?: Tag[];
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode | null;
  handleUpdateAssignee: (leadId: string, assigneeId: string) => void;
  isPending: boolean;
  isActionsLocked?: boolean;
}

export function LeadDetailsTab({
  leadData,
  primaryContact,
  tags = [],
  getStatusColor,
  getStatusIcon,
  handleUpdateAssignee,
  isPending,
  isActionsLocked = false,
}: LeadDetailsTabProps) {
  const [isVerificationModalOpen, setVerifcationModalOpen] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        {/* Qualification Checklist */}
        <LeadQualificationChecklist
          leadId={leadData.id}
          isReadOnly={isActionsLocked}
        />
      </div>
      {/* Left Column - Main Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Company Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Company Overview</CardTitle>
            <CardDescription>Basic information about the lead</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Company Name
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {leadData.company?.name || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Primary Email
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {primaryContact?.email ?? "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Location
                  </p>
                  <p className="text-sm capitalizw text-muted-foreground text-pretty">
                    {leadData.company?.city},{leadData.company?.region}
                  </p>
                  <p className="text-sm capitalizw text-muted-foreground text-pretty">
                    {leadData.company?.province}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Primary Phone
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {primaryContact?.phoneNumber ?? "Not Provided"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 ">
              <AssigneeSelector
                currentAssignee={leadData.assignee}
                onAssigneeChange={(assigneeId) => {
                  if (assigneeId !== null) {
                    handleUpdateAssignee(leadData.id, assigneeId);
                  }
                }}
                layout="stacked"
                isPending={isPending}
                entityType="Lead"
                entityId={leadData.id}
              />
            </div>
            {/* <div className="pt-2 border-t">
              <TagManager leadId={leadData.id} currentTags={tags} />
            </div> */}

            <div className="grid gap-4 sm:grid-cols-2 ">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created
                </p>
                {leadData.createdAt && (
                  <>
                    <p className="mt-1 text-sm text-foreground">
                      {format(new Date(leadData.createdAt), "MMMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(leadData.createdAt), "MMMM d, yyyy")}
                    </p>
                  </>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </p>
                {leadData.updatedAt && (
                  <>
                    <p className="mt-1 text-sm text-foreground">
                      {format(new Date(leadData.updatedAt), "MMMM d, yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(leadData.updatedAt), "HH:mm")}
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <AddVerificationModal
          isOpen={isVerificationModalOpen}
          handleClose={() => setVerifcationModalOpen(false)}
          leadId={leadData.id}
          initialData={{
            primaryEmail: primaryContact?.email ?? "",
            primaryPhoneNumber: primaryContact?.phoneNumber ?? "",
            emailVerified: leadData.emailVerified || false,
            phoneNumberVerified: leadData.phoneNumberVerified || false,
          }}
        />
      </div>
    </div>
  );
}
