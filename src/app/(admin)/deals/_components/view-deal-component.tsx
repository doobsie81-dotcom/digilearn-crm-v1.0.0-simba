"use client";
import React, { useState } from "react";
import {
  Plus,
  Activity,
  Target,
  UserRoundPlus,
  Calendar1,
  BadgeInfo,
  Users2,
  Building2,
  Blocks,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { trpc } from "~/trpc/client";
import DealLead from "~/components/deal-lead-details";
import AddOptionCombo from "~/components/add-option";
import CustomDatePicker from "~/components/custom-date-picker";
import { Deal, User } from "~/db/types";
import DealStakeholderManager from "~/components/update-deal-stakeholders";
import PageHeader from "~/components/page-header";
import { Card } from "~/components/ui/card";
import DealStageTracker from "~/components/deal-stages-tracker";
import { DealActvitiesNav } from "./deal-activities-nav";
import { DealTasks } from "./deal-tasks";
import { Skeleton } from "~/components/ui/skeleton";
import { DealMeetings } from "./deal-meetings";
import { DealNotes } from "./deal-notes";
import { Alert, AlertTitle, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { DealEmails } from "./deal-emails";
import { DealActivities } from "./deal-activities";
import { StakeholderItem } from "./stakeholder-item";
import { DealDocuments } from "./deal-documents";
import { CallRecorder } from "~/components/call-recorder";
import { FileManager } from "~/components/file-manager";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { useAbility } from "~/hooks/use-ability";
import { subject } from "@casl/ability";
import { can } from "~/lib/get-user-permissions";
import { toast } from "sonner";

interface ViewDealProps {
  id: string | null;
}

export const DealTabs = [
  "activities",
  "tasks",
  "meetings",
  "emails",
  "calls",
  "notes",
  "files",
] as const;
export type DealTab = (typeof DealTabs)[number];

const ViewDealComponent: React.FC<ViewDealProps> = ({ id }) => {
  const abilities = useAbility();
  const [activeTab, setActiveTab] = useState<DealTab>("activities");
  // const [isEditingItems, setIsEditingItems] = useState(false);
  const [isStakeholderManagerOpen, setIsStakeholderManagerOpen] =
    useState(false);

  const utils = trpc.useUtils();
  const { data: deal, isLoading } = trpc.deals.getDealDetails.useQuery(
    id ?? "",
    {
      enabled: !!id,
    }
  );

  const { data: pipelineStages } = trpc.pipelines.getPipelines.useQuery(
    { stage: "" },
    {
      enabled: !!id,
    }
  );

  // Only fetch users if the current user has permission to read users
  const canViewUsers = abilities.can(
    "read",
    subject("User", { id: "dummy_user_id" } as User)
  );

  const { data: users } = trpc.users.getByRole.useQuery(
    {
      roles: ["sales-agent", "sales-manager"],
    },
    { enabled: !!id && canViewUsers }
  );

  //const totalAmount = deal.items.reduce((sum, item) => sum + item.total, 0);

  const addAssigneeMutate = trpc.deals.addAssignee.useMutation({
    onSuccess: () => {
      utils.deals.getDealDetails.invalidate();
    },
  });

  const updateStageMutate = trpc.deals.updateStage.useMutation({
    onSuccess: async () => {
      utils.deals.getDealDetails.invalidate();
    },
  });

  const calculateDealHealth = trpc.deals.calculateDealHealth.useMutation({
    onSuccess: () => {
      utils.deals.getDealDetails.invalidate();
    },
    onError: (error) => {
      utils.deals.getDealDetails.invalidate();
    }
  });

  const handleAddAssignee = async (value: string) => {
    try {
      if (!id) return;

      await addAssigneeMutate.mutateAsync({
        id,
        assignee: value,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleUpdateStage = async (stageId: string) => {
    try {
      if (!id) return;

      await updateStageMutate.mutateAsync({
        id,
        status: stageId,
      });
      await calculateDealHealth.mutateAsync(id);
      toast.success("Deal stage updated successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to update deal stage");
    }
  };

  if (isLoading) {
    <div className="grid grid-cols-6 gap-x-6">
      <Skeleton className="col-span-2 h-32" />
      <div className="col-span-4 space-y-4">
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
      </div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        hasBackButton
        title={isLoading ? null : !deal ? null : deal?.lead.name}
        actions={
          deal?.closeStatus !== "ongoing" && (
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline">Archived</Badge>
            </div>
          )
        }
      />

      {isLoading ? (
        <div>
          <p>Loading...</p>
        </div>
      ) : !deal ? (
        <div>Please select a deal to continue</div>
      ) : can(
          abilities,
          "read",
          subject("Deal", { assignedTo: deal.assignedTo!.id } as Deal)
        ) ? (
        <div className="space-y-6">
          {deal.closeStatus !== "ongoing" && (
            <div>
              <Alert
                variant={deal.closeStatus === "won" ? "default" : "destructive"}
              >
                <AlertTitle>
                  {deal.closeStatus === "won"
                    ? "Deal Was Won!"
                    : "Deal Was Lost!"}
                </AlertTitle>
                <AlertDescription>
                  {deal.closeStatus === "won"
                    ? "Congratulations, Another deal won."
                    : `Well, try again, keep pushing! Deal was lost. ${deal.lostReason ? `Reason: ${deal.lostReason}` : ""}`}
                </AlertDescription>
              </Alert>
            </div>
          )}
          <div className="grid grid-cols-6 gap-6 relative">
            <Card className="col-span-2 max-h-screen">
              <div className="h-full px-4">
                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  defaultValue="lead-info"
                >
                  <AccordionItem value="lead-info">
                    <AccordionTrigger>
                      <div className="flex items-center gap-x-2 text-sm">
                        <Building2 className="w-5 h-5" />
                        Lead Information
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                      <DealLead
                        lead={deal.lead}
                        company={deal.company}
                        value={deal.value}
                      />
                      <div className="space-y-4">
                        {canViewUsers && users && users.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="max-w-100 flex items-center">
                              <UserRoundPlus className="h-4 w-4 mr-2" />
                              <p className="text-sm truncate">Assignee</p>
                            </div>
                            <div className="flex-1">
                              <AddOptionCombo
                                options={(users || []).map((user) => ({
                                  label: `${user.name || user.email}`,
                                  value: user.id,
                                }))}
                                placeholder="Add assignee"
                                onSelect={handleAddAssignee}
                                value={deal.assignedTo?.id}
                                isPending={addAssigneeMutate.isPending}
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <div className="max-w-100 flex items-center">
                            <BadgeInfo className="h-4 w-4 mr-2" />
                            <p className="text-sm truncate">Status</p>
                          </div>
                          <div className="flex-1">
                            <AddOptionCombo
                              options={(pipelineStages || []).map((stage) => ({
                                label: `${stage.name}`,
                                value: stage.id,
                              }))}
                              placeholder="Update Stage"
                              onSelect={handleUpdateStage}
                              value={deal.currentStageId}
                              isPending={updateStageMutate.isPending}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="max-w-100 flex items-center">
                            <Calendar1 className="h-4 w-4 mr-2" />
                            <p className="text-sm truncate">Due</p>
                          </div>
                          <div className="flex-1">
                            <CustomDatePicker
                              onSelectChange={(date: Date | undefined) => {
                                console.log(date);
                              }}
                              value={deal.expectedCloseDate ?? undefined}
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="stakeholders">
                    <AccordionTrigger>
                      <div className="flex items-center gap-x-2 text-sm">
                        <Users2 className="h-4 w-4 mr-2" />
                        Stakeholders
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="ml-auto">
                            <Button
                              variant="link"
                              type="button"
                              onClick={() => setIsStakeholderManagerOpen(true)}
                              className="pr-0"
                            >
                              <Plus className="h-4 w-4" />
                              Add Stakeholders
                            </Button>
                            <DealStakeholderManager
                              dealId={deal.id}
                              leadContacts={deal.lead.contactAssociations || []}
                              open={isStakeholderManagerOpen}
                              onOpenChange={() =>
                                setIsStakeholderManagerOpen(false)
                              }
                            />
                          </div>
                        </div>
                        {deal.stakeholders?.length === 0 ? (
                          <div className="w-full">
                            <p className="text-muted-foreground text-sm line-clamp-2 truncate">
                              No Stakeholders recorded see deal contacts to
                              engage.
                            </p>
                          </div>
                        ) : (
                          deal.stakeholders.map((stakeholder) => (
                            <StakeholderItem
                              key={stakeholder.id}
                              stakeholder={stakeholder}
                            />
                          ))
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="products">
                    <AccordionTrigger>
                      <div className="flex items-center gap-x-2 text-sm">
                        <Blocks className="h-4 w-4 mr-2" />
                        Products
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                      <DealDocuments deal={deal} />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="health">
                    <AccordionTrigger>
                      <div className="flex items-center gap-x-2 text-sm">
                        <Activity className="w-5 h-5" />
                        Health
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              Probability
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              {deal.probability}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              Calculated Health
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              {deal.healthScore}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${deal.healthScore}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">
                                Stakeholder Engagement
                              </span>
                              <span className="font-medium">
                                {deal.healthScoreStakeholderEngagement}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Timing</span>
                              <span className="font-medium">
                                {deal.healthScoreTiming}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Competition</span>
                              <span className="font-medium">
                                {deal.healthScoreCompetition}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Budget</span>
                              <span className="font-medium">
                                {deal.healthScoreBudget}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="competitors">
                    <AccordionTrigger>
                      <div className="flex items-center gap-x-2 text-sm">
                        <Target className="w-5 h-5" />
                        Competitors
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Competitors
                          </h2>
                          <button className="text-blue-600 hover:text-blue-700">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {deal.competitors.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">
                            No competitors identified
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {deal.competitors.map((competitor, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-gray-50 rounded border border-gray-200"
                              >
                                <p className="text-sm font-medium text-gray-900">
                                  {competitor.competitorName}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </Card>
            <div className="space-y-6 col-span-4 ">
              <DealStageTracker deal={deal} dealStages={deal.stageHistory} />
              {/* tabs */}
              <DealActvitiesNav
                activeTab={activeTab}
                onTabSelect={setActiveTab}
              />
              <div className="bg-background p-2.5 rounded-md max-h-[calc(100vh-400px)] overflow-y-auto">
                {activeTab === "activities" && (
                  <DealActivities dealId={deal.id} leadId={deal.leadId} />
                )}
                {activeTab === "tasks" && (
                  <DealTasks
                    users={users || []}
                    leadId={deal.leadId}
                    id={deal.id}
                  />
                )}
                {activeTab === "meetings" && (
                  <DealMeetings
                    contacts={deal.lead.contactAssociations.map(
                      (contact) => contact.contact
                    )}
                    leadId={deal.leadId}
                    id={deal.id}
                  />
                )}
                {activeTab === "emails" && (
                  <DealEmails
                    contacts={deal.lead.contactAssociations.map(
                      (contact) => contact.contact
                    )}
                    leadId={deal.leadId}
                    id={deal.id}
                  />
                )}
                {activeTab === "notes" && (
                  <DealNotes users={[]} leadId={deal.leadId} dealId={deal.id} />
                )}
                {activeTab === "calls" && (
                  <CallRecorder dealId={deal.id} leadId={deal.leadId} />
                )}
                {activeTab === "files" && <FileManager dealId={deal.id} />}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>You do not have permission to view this deal.</div>
      )}
      {/* <Sheet open>
        <SheetContent>
          <p>Hello</p>
        </SheetContent>
      </Sheet> */}
    </div>
  );
};

export default ViewDealComponent;
