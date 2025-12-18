"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import {
  CheckCircle2,
  Circle,
  Calendar,
  DollarSign,
  Users,
  FileText,
  CreditCard,
  Clock,
  ShieldCheck,
  LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { cn } from "~/lib/utils";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { NewLeadQualificationCriteria } from "~/db/types";
import { ProductSelectionModal } from "./modals/product-selection-modal";

interface LeadQualificationChecklistProps {
  leadId: string;
  isReadOnly?: boolean;
}

export function LeadQualificationChecklist({
  leadId,
  isReadOnly = false,
}: LeadQualificationChecklistProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const { data: leadData } = trpc.leads.getLead.useQuery(leadId);
  const { data: criteria, isLoading } = trpc.leadQualification.get.useQuery({
    leadId,
  });
  const { data: paymentTerms } = trpc.paymentTerms.getAll.useQuery();

  const utils = trpc.useUtils();

  const updateCriteria = trpc.leadQualification.update.useMutation({
    onSuccess: () => {
      utils.leadQualification.get.invalidate({ leadId });
      toast.success("Qualification criteria updated");
      setEditingSection(null);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  if (isLoading) {
    return <div className="p-4">Loading qualification criteria...</div>;
  }

  if (!criteria) {
    return <div className="p-4">Failed to load qualification criteria</div>;
  }

  const ChecklistItem = ({
    icon: Icon,
    title,
    isComplete,
    children,
    section,
    readOnly = false,
  }: {
    icon: LucideIcon;
    title: string;
    isComplete: boolean;
    children: React.ReactNode;
    section: string;
    readOnly?: boolean;
  }) => (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">{title}</h4>
            {readOnly && (
              <Badge variant="secondary" className="text-xs">
                Auto
              </Badge>
            )}
          </div>
          <div className="space-y-2">{children}</div>
        </div>
      </div>
      <Separator />
    </div>
  );

  // Decision Team Section (Read-only - derived from lead contacts)
  const DecisionTeamSection = () => {
    const contacts = leadData?.contactAssociations || [];
    const hasInfluential = contacts.some(
      (ca) =>
        ca.isPrimary ||
        ["primary", "financial", "decision_maker"].includes(ca.role)
    );

    return (
      <ChecklistItem
        icon={Users}
        title="Decision Team (Min: Head & Bursar)"
        isComplete={hasInfluential}
        section="team"
        readOnly
      >
        {contacts.length > 0 ? (
          <div className="space-y-2">
            {contacts.map((ca, index) => (
              <div key={index} className="text-sm flex items-center gap-2">
                <span className="font-medium">
                  {ca.contact.firstName} {ca.contact.lastName}
                </span>
                <span className="text-muted-foreground">- {ca.role}</span>
                {ca.isPrimary && (
                  <Badge variant="outline" className="text-xs">
                    Primary
                  </Badge>
                )}
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              {hasInfluential && (
                <Badge variant="default" className="text-xs">
                  Has Influential Contact
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No contacts added to lead
          </p>
        )}
      </ChecklistItem>
    );
  };

  // Needs Section
  const NeedsSection = () => {
    const selectedProducts = criteria.needs
      ? criteria.needs.split(",").map((p) => p.trim()).filter(Boolean)
      : [];

    const handleSaveProducts = (products: string[]) => {
      updateCriteria.mutate({
        leadId,
        needs: products.join(", "),
      });
    };

    return (
      <ChecklistItem
        icon={FileText}
        title="Needs & Requirements"
        isComplete={!!criteria.hasNeeds}
        section="needs"
      >
        <div className="space-y-2">
          {selectedProducts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedProducts.map((product, index) => (
                <Badge key={index} variant="secondary">
                  {product}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No products selected
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (isReadOnly) return;
              setIsProductModalOpen(true);
            }}
            disabled={isReadOnly}
          >
            {selectedProducts.length > 0 ? "Edit Products" : "Select Products"}
          </Button>
        </div>
        <ProductSelectionModal
          open={isProductModalOpen}
          onOpenChange={setIsProductModalOpen}
          selectedProducts={selectedProducts}
          onSave={handleSaveProducts}
        />
      </ChecklistItem>
    );
  };

  // Plan Type Section
  const PlanTypeSection = () => {
    const [planType, setPlanType] = useState<
      NewLeadQualificationCriteria["planType"] | ""
    >(criteria.planType || "");

    const handleSave = () => {
      if (planType) {
        updateCriteria.mutate({
          leadId,
          planType,
        });
      }
    };

    // Filter payment terms to only show those that match the plan type enum
    const availablePaymentTerms = paymentTerms?.filter((term) =>
      ["cash", "3-term", "6-term", "9-term"].includes(term.type)
    ) || [];

    return (
      <ChecklistItem
        icon={CreditCard}
        title="Plan Type"
        isComplete={!!criteria.hasPlanType}
        section="plan"
      >
        {editingSection === "plan" ? (
          <div className="space-y-3">
            <Select
              value={planType as string}
              onValueChange={(value) =>
                setPlanType(value as NewLeadQualificationCriteria["planType"])
              }
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select plan type" />
              </SelectTrigger>
              <SelectContent>
                {availablePaymentTerms.length > 0 ? (
                  availablePaymentTerms.map((term) => (
                    <SelectItem key={term.id} value={term.type}>
                      {term.name || term.type}
                      {term.interestRate && parseFloat(term.interestRate) > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({term.interestRate}% interest)
                        </span>
                      )}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="3-term">3-Term Payment</SelectItem>
                    <SelectItem value="6-term">6-Term Payment</SelectItem>
                    <SelectItem value="9-term">9-Term Payment</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isReadOnly || updateCriteria.isPending}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingSection(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {criteria.planType ? (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{criteria.planType}</Badge>
                {paymentTerms && (
                  (() => {
                    const term = paymentTerms.find((t) => t.type === criteria.planType);
                    return term && parseFloat(term.interestRate) > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        ({term.interestRate}% interest)
                      </span>
                    ) : null;
                  })()
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No plan type selected
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (isReadOnly) return;
                setEditingSection("plan");
              }}
              disabled={isReadOnly}
            >
              Edit
            </Button>
          </div>
        )}
      </ChecklistItem>
    );
  };

  // Timeline Section
  const TimelineSection = () => {
    const [timelineType, setTimelineType] = useState<
      NewLeadQualificationCriteria["timelineType"] | ""
    >(criteria.timelineType || "");
    const [specificDate, setSpecificDate] = useState(
      criteria.specificDate
        ? new Date(criteria.specificDate).toISOString().split("T")[0]
        : ""
    );

    const handleSave = () => {
      updateCriteria.mutate({
        leadId,
        ...(timelineType
          ? {
              timelineType,
              specificDate:
                timelineType === "specific-date" ? specificDate : undefined,
            }
          : {}),
      });
    };

    return (
      <ChecklistItem
        icon={Clock}
        title="Timeline"
        isComplete={!!criteria.hasTimeline}
        section="timeline"
      >
        {editingSection === "timeline" ? (
          <div className="space-y-3">
            <Select
              value={timelineType as string}
              onValueChange={(value) =>
                setTimelineType(
                  value as NewLeadQualificationCriteria["timelineType"]
                )
              }
              disabled={isReadOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-term">This Term</SelectItem>
                <SelectItem value="next-term">Next Term</SelectItem>
                <SelectItem value="specific-date">Specific Date</SelectItem>
              </SelectContent>
            </Select>
            {timelineType === "specific-date" && (
              <Input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                disabled={isReadOnly}
              />
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isReadOnly || updateCriteria.isPending}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingSection("timeline")}
                disabled={isReadOnly}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {criteria.timelineType ? (
              <div className="text-sm">
                {criteria.timelineType === "this-term" && "This Term"}
                {criteria.timelineType === "next-term" && "Next Term"}
                {criteria.timelineType === "specific-date" &&
                  criteria.specificDate &&
                  new Date(criteria.specificDate).toLocaleDateString()}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No timeline set</p>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (isReadOnly) return;
                setEditingSection("timeline");
              }}
              disabled={isReadOnly}
            >
              Edit
            </Button>
          </div>
        )}
      </ChecklistItem>
    );
  };

  // Budget Section
  const BudgetSection = () => {
    const [budgetIndicator, setBudgetIndicator] = useState<
      NonNullable<NewLeadQualificationCriteria["budgetIndicator"]> | undefined
    >(criteria.budgetIndicator || undefined);
    const [budgetAmount, setBudgetAmount] = useState(
      criteria.budgetAmount?.toString() || ""
    );

    const handleSave = () => {
      updateCriteria.mutate({
        leadId,
        budgetIndicator,
        budgetAmount: budgetAmount || undefined,
      });
    };

    return (
      <ChecklistItem
        icon={DollarSign}
        title="Budget/Appetite"
        isComplete={!!criteria.hasBudget}
        section="budget"
      >
        {editingSection === "budget" ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Budget Indicator</Label>
              <Select
                value={budgetIndicator as string}
                onValueChange={(value) =>
                  setBudgetIndicator(
                    value as NonNullable<
                      NewLeadQualificationCriteria["budgetIndicator"]
                    >
                  )
                }
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select budget indicator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="not-disclosed">Not Disclosed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Budget Amount (Optional)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                disabled={isReadOnly}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isReadOnly || updateCriteria.isPending}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingSection("budget")}
                disabled={isReadOnly}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {criteria.budgetIndicator || criteria.budgetAmount ? (
              <div className="text-sm space-y-1">
                {criteria.budgetIndicator && (
                  <Badge variant="outline" className="capitalize">
                    {criteria.budgetIndicator}
                  </Badge>
                )}
                {criteria.budgetAmount && (
                  <div className="font-medium">
                    R {parseFloat(criteria.budgetAmount).toLocaleString()}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No budget information
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (isReadOnly) return;
                setEditingSection("budget");
              }}
              disabled={isReadOnly}
            >
              Edit
            </Button>
          </div>
        )}
      </ChecklistItem>
    );
  };

  // Contact Verification Section (Checkboxes)
  const ContactVerificationSection = () => {
    const [phoneVerified, setPhoneVerified] = useState(
      criteria.phoneVerified || false
    );
    const [emailVerified, setEmailVerified] = useState(
      criteria.emailVerified || false
    );
    const [provinceVerified, setProvinceVerified] = useState(
      criteria.provinceVerified || false
    );

    const handleSave = () => {
      updateCriteria.mutate({
        leadId,
        phoneVerified,
        emailVerified,
        provinceVerified,
      });
    };

    const primaryContact = leadData?.primaryContact;
    const company = leadData?.company;

    return (
      <ChecklistItem
        icon={ShieldCheck}
        title="Contact Verification"
        isComplete={!!criteria.hasVerifiedContact}
        section="contact"
      >
        <div className="space-y-3">
          <div className="text-sm space-y-2">
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex-1">
                <p className="font-medium">Phone Number</p>
                <p className="text-xs text-muted-foreground">
                  {primaryContact?.phoneNumber || "Not available"}
                </p>
              </div>
              <Switch
                checked={phoneVerified}
                onCheckedChange={setPhoneVerified}
                disabled={isReadOnly}
              />
            </div>
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex-1">
                <p className="font-medium">Email</p>
                <p className="text-xs text-muted-foreground">
                  {primaryContact?.email || "Not available"}
                </p>
              </div>
              <Switch
                checked={emailVerified}
                onCheckedChange={setEmailVerified}
                disabled={isReadOnly}
              />
            </div>
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex-1">
                <p className="font-medium">Province</p>
                <p className="text-xs text-muted-foreground">
                  {company?.province || "Not available"}
                </p>
              </div>
              <Switch
                checked={provinceVerified}
                onCheckedChange={setProvinceVerified}
                disabled={isReadOnly}
              />
            </div>
          </div>
          {(phoneVerified !== criteria.phoneVerified ||
            emailVerified !== criteria.emailVerified ||
            provinceVerified !== criteria.provinceVerified) && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isReadOnly || updateCriteria.isPending}
            >
              Save Changes
            </Button>
          )}
        </div>
      </ChecklistItem>
    );
  };

  const completionPercentage = criteria.completionPercentage || 0;
  const isQualified = criteria.isQualified || false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Qualification Checklist</CardTitle>
          <div className="flex items-center gap-3">
            <Badge
              variant={isQualified ? "default" : "secondary"}
              className={cn(
                "text-xs",
                isQualified && "bg-green-600 hover:bg-green-700"
              )}
            >
              {isQualified ? "Qualifies for BANT" : "Not Qualified"}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold">{completionPercentage}%</div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
        <Progress value={completionPercentage} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <DecisionTeamSection />
        <NeedsSection />
        <PlanTypeSection />
        <TimelineSection />
        <BudgetSection />
        <ContactVerificationSection />
      </CardContent>
    </Card>
  );
}
