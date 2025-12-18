"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Textarea } from "~/components/ui/textarea";
import { Loader2, CheckCircle2, Trophy } from "lucide-react";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { PROVINCES, REGIONS, DISTRICTS_BY_PROVINCE } from "~/data/provinces";
import { CHURCH_DENOMINATIONS } from "~/data/church-denominations";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  planTypeEnum,
  timelineTypeEnum,
  budgetIndicatorEnum,
} from "~/db/schema";

const INTEREST_AREAS = [
  "Interactive Boards",
  "LMS & AI Lesson Planner",
  "Tablets for Learners",
  "Teacher Laptops",
  "School Management System (SMS)",
  "MDM / Device Control",
  "Other",
] as const;


// Map user-friendly labels to backend enum values
const BUDGET_TIMING_MAP: Record<string, typeof budgetIndicatorEnum[number]> = {
  High: "high",
  Medium: "medium",
  Low: "low",
  "Not Disclosed": "not-disclosed",
};

// Map user-friendly labels to backend enum values
const PAYMENT_MODEL_MAP: Record<string, typeof planTypeEnum[number]> = {
  Cash: "cash",
  "3-Term Plan": "3-term",
  "6-Term Plan": "6-term",
  "9-Term Plan": "9-term",
};

const DECISION_TIMELINES = [
  "This Term",
  "Next Term",
  "Specific Date",
  "Ready to Proceed",
  "SDC meets end of this term",
  "SDC meets next term",
  "Need more information",
  "Budget approval pending",
] as const;

// Map user-friendly labels to backend enum values
const DECISION_TIMELINE_MAP: Record<string, typeof timelineTypeEnum[number]> = {
  "This Term": "this-term",
  "Next Term": "next-term",
  "Specific Date": "specific-date",
  "Ready to Proceed": "ready-to-proceed",
  "SDC meets end of this term": "sdc-meets-end-of-this-term",
  "SDC meets next term": "sdc-meets-next-term",
  "Need more information": "need-more-information",
  "Budget approval pending": "budget-approval-pending",
};

// Constants from leads schema
const SCHOOL_TYPES = [
  "Primary",
  "Secondary",
  "ECD Centre",
  "College",
  "Other",
] as const;

const OWNERSHIP_TYPES = [
  "Government",
  "Council School",
  "Mission / Church",
  "Private Independent",
  "Community / SDC",
  "Other",
] as const;

const LEAD_SOURCES = [
  "website",
  "referral",
  "cold_call",
  "social_media",
  "event",
  "partner",
  "other",
] as const;

const CONTACT_TITLES = [
  "Mr",
  "Mrs",
  "Ms",
  "Dr",
  "Prof",
  "Rev",
  "Father",
  "Sister",
  "Pastor",
] as const;

// Combined form schema matching React Native structure
const raffleLeadFormSchema = z
  .object({
    // School Details
    schoolName: z.string().min(2, "School name is required"),
    schoolType: z.enum(SCHOOL_TYPES),
    ownership: z.enum(OWNERSHIP_TYPES),
    churchDenomination: z.string().optional(),
    province: z.enum(PROVINCES),
    city: z.string().min(1, "City is required"),
    district: z.string().optional(),
    region: z.enum(REGIONS),
    leadSource: z.enum(LEAD_SOURCES),

    // Contact Person
    title: z.enum(CONTACT_TITLES).optional(),
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    role: z.string(),
    jobTitle: z.string().optional(),
    phoneNumber: z.string().min(9, "Phone number is required"),
    email: z.email("Valid email is required"),
  })
  .refine(
    (data) => {
      // If ownership is "Mission / Church", churchDenomination is required
      if (data.ownership === "Mission / Church") {
        return (
          !!data.churchDenomination && data.churchDenomination.trim().length > 0
        );
      }
      return true;
    },
    {
      message:
        "Church denomination is required when ownership is Mission / Church",
      path: ["churchDenomination"],
    }
  );

type RaffleLeadFormData = z.infer<typeof raffleLeadFormSchema>;

/***
 * planTypeEnum,
  timelineTypeEnum,
  budgetIndicatorEnum,
 * */ 
