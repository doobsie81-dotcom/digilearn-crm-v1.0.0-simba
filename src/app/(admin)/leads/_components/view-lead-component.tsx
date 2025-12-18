"use client";

import { useMemo, useState, useEffect } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { LexEditor } from "~/components/lexical-editor";
import {
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  TrendingUp,
  Building2,
} from "lucide-react";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { leadSourceEnum, leadStatusEnum } from "~/db/schema";
import { useForm } from "react-hook-form";
import { addTaskSchema, TaskFormValues } from "~/validation/tasks";
import { zodResolver } from "@hookform/resolvers/zod";
import { TaskStatus } from "./data-kanban";
import { useTaskModalStore } from "~/store/use-add-task-modal-store";
import { AddMeetingValues, createMeetingSchema } from "~/validation/events";
import { useSession } from "~/lib/auth-client";
import { useAddMeetingModalStore } from "~/store/use-add-meeting-modal-store";
import PageHeader from "~/components/page-header";
import { useAbility } from "~/hooks/use-ability";
import { User as TUser } from "~/db/types";
import { subject } from "@casl/ability";
import { LeadDetailsTab } from "./lead-details-tab";
import { LeadActivityTab } from "./lead-activity-tab";
import { LeadFilesTab } from "./lead-files-tab";
import { LeadPeopleTab } from "./lead-people-tab";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useAddDealModalStore } from "~/store/use-deal-sheet-store copy";
import { AddDealValues, adddeals } from "~/validation/deals";
import AddNewDealModal from "~/components/modals/add-new-deal-modal";
import { Form } from "~/components/ui/form";
import { EditLeadModal } from "~/components/modals/edit-lead-modal";
import { Edit } from "lucide-react";
import { cn } from "~/lib/utils";

const LeadTabs = ["details", "activity", "files", "people"] as const;
type TabType = (typeof LeadTabs)[number];

// Extend the generated lead status union with the runtime-only action "convert"
// so handleStatusChange can accept that value from UI actions.
type LeadStatus = (typeof leadStatusEnum)[number] | "convert";

