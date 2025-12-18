"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import { Phone, MessageSquare, Mail, Clock, CalendarIcon } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { toast } from "sonner";
import CustomDatePicker from "./custom-date-picker";
import { cn } from "~/lib/utils";

interface CallRecorderProps {
  leadId?: string;
  dealId?: string;
  readOnly?: boolean;
}

interface CallFormData {
  contactId: string | null;
  outcomeId: string | null;
  summary: string;
  nextSteps: string;
  dueDateTime: Date | undefined;
  type: "call" | "whatsapp" | "email";
}

export function CallRecorder({ leadId, dealId, readOnly = false }: CallRecorderProps) {
  const [formData, setFormData] = useState<CallFormData>({
    contactId: null,
    outcomeId: null,
    summary: "",
    nextSteps: "",
    dueDateTime: new Date(),
    type: "call",
  });

  const utils = trpc.useUtils();

  // TRPC Queries
  const { data: calls, isLoading: callsLoading } = trpc.calls.list.useQuery({
    leadId,
    dealId,
  });

  const { data: contacts } = trpc.leads.getLead.useQuery(leadId || "", {
    enabled: !!leadId,
  });

  const { data: outcomes } = trpc.calls.outcomes.list.useQuery();

  // TRPC Mutations
  const saveCall = trpc.calls.create.useMutation({
    onSuccess: () => {
      // Reset form
      setFormData({
        contactId: null,
        outcomeId: null,
        summary: "",
        nextSteps: "",
        dueDateTime: new Date(),
        type: "call",
      });
      // Refetch calls list
      utils.calls.list.invalidate({ leadId, dealId });
      utils.leads.getLead.invalidate(leadId);
      toast.success("Call activity saved successfully");
    },
    onError: (error) => {
      toast.error(`Error saving call: ${error.message}`);
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (isDraft: boolean) => {
    if (
      !formData.contactId ||
      !formData.summary ||
      !formData.nextSteps ||
      !formData.dueDateTime
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await saveCall.mutateAsync({
        leadId,
        dealId,
        contactId: formData.contactId,
        outcomeId: formData.outcomeId || undefined,
        type: formData.type,
        summary: formData.summary,
        nextSteps: formData.nextSteps,
        dueDateTime: formData.dueDateTime
          ? formData.dueDateTime.toISOString()
          : "",
        isDraft,
      });
    } catch (error) {
      console.error("Error saving call:", error);
    }
  };

  const formatActivityTime = (date: Date) => {
    if (isToday(date)) {
      return `Today ${format(date, "HH:mm")}`;
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, "HH:mm")}`;
    }
    return format(date, "MMM d, yyyy");
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4 text-muted-foreground" />;
      case "whatsapp":
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
      case "email":
        return <Mail className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getOutcomeVariantClass = (variant: string) => {
    switch (variant) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const contactsList =
    contacts?.contactAssociations?.map((ca) => ({
      id: ca.contact.id,
      name: `${ca.contact.firstName} ${ca.contact.lastName}`,
    })) || [];

  return (
    <div className="mx-auto max-w-full space-y-6">
      {/* Call Form */}
      {!readOnly && (
        <Card className="bg-muted border-none">
        <CardHeader>
          <CardTitle>Log Call Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactId">
                Contact <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.contactId || ""}
                onValueChange={(value) =>
                  handleSelectChange("contactId", value)
                }
              >
                <SelectTrigger id="contactId" className="w-full">
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {contactsList.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Activity Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  handleSelectChange("type", value as CallFormData["type"])
                }
              >
                <SelectTrigger id="type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>Call</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcomeId">Outcome</Label>
              <Select
                value={formData.outcomeId || ""}
                onValueChange={(value) =>
                  handleSelectChange("outcomeId", value)
                }
              >
                <SelectTrigger id="outcomeId" className="w-full">
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  {outcomes?.map((outcome) => (
                    <SelectItem key={outcome.id} value={outcome.id}>
                      {outcome.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDateTime">
                Due Date & Time <span className="text-destructive">*</span>
              </Label>

              <CustomDatePicker
                trigger={
                  <Button
                    variant="outline"
                    type="button"
                    className={cn(
                      "pl-3 text-left font-normal w-full",
                      !formData.dueDateTime && "text-muted-foreground"
                    )}
                  >
                    {formData.dueDateTime ? (
                      format(formData.dueDateTime, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                }
                value={formData.dueDateTime || new Date()}
                onSelectChange={(date) =>
                  setFormData((prev) => ({ ...prev, dueDateTime: date }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">
              Summary (1-3 lines) <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              placeholder="Enter call summary..."
              className="min-h-[80px] bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextSteps">
              Next Steps <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nextSteps"
              name="nextSteps"
              value={formData.nextSteps}
              onChange={handleInputChange}
              placeholder="E.g., Follow up, Send proposal"
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Relevant for all topics except Note
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSave(true)}
              disabled={
                saveCall.isPending ||
                !formData.contactId ||
                !formData.summary ||
                !formData.nextSteps ||
                !formData.dueDateTime
              }
            >
              Save draft
            </Button>
            <Button
              type="button"
              onClick={() => handleSave(false)}
              disabled={
                saveCall.isPending ||
                !formData.contactId ||
                !formData.summary ||
                !formData.nextSteps ||
                !formData.dueDateTime
              }
            >
              {saveCall.isPending ? "Saving..." : "Save activity"}
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          {callsLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading activities...
            </div>
          ) : calls && calls.length > 0 ? (
            <ul className="space-y-4">
              {calls.map((call) => (
                <li
                  key={call.id}
                  className="border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getActivityIcon(call.type)}
                    <span className="font-semibold text-sm capitalize">
                      {call.type}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      • {call.status}
                    </span>
                    {call.person && (
                      <span className="text-muted-foreground text-sm">
                        | {call.person.name}
                      </span>
                    )}
                    {call.outcomeTag && (
                      <Badge
                        className={getOutcomeVariantClass(
                          call.outcomeTag?.variant ?? ""
                        )}
                      >
                        {call.outcomeTag.text}
                      </Badge>
                    )}
                    <span className="ml-auto text-muted-foreground text-xs">
                      {formatActivityTime(call.createdAt)}
                    </span>
                  </div>

                  {call.summary && (
                    <div className="text-sm text-foreground mb-2">
                      <strong>Summary:</strong> {call.summary}
                    </div>
                  )}

                  {call.nextSteps && (
                    <div className="text-sm text-muted-foreground flex items-start gap-1">
                      <strong className="text-foreground">Next:</strong>
                      <div>
                        <span>{call.nextSteps}</span>
                        {call.dueDateTime && (
                          <span className="ml-1 text-xs inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(call.dueDateTime, "EEE HH:mm")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No activities yet. Create your first call record above.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