const qualificationSchema = z
  .object({
    interestAreas: z
      .array(z.string())
      .min(1, "Select at least one interest area"),
    needs: z.string().optional(),
    budgetTiming: z.string().optional(),
    budgetAmount: z.string().optional(),
    paymentModel: z.enum(planTypeEnum).optional(),
    decisionTimeline: z.string().optional(),
    specificDate: z.date().optional(),
  })
  .refine(
    (data) => {
      // If "Other" is selected in interests, needs description is required
      if (data.interestAreas.includes("Other")) {
        return !!data.needs && data.needs.trim().length > 0;
      }
      return true;
    },
    {
      message: "Please describe your needs when selecting 'Other'",
      path: ["needs"],
    }
  )
  .refine(
    (data) => {
      // If decision timeline is "Specific Date", specificDate is required
      if (data.decisionTimeline === "Specific Date") {
        return !!data.specificDate;
      }
      return true;
    },
    {
      message: "Please select a specific date",
      path: ["specificDate"],
    }
  );

type QualificationFormData = z.infer<typeof qualificationSchema>;

interface RaffleLeadFormProps {
  raffleId: string;
}

type Step = "details" | "form" | "qualification" | "success";

export default function RaffleLeadForm({ raffleId }: RaffleLeadFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>("details");
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [createdLeadId, setCreatedLeadId] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Fetch raffle details
  const { data: raffle, isLoading: raffleLoading } =
    trpc.raffle.getPublic.useQuery({ id: raffleId }, { enabled: !!raffleId });

  // Combined form
  const form = useForm<RaffleLeadFormData>({
    resolver: zodResolver(raffleLeadFormSchema),
    defaultValues: {
      leadSource: "event",
      schoolType: "Primary",
      role: "primary",
      ownership: "Government",
    },
  });

  // Qualification form
  const qualificationForm = useForm<QualificationFormData>({
    resolver: zodResolver(qualificationSchema),
    defaultValues: {
      interestAreas: [],
    },
  });

  // Watch fields for conditional rendering
  const ownership = form.watch("ownership");
  const selectedProvince = form.watch("province");
  const budgetTiming = qualificationForm.watch("budgetTiming");
  const decisionTimeline = qualificationForm.watch("decisionTimeline");

  // Get districts for selected province
  const availableDistricts = selectedProvince
    ? DISTRICTS_BY_PROVINCE[selectedProvince] || []
    : [];

  // Create lead mutation using public endpoint
  const createLeadMutation = trpc.leads.createLeadPublic.useMutation({
    onSuccess: (data) => {
      setCreatedLeadId(data.lead.id);
      toast.success("Lead created successfully!");
      setCurrentStep("qualification");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create lead");
    },
  });

  // Update lead qualification mutation
  const updateLeadQualificationMutation =
    trpc.leadQualification.updatePublic.useMutation({
      onSuccess: () => {
        // After qualification is saved, enter the raffle
        if (createdLeadId) {
          enterRaffleMutation.mutate({
            raffleId,
            leadId: createdLeadId,
          });
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update qualification");
      },
    });

  // Enter raffle mutation
  const enterRaffleMutation = trpc.raffle.enter.useMutation({
    onSuccess: (data) => {
      setTicketNumber(data.ticketNumber);
      setCurrentStep("success");
      toast.success("Raffle entry confirmed!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to enter raffle");
    },
  });

  const handleFormSubmit = (data: RaffleLeadFormData) => {
    createLeadMutation.mutate({
      lead: {
        name: `${data.schoolName} - Raffle Entry`,
        source: data.leadSource,
        companyName: data.schoolName,
        province: data.province,
        region: data.region,
        city: data.city,
      },
      contacts: [
        {
          title: data.title,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          jobTitle: data.jobTitle,
          isPrimary: true,
          role: "primary",
        },
      ],
    });
  };

  const handleQualificationSubmit = (data: QualificationFormData) => {
    if (!createdLeadId) return;

    // Filter out "Other" and combine interest areas as comma-separated values
    const filteredInterests = data.interestAreas.filter(
      (interest) => interest !== "Other"
    );
    const needsText = filteredInterests.join(", ");

    // Only include additional notes if "Other" was selected and notes were provided
    const hasOther = data.interestAreas.includes("Other");
    const fullNeeds =
      hasOther && data.needs
        ? `${needsText}${needsText ? ", " : ""}${data.needs}`
        : needsText;

    const qualificationData = {
      leadId: createdLeadId,
      needs: fullNeeds || undefined,
      planType: data.paymentModel
        ? PAYMENT_MODEL_MAP[data.paymentModel]
        : undefined,
      timelineType: data.decisionTimeline
        ? DECISION_TIMELINE_MAP[data.decisionTimeline]
        : undefined,
      specificDate:
        data.decisionTimeline === "specific-date" && data.specificDate
          ? data.specificDate.toISOString().split("T")[0]
          : undefined,
      budgetIndicator: data.budgetTiming
        ? BUDGET_TIMING_MAP[data.budgetTiming]
        : undefined,
      budgetAmount: data.budgetAmount || undefined,
    };

    updateLeadQualificationMutation.mutate(qualificationData);
  };

  const handleInterestToggle = (interest: string) => {
    const currentInterests = qualificationForm.getValues("interestAreas");
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter((i) => i !== interest)
      : [...currentInterests, interest];

    setSelectedInterests(newInterests);
    qualificationForm.setValue("interestAreas", newInterests);
  };

  const handleEnterRaffle = () => {
    setCurrentStep("form");
  };

  const handleReset = () => {
    setCurrentStep("details");
    setTicketNumber(null);
    setCreatedLeadId(null);
    setSelectedInterests([]);
    form.reset({
      leadSource: "event",
      schoolType: "Primary",
      ownership: "Government",
    });
    qualificationForm.reset({
      interestAreas: [],
    });
  };

  // Format ticket number with DL- prefix and zero padding
  const formatTicketNumber = (num: number) => {
    return `DL-${num.toString().padStart(4, "0")}`;
  };

  if (raffleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Raffle Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              The raffle you&lsquo;re looking for doesn&lsquo;t exist or has
              been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Raffle Details
  if (currentStep === "details") {
    const isActive =
      new Date() >= raffle.startDate && new Date() <= raffle.endDate;

    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-yellow-500" />
              {raffle.title}
            </CardTitle>
            <CardDescription>
              {isActive ? "Raffle is currently active!" : "Raffle details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Starts</p>
                <p className="font-semibold">
                  {format(raffle.startDate, "PPP")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ends</p>
                <p className="font-semibold">{format(raffle.endDate, "PPP")}</p>
              </div>
            </div>

            {raffle.location && (
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-semibold">{raffle.location}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Total Entries</p>
              <p className="text-2xl font-bold">{raffle.totalEntries}</p>
            </div>

            <Button
              onClick={handleEnterRaffle}
              className="w-full"
              size="lg"
              disabled={!isActive}
            >
              {isActive ? "Enter Raffle 🎉" : "Raffle Not Active"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Lead Information Form (School Details + Contact Person)
  if (currentStep === "form") {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>Enter Raffle</CardTitle>
            <CardDescription>
              Fill in your school and contact details to enter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleFormSubmit)}
                className="space-y-6"
              >
                {/* School Details Section */}
                <Card className="space-y-4">
                  <CardContent className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      School Details
                    </h3>

                    <FormField
                      control={form.control}
                      name="schoolName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter school name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schoolType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School Type *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select school type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SCHOOL_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ownership"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ownership *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select ownership type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {OWNERSHIP_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {ownership === "Mission / Church" && (
                      <FormField
                        control={form.control}
                        name="churchDenomination"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Church Denomination *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select church denomination" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CHURCH_DENOMINATIONS.map((denomination) => (
                                  <SelectItem
                                    key={denomination}
                                    value={denomination}
                                  >
                                    {denomination}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Province *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select province" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROVINCES.map((province) => (
                                <SelectItem key={province} value={province}>
                                  {province}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>District</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={
                              !selectedProvince ||
                              availableDistricts.length === 0
                            }
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={
                                    !selectedProvince
                                      ? "Select province first"
                                      : availableDistricts.length === 0
                                        ? "No districts available"
                                        : "Select district"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableDistricts.map((district) => (
                                <SelectItem key={district} value={district}>
                                  {district}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Region *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select region" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {REGIONS.map((region) => (
                                <SelectItem key={region} value={region}>
                                  {region}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="leadSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How did you hear about us? *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LEAD_SOURCES.map((source) => (
                                <SelectItem key={source} value={source}>
                                  {source
                                    .split("_")
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1)
                                    )
                                    .join(" ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Contact Person Section */}
                <Card className="space-y-4">
                  <CardContent className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      Contact Person
                    </h3>

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select title" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CONTACT_TITLES.map((title) => (
                                <SelectItem key={title} value={title}>
                                  {title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="First name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Head Teacher"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="0712345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={createLeadMutation.isPending}
                >
                  {createLeadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Qualification Form
  if (currentStep === "qualification" && createdLeadId) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">
              You&lsquo;re almost there!
            </CardTitle>
            <CardDescription className="text-base">
              Help us understand your needs better
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...qualificationForm}>
              <form
                onSubmit={qualificationForm.handleSubmit(
                  handleQualificationSubmit
                )}
                className="space-y-6"
              >
                {/* Interest & Intent Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Interest & Intent</h3>

                  {/* Interest Areas */}
                  <FormField
                    control={qualificationForm.control}
                    name="interestAreas"
                    render={() => (
                      <FormItem>
                        <FormLabel>
                          Interest Areas <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {INTEREST_AREAS.map((interest) => (
                            <Button
                              key={interest}
                              type="button"
                              variant={
                                selectedInterests.includes(interest)
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => handleInterestToggle(interest)}
                              className={cn(
                                "rounded-full",
                                selectedInterests.includes(interest) &&
                                  "bg-blue-500 hover:bg-blue-600"
                              )}
                            >
                              {interest}
                            </Button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Needs Description - Only show when "Other" is selected */}
                  {selectedInterests.includes("Other") && (
                    <FormField
                      control={qualificationForm.control}
                      name="needs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Describe your needs{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g. Wifi Router"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Budget Indicator */}
                  <FormField
                    control={qualificationForm.control}
                    name="budgetTiming"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Appetite (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select budget level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {budgetIndicatorEnum.map((timing) => (
                              <SelectItem key={timing} value={timing}>
                                {timing}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Budget Amount - Only show when budget is NOT "Not Disclosed" */}
                  {budgetTiming && budgetTiming !== "Not Disclosed" && (
                    <FormField
                      control={qualificationForm.control}
                      name="budgetAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Budget Amount (USD){" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 5000"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Payment Model */}
                  <FormField
                    control={qualificationForm.control}
                    name="paymentModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Preferred Payment Model (Optional)
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select payment model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {planTypeEnum.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Decision Timeline */}
                  <FormField
                    control={qualificationForm.control}
                    name="decisionTimeline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Decision Timeline (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select timeline" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DECISION_TIMELINES.map((timeline) => (
                              <SelectItem key={timeline} value={timeline}>
                                {timeline}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Specific Date - Only show when "Specific Date" is selected */}
                  {decisionTimeline === "Specific Date" && (
                    <FormField
                      control={qualificationForm.control}
                      name="specificDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>
                            Specific Date{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Select a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={
                    updateLeadQualificationMutation.isPending ||
                    enterRaffleMutation.isPending
                  }
                >
                  {updateLeadQualificationMutation.isPending ||
                  enterRaffleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {enterRaffleMutation.isPending
                        ? "Entering Raffle..."
                        : "Submitting..."}
                    </>
                  ) : (
                    "Complete Raffle Entry"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 4: Success
  if (currentStep === "success" && ticketNumber) {
    const formattedTicketNumber = formatTicketNumber(ticketNumber);

    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="border-green-500 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 text-2xl">
              <CheckCircle2 className="h-8 w-8" />
              Raffle Entry Confirmed! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <p className="text-sm text-muted-foreground mb-2 text-center">
                Your raffle ticket number is:
              </p>
              <p className="text-4xl font-bold text-center tracking-wider text-blue-600 dark:text-blue-400">
                {formattedTicketNumber}
              </p>
            </div>

            <div className="text-center space-y-2 bg-muted p-4 rounded-lg">
              <p className="font-semibold">Winners will be announced at:</p>
              <p className="text-lg">{raffle.location || "The Event"}</p>
              <p className="text-muted-foreground">
                on {format(raffle.endDate, "PPPP")}
              </p>
            </div>

            <div className="text-center space-y-2 p-4">
              <p className="text-lg font-semibold">Thank you for entering!</p>
              <p className="text-muted-foreground">
                We will contact you if you win. 🍀
              </p>
            </div>

            <Button onClick={handleReset} className="w-full" size="lg">
              Enter Another Person
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
