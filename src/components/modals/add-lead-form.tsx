"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Form } from "~/components/ui/form";

import { Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import Modal from "../ui/modal";
import LeadFormStep from "../forms/lead-form-step";
import LeadContactsFormStep from "../forms/lead-contacts-form-step";
// import EventForm from "../forms/event-form";
import ErrorMessage from "../error-message";
import { trpc } from "~/trpc/client";
import {
  leadInfoSchema,
  contactsSchema,
  eventSchema,
} from "~/validation/leads";
import useDebounceValue from "~/hooks/use-debounce-value";

export type LeadInfoValues = z.infer<typeof leadInfoSchema>;
export type ContactsValues = z.infer<typeof contactsSchema>;
export type EventValues = z.infer<typeof eventSchema>;

export type CreateLeadValues = {
  lead: LeadInfoValues;
  contacts: ContactsValues["contacts"];
  // event: EventValues;
};

interface CreateLeadModalFormProps {
  open: boolean;
  onClose: () => void;
}

export function CreateLeadModalForm({
  open,
  onClose,
}: CreateLeadModalFormProps) {
  const [step, setStep] = useState(1);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const debouncedCompanySearchTerm = useDebounceValue(companySearchTerm, 700);
  const utils = trpc.useUtils();
  const { data: companies, isLoading } = trpc.companies.list.useQuery({
    search: debouncedCompanySearchTerm,
    limit: 25,
  });
  // Step 1 Form
  const leadForm = useForm<LeadInfoValues>({
    resolver: zodResolver(leadInfoSchema),
    defaultValues: {
      name: "",
      source: "referral",
      companyName: "",
      city: "",
      estimatedValue: undefined,
      assignedTo: undefined,
    },
  });

  const companyId = leadForm.watch("companyId");

  // Step 2 Form
  const contactsForm = useForm<ContactsValues>({
    resolver: zodResolver(contactsSchema),
    defaultValues: {
      contacts: [
        {
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          jobTitle: "",
          role: "primary",
          isPrimary: true,
          id: "",
        },
      ],
    },
  });

  // Step 3 Form
  const eventForm = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      description: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
    },
  });

  const {
    mutateAsync: createLeadMutation,
    isPending,
    error: createLeadError,
  } = trpc.leads.createLead.useMutation({
    onSuccess: () => {
      utils.leads.getMany.invalidate();
      toast.success("Lead was successfully created");
    },
  });

  useEffect(() => {
    if (companyId && companies?.companies?.length) {
      const company = companies?.companies.find(
        (company) => company.id === companyId
      );
      if (company) {
        // update city, province and region
        leadForm.setValue("city", company.city ?? "");
        leadForm.setValue("province", company.province!);
        leadForm.setValue("region", company.region!);
        const contacts = company.persons.map((person, index) => ({
          ...{
            firstName: person.firstName,
            lastName: person.lastName,
            role: (index === 0
              ? "primary"
              : "other") as ContactsValues["contacts"][number]["role"],
            email: person.email ?? "",
            phoneNumber: person.phoneNumber ?? "",
            jobTitle: person.jobTitle ?? "",
            id: person.id,
          },
          isPrimary: index === 0,
        }));
        contactsForm.setValue("contacts", contacts);
      }
    }
  }, [companies?.companies, contactsForm.setValue, companyId]);

  const onPrev = () => setStep((current) => current - 1);

  const onNext = async () =>
    //data: LeadInfoValues | ContactsValues | EventValues
    {
      if (step === 2) {
        try {
          const leadData = leadForm.watch();
          const contactsData = contactsForm.watch();

          const fullData: CreateLeadValues = {
            lead: leadData,
            contacts: contactsData.contacts,
          };

          // TODO: Replace with actual API call
          await createLeadMutation(fullData, {
            onSuccess: () => {
              setStep(step + 1);
            },
          });
        } catch (error) {
          console.error("Error creating lead:", error);
          toast.error("Failed to create lead. Please try again.");
        }
      } else {
        setStep(step + 1);
      }
    };

  const handleClose = () => {
    setStep(1);
    leadForm.reset();
    contactsForm.reset();
    eventForm.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="Create New Lead"
      description={`
        Step ${step} of 3:
            ${
              step === 1
                ? "Lead Information"
                : step === 2
                  ? "Contacts"
                  : "Schedule Appointment"
            }
                `}
      className="min-w-3xl max-h-[90vh] overflow-y-auto"
    >
      {createLeadError && (
        <ErrorMessage
          title="Create Lead Error"
          message={createLeadError?.message}
        />
      )}
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                s <= step
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-gray-300 text-gray-500"
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  s < step ? "bg-primary" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Lead Information */}
      {step === 1 && (
        <Form {...leadForm}>
          {isLoading ? (
            <p>Loading Companies...</p>
          ) : (
            <LeadFormStep
              onSubmit={onNext}
              handleClose={handleClose}
              companies={companies?.companies || []}
              setCompanySearchTerm={setCompanySearchTerm}
            />
          )}
        </Form>
      )}

      {/* Step 2: Contacts */}
      {step === 2 && (
        <Form {...contactsForm}>
          <LeadContactsFormStep
            onSubmit={onNext}
            handleBack={onPrev}
            isSubmitting={isPending}
          />
        </Form>
      )}

      {/* Step 3: Schedule Appointment */}
      {step === 3 && (
        // <Form {...eventForm}>
        //   <EventForm
        //     onSubmit={onNext}
        //     isSubmitting={isPending}
        //     handleBack={onPrev}
        //   />
        // </Form>
        <div className="space-y-6 grid place-items-center">
          <div className="size-20 flex items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCheck className="size-8" />
          </div>
          <h3 className="font-semibold text-lg">
            Lead was successfully created.
          </h3>
          <p className="text-foreground/80">What do you want to do next?</p>
          <div>
            {/* go to lead page, create new lead, or schedule and event for the lead */}
          </div>
        </div>
      )}
    </Modal>
  );
}