export default function LeadView({ id }: { id: string }) {
  const session = useSession();
  const utils = trpc.useUtils();
  const abilities = useAbility();
  const router = useRouter();
  const [leadData] = trpc.leads.getLead.useSuspenseQuery(id);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: "convert" | "qualified" | "unqualified" | null;
    title: string;
    description: string;
  }>({
    isOpen: false,
    action: null,
    title: "",
    description: "",
  });
  const [contactNoteDialog, setContactNoteDialog] = useState({
    isOpen: false,
    note: "",
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Only fetch users if the current user has permission to read users
  const canViewUsers = abilities.can(
    "read",
    subject("User", { id: "dummy_user_id" } as TUser)
  );
  const { data: users } = trpc.users.getByRole.useQuery(
    {
      roles: ["sales-agent", "sales-manager"],
    },
    {
      enabled: canViewUsers,
    }
  );
  const { data: tasks } = trpc.tasks.getLeadTasks.useQuery({ leadId: id });
  const {
    data: meetings,
    isLoading: loadingMeetings,
    error: meetingsError,
  } = trpc.events.getLeadMeetings.useQuery({
    leadId: id,
  });
  const { data: qualificationCriteria } = trpc.leadQualification.get.useQuery({
    leadId: id,
  });
  const updateLead = trpc.leads.updateLead.useMutation({
    onSuccess: () => {
      utils.leads.getLead.invalidate();
    },
  });
  const { mutateAsync: deleteContact, isPending } =
    trpc.leads.deleteContact.useMutation();

  const { mutateAsync: createMeeting, isPending: isCreatingMeeting } =
    trpc.events.schedule.useMutation();

  const { mutateAsync: createTask, isPending: isCreatingTask } =
    trpc.tasks.createTask.useMutation();

  const { mutateAsync: bulkUpdate } = trpc.tasks.bulkUpdate.useMutation();

  const { mutateAsync: addNote, isPending: isAddingNote } =
    trpc.notes.addNote.useMutation();

  // Deal creation queries and mutations
  const [pipelineStages] =
    trpc.pipelines.getPipelinesWithDeals.useSuspenseQuery({
      stage: "",
    });
  const { data: allLeads } = trpc.leads.getMany.useQuery({
    page: 1,
    pageSize: 100, // Get more leads for the dropdown
  });
  const { data: products } = trpc.products.list.useQuery({
    isActive: true,
    search: "",
  });
  const { mutateAsync: addDealMutation, isPending: isCreatingDeal } =
    trpc.deals.createDeal.useMutation();

  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [leadSearchValue, setLeadSearchValue] = useState("");
  const [productsSearchValue, setProductSearchValue] = useState("");
  const onClose = useTaskModalStore((state) => state.onClose);
  const onCloseMeetingModal = useAddMeetingModalStore((state) => state.onClose);
  const slotInfo = useAddMeetingModalStore((state) => state.slotInfo);

  const taskForm = useForm<TaskFormValues>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      title: "",
      status: "todo",
      leadId: id,
      assignedTo: "",
    },
  });

  const addMeetingForm = useForm<AddMeetingValues>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: {
      subject: "",
      leadId: id,
      assignedTo: "",
      scheduledAt: new Date(),
      platform: "in_person",
      attendees: session?.data?.user?.email ? [session?.data?.user.email] : [],
    },
  });

  const dealForm = useForm<AddDealValues>({
    resolver: zodResolver(adddeals),
    defaultValues: {
      title: "",
      description: "",
      value: 0,
      currency: "USD",
      probability: 0,
      items: [],
      competitors: [],
      stakeholders: [],
      leadId: "",
      currentStageId: "",
      expectedCloseDate: new Date(),
      assignedTo: "",
    },
  });

  const onOpenDealModal = useAddDealModalStore((state) => state.onOpen);
  const onCloseDealModal = useAddDealModalStore((state) => state.onClose);

  // Pre-fill form when slot is selected from calendar
  useEffect(() => {
    if (slotInfo) {
      const startDate = slotInfo.start;
      const endDate = slotInfo.end;

      addMeetingForm.setValue("startDate", format(startDate, "yyyy-MM-dd"));
      addMeetingForm.setValue("startTime", format(startDate, "HH:mm"));
      addMeetingForm.setValue("endDate", format(endDate, "yyyy-MM-dd"));
      addMeetingForm.setValue("endTime", format(endDate, "HH:mm"));
    }
  }, [slotInfo, addMeetingForm]);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    try {
      if (!leadData) {
        return false;
      }

      // Show confirmation for convert to deal (this creates a deal and marks as "converted")
      if (newStatus === "convert") {
        // Validation: Lead should be contacted or qualified before converting
        if (leadData.status !== "qualified") {
          toast.error(
            "Lead must be contacted or qualified before it can be converted to a deal"
          );
          return false;
        }

        // Validation: Check qualification criteria (must be >= 75%)
        // if (!qualificationCriteria?.isQualified) {
        //   const percentage = qualificationCriteria?.completionPercentage || 0;
        //   toast.error(
        //     `Lead qualification criteria not met. Current completion: ${percentage}%. Minimum required: 75%.`
        //   );
        //   return false;
        // }

        setConfirmDialog({
          isOpen: true,
          action: "convert",
          title: "Convert Lead to Deal",
          description:
            "Are you sure you want to convert this lead to a deal? This will create a new deal opportunity and mark the lead as converted.",
        });
        return;
      }

      // Show confirmation for marking as qualified (BANT qualified)
      if (newStatus === "qualified") {
        // Validation: Lead must be contacted before qualifying
        if (!leadData.lastContactedAt && leadData.status !== 'contacted') {
          toast.error("Lead must be contacted before it can be qualified");
          return false;
        }

        // Validation: Check qualification criteria (must be >= 75%)
        if (!qualificationCriteria?.isQualified) {
          const percentage = qualificationCriteria?.completionPercentage || 0;
          toast.error(
            `Lead qualification checklist not completed. Current completion: ${percentage}%. Minimum required: 75%.`
          );
          return false;
        }

        setConfirmDialog({
          isOpen: true,
          action: "qualified",
          title: "Mark Lead as Qualified",
          description:
            "Are you sure you want to mark this lead as qualified? This indicates the lead has been BANT qualified.",
        });
        return;
      }

      // Show confirmation for unqualified
      if (newStatus === "unqualified") {
        setConfirmDialog({
          isOpen: true,
          action: newStatus,
          title: "Mark Lead as Unqualified",
          description:
            "Are you sure you want to mark this lead as unqualified? This action can be reversed later.",
        });
        return;
      }

      await updateLead.mutateAsync({
        id: leadData.id,
        lead: { status: newStatus },
      });

      toast.success("Lead status updated successfully");
    } catch (error) {
      console.log(error);
      toast.error("Failed to update lead status");
    }
  };

  const handleConfirmAction = async () => {
    try {
      if (!confirmDialog.action || !leadData) return;

      if (confirmDialog.action === "convert") {
        // Pre-fill the deal form with lead data
        dealForm.setValue("leadId", leadData.id);
        dealForm.setValue("title", leadData.name);

        // Auto-fill value if estimatedValue is available
        if (leadData.estimatedValue) {
          dealForm.setValue("value", parseFloat(leadData.estimatedValue));
        }

        // Set default stage to first stage if available
        if (pipelineStages && pipelineStages.length > 0) {
          const firstStage = pipelineStages[0];
          dealForm.setValue("currentStageId", firstStage.id);
          dealForm.setValue("probability", firstStage.stageProbability || 0);
        }

        // Set assigned to current user or lead owner
        const assigneeId = leadData.ownerId || session?.data?.user?.id;
        if (assigneeId) {
          dealForm.setValue("assignedTo", assigneeId);
        }

        // Close confirmation dialog and open deal modal
        setConfirmDialog({
          isOpen: false,
          action: null,
          title: "",
          description: "",
        });

        onOpenDealModal();
      } else if (
        confirmDialog.action === "qualified" ||
        confirmDialog.action === "unqualified"
      ) {
        // Just update the status
        await updateLead.mutateAsync({
          id: leadData.id,
          lead: { status: confirmDialog.action },
        });
        toast.success("Lead status updated successfully");

        setConfirmDialog({
          isOpen: false,
          action: null,
          title: "",
          description: "",
        });
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update lead status");
    }
  };

  const handleContactNoteSubmit = async () => {
    try {
      if (!leadData) return;

      if (!contactNoteDialog.note.trim()) {
        toast.error("Please add a note about the contact");
        return;
      }

      await addNote({
        leadId: leadData.id,
        note: contactNoteDialog.note,
      });

      // Invalidate queries to refresh the data
      await utils.leads.getLead.invalidate(id);

      toast.success("Contact note added and lead status updated");
      setContactNoteDialog({ isOpen: false, note: "" });
    } catch (error) {
      console.log(error);
      toast.error("Failed to add contact note");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500 text-white";
      case "contacted":
        return "bg-slate-500 text-white";
      case "qualified":
        return "bg-green-500 text-white";
      case "unqualified":
        return "bg-red-500 text-white";
      case "converted":
        return "bg-emerald-600 text-white";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Clock className="h-3 w-3" />;
      case "contacted":
        return <User className="h-3 w-3" />;
      case "qualified":
        return <CheckCircle2 className="h-3 w-3" />;
      case "unqualified":
        return <XCircle className="h-3 w-3" />;
      case "converted":
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!leadData?.id) {
        toast.error("Missing Lead data");
        return;
      }
      await deleteContact(
        {
          leadId: leadData.id,
          contactId: id,
        },
        {
          onError: () => {
            toast.error("Error deleting contact");
          },
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  const handleOnCreateMeeting = async (data: AddMeetingValues) => {
    try {
      await createMeeting(data, {
        onSuccess: () => {
          utils.events.getLeadMeetings.invalidate();
        },
      });
      toast.success("New task was created!");
      onCloseMeetingModal();
      addMeetingForm.reset();
    } catch (error) {
      console.log(error);
    }
  };

  const handleOnCreateTask = async (data: TaskFormValues) => {
    try {
      await createTask(data, {
        onSuccess: () => {
          utils.tasks.getLeadTasks.invalidate();
        },
      });
      toast.success("New task was created!");
      handleOnCloseTaskModal();
    } catch (error) {
      console.log(error);
    }
  };

  const updateAssigneeMutation = trpc.leads.updateAssignee.useMutation({
    onSuccess: () => {
      utils.leads.getMany.invalidate();
      toast.success("Lead assignee updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update assignee");
    },
  });

  const handleUpdateAssignee = async (
    leadId: string,
    assigneeId: string | null
  ) => {
    try {
      await updateAssigneeMutation.mutateAsync({
        id: leadId,
        assignee: assigneeId,
      });
    } catch (error) {
      console.error("Error updating assignee:", error);
    }
  };

  const handleOnCloseTaskModal = () => {
    onClose();
    taskForm.reset();
  };

  const handleOnCreateDeal = async (data: AddDealValues) => {
    try {
      await addDealMutation(data);

      // Update lead status to converted
      await updateLead.mutateAsync({
        id: leadData!.id,
        lead: { status: "converted" },
      });

      toast.success("Deal created successfully and lead marked as converted");
      onCloseDealModal();
      dealForm.reset();

      // Optionally navigate to the deals page or refresh lead data
      utils.leads.getLead.invalidate(id);
    } catch (error) {
      console.log(error);
      toast.error("Failed to create deal");
    }
  };

  const handleEditLead = async (data: {
    name: string;
    source: string;
    estimatedValue?: number;
  }) => {
    try {
      await updateLead.mutateAsync({
        id: leadData.id,
        lead: {
          name: data.name,
          source: data.source as (typeof leadSourceEnum)[number],
          estimatedValue: data.estimatedValue,
        },
      });

      toast.success("Lead updated successfully");
      setIsEditModalOpen(false);
      utils.leads.getLead.invalidate(id);
    } catch (error) {
      console.log(error);
      toast.error("Failed to update lead");
    }
  };

  const onKanbanChange = async (
    tasks: { id: string; status: TaskStatus; position: number }[]
  ) => {
    await bulkUpdate({
      tasks,
    });
  };

  const primaryContact = useMemo(() => {
    if (!leadData) return null;

    return leadData?.primaryContact;
  }, [leadData]);

  if (!leadData) {
    return (
      <div>
        <p>Lead Was not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <PageHeader
          hasBackButton
          title={<span className="capitalize">{leadData.name}</span>}
          subtitle={
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <p className="text-sm text-foreground capitalize">
                    {leadData.company?.name || "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <p className="text-sm text-foreground capitalize">
                    {primaryContact?.firstName} {primaryContact?.lastName}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  <span>{primaryContact?.email}</span>
                  <Badge variant="outline" className="capitalize text-xs">
                    {primaryContact?.jobTitle}
                  </Badge>
                </div>
              </div>
            </div>
          }
          actions={
            <div className="flex items-center gap-3">
              <div className="p-3 py-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Source
                </p>
                <Badge variant="outline" className="mt-1 capitalize">
                  {leadData.source}
                </Badge>
              </div>
              <div
                className={cn(
                  "p-3 py-1 rounded-lg",
                  leadData.lastContactedAt
                    ? "border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
                    : "bg-slate-200"
                )}
              >
                <p className="text-sm font-medium text-muted-foreground">
                  Last Contacted
                </p>
                {leadData.lastContactedAt ? (
                  <>
                    <p className="mt-1 text-base font-semibold text-amber-700 dark:text-amber-400">
                      {format(
                        new Date(leadData.lastContactedAt),
                        "MMMM d, yyyy"
                      )}
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-500">
                      at {format(new Date(leadData.lastContactedAt), "HH:mm")}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Not contacted yet
                  </p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Badge className={getStatusColor(leadData.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(leadData.status)}
                        <span className="capitalize">{leadData.status}</span>
                      </span>
                    </Badge>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("qualified")}
                    className="text-blue-600 focus:text-blue-600"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Qualified (BANT)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("unqualified")}
                    className="text-red-600 focus:text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Mark as Unqualified
                  </DropdownMenuItem>
                  {leadData.status === "qualified" && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("convert")}
                      className={
                        qualificationCriteria?.isQualified
                          ? "text-green-600 focus:text-green-600"
                          : "text-muted-foreground cursor-not-allowed"
                      }
                      disabled={!qualificationCriteria?.isQualified}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      <span className="flex-1">Convert to Deal</span>
                      {!qualificationCriteria?.isQualified && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {qualificationCriteria?.completionPercentage || 0}%
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  )}
                  {leadData.status === "unqualified" && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("qualified")}
                      className="text-blue-600 focus:text-blue-600"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark as Qualified (BANT)
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditModalOpen(true)}
              title="Edit Lead"
            >
              <Edit className="h-5 w-5" />
            </Button> */}
            </div>
          }
        />
      </div>
      <header className="bg-card">
        <div className="mx-auto my-4 px-4 pt-6 sm:px-6 lg:px-8">
          <div className="border-b border-border">
            <nav className="flex gap-6">
              {LeadTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-medium capitalize transition-colors relative ${
                    activeTab === tab
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="bg-background mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === "details" && (
          <LeadDetailsTab
            leadData={{
              ...leadData,
              emailVerified: !!leadData.emailVerified,
              assignee: leadData?.assignee ?? null,
            }}
            primaryContact={primaryContact}
            tags={leadData.tagAssociations?.map((ta) => ta.tag) || []}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            handleUpdateAssignee={handleUpdateAssignee}
            isPending={updateAssigneeMutation.isPending}
          />
        )}

        {activeTab === "activity" && (
          <LeadActivityTab
            leadId={id}
            tasks={tasks || []}
            meetings={meetings || []}
            contacts={leadData.contactAssociations.map((c) => c.contact) || []}
            users={users || []}
            loadingMeetings={loadingMeetings}
            meetingsError={meetingsError}
            taskForm={taskForm}
            meetingForm={addMeetingForm}
            isCreatingTask={isCreatingTask}
            isCreatingMeeting={isCreatingMeeting}
            onCreateTask={handleOnCreateTask}
            onCreateMeeting={handleOnCreateMeeting}
            onCloseTaskModal={handleOnCloseTaskModal}
            onCloseMeetingModal={() => {
              onCloseMeetingModal();
              addMeetingForm.reset();
            }}
            onKanbanChange={onKanbanChange}
          />
        )}

        {activeTab === "files" && <LeadFilesTab leadId={id} />}

        {activeTab === "people" && (
          <LeadPeopleTab
            contactAssociations={leadData.contactAssociations}
            onDeleteContact={handleDelete}
            isPending={isPending}
          />
        )}
      </main>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          !open &&
          setConfirmDialog({
            isOpen: false,
            action: null,
            title: "",
            description: "",
          })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({
                  isOpen: false,
                  action: null,
                  title: "",
                  description: "",
                })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              variant={
                confirmDialog.action === "unqualified"
                  ? "destructive"
                  : "default"
              }
            >
              {confirmDialog.action === "convert"
                ? "Convert to Deal"
                : confirmDialog.action === "qualified"
                  ? "Mark as Qualified"
                  : "Mark as Unqualified"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Note Dialog */}
      <Dialog
        open={contactNoteDialog.isOpen}
        onOpenChange={(open) =>
          !open && setContactNoteDialog({ isOpen: false, note: "" })
        }
      >
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add Contact Note</DialogTitle>
            <DialogDescription>
              Record details about this contact interaction. This will mark the
              lead as contacted and update the last contacted date.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 px-6">
            <div className="grid gap-2">
              <Label htmlFor="contactNote">
                Contact Notes <span className="text-red-500">*</span>
              </Label>
              <div className="border rounded-md">
                <LexEditor
                  value={contactNoteDialog.note}
                  onChange={(value) =>
                    setContactNoteDialog({
                      ...contactNoteDialog,
                      note: value,
                    })
                  }
                  placeholder="What was discussed? What are the next steps? Any important details..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setContactNoteDialog({ isOpen: false, note: "" })}
              disabled={isAddingNote}
            >
              Cancel
            </Button>
            <Button
              onClick={handleContactNoteSubmit}
              disabled={isAddingNote || !contactNoteDialog.note.trim()}
            >
              {isAddingNote ? "Saving..." : "Save Contact Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Creation Modal */}
      <Form {...dealForm}>
        <AddNewDealModal
          onClose={() => {
            onCloseDealModal();
            dealForm.reset();
          }}
          onSubmit={handleOnCreateDeal}
          isPending={isCreatingDeal}
          leads={allLeads?.items || []}
          stages={(pipelineStages || []).map((stage) => ({
            id: stage.id,
            name: stage.name,
            stageProbability: stage.stageProbability,
          }))}
          users={users || []}
          products={products || []}
          isLoading={false}
          handleSearchProduct={setProductSearchValue}
          searchValue={productsSearchValue}
          leadSearchValue={leadSearchValue}
          handleSearchLead={setLeadSearchValue}
          isLeadReadOnly={true}
          isAssignedToReadOnly={
            !(
              session?.data?.user?.role === "admin" ||
              session?.data?.user?.role === "sales-manager"
            )
          }
        />
      </Form>

      {/* Edit Lead Modal */}
      <EditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditLead}
        leadData={leadData}
        isPending={updateLead.isPending}
      />
    </div>
  );
}
