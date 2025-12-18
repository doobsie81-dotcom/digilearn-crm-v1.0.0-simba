"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Modal from "../ui/modal";
import CompanyForm, { CompanyFormValues } from "../forms/company-form";
import ErrorMessage from "../error-message";
import { trpc } from "~/trpc/client";
import { addCompanySchema } from "~/validation/companies";
import { Form } from "~/components/ui/form";

interface AddCompanyModalProps {
  open: boolean;
  onClose: () => void;
  companyId?: string | null;
}

export function AddCompanyModal({
  open,
  onClose,
  companyId,
}: AddCompanyModalProps) {
  const utils = trpc.useUtils();
  const isEdit = !!companyId;

  // Fetch company data if editing
  const { data: companyData, isLoading: isLoadingCompany } =
    trpc.companies.getById.useQuery(
      { id: companyId! },
      { enabled: isEdit && !!companyId }
    );

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(addCompanySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      website: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      province: "Harare",
      region: "urban",
      country: "",
      industry: "",
      description: "",
      employeeCount: undefined,
      annualRevenue: "",
    },
  });

  // Update form when company data is loaded
  useEffect(() => {
    if (companyData?.company && isEdit) {
      form.reset({
        name: companyData.company.name,
        website: companyData.company.website ?? "",
        addressLine1: companyData.company.addressLine1 ?? "",
        addressLine2: companyData.company.addressLine2 ?? "",
        city: companyData.company.city ?? "",
        province: companyData.company.province ?? "Harare",
        region: companyData.company.region ?? "urban",
        country: companyData.company.country ?? "",
        industry: companyData.company.industry ?? "",
        description: companyData.company.description ?? "",
        employeeCount: companyData.company.employeeCount ?? undefined,
        annualRevenue: companyData.company.annualRevenue ?? "",
      });
    }
  }, [companyData, isEdit, form]);

  const {
    mutateAsync: createCompanyMutation,
    isPending: isCreating,
    error: createError,
  } = trpc.companies.create.useMutation({
    onSuccess: () => {
      utils.companies.list.invalidate();
      utils.companies.getStatistics.invalidate();
      toast.success("Company was successfully created");
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create company");
    },
  });

  const {
    mutateAsync: updateCompanyMutation,
    isPending: isUpdating,
    error: updateError,
  } = trpc.companies.update.useMutation({
    onSuccess: () => {
      utils.companies.list.invalidate();
      utils.companies.getById.invalidate({ id: companyId! });
      utils.companies.getStatistics.invalidate();
      toast.success("Company was successfully updated");
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update company");
    },
  });

  const isPending = isCreating || isUpdating;
  const error = createError || updateError;

  const onSubmit = async (data: CompanyFormValues) => {
    try {
      if (isEdit && companyId) {
        await updateCompanyMutation({
          id: companyId,
          ...data,
        });
      } else {
        await createCompanyMutation(data);
      }
    } catch (error) {
      console.error("Error saving company:", error);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={isEdit ? "Edit Company" : "Create New Company"}
      description={
        isEdit
          ? "Update company information"
          : "Add a new company to your database"
      }
      className="min-w-3xl max-h-[90vh] overflow-y-auto"
    >
      {error && (
        <ErrorMessage
          title={isEdit ? "Update Company Error" : "Create Company Error"}
          message={error?.message}
        />
      )}

      {isLoadingCompany && isEdit ? (
        <div className="py-10 text-center">Loading company data...</div>
      ) : (
        <Form {...form}>
          <CompanyForm
            onSubmit={onSubmit}
            handleClose={handleClose}
            isSubmitting={isPending}
            isEdit={isEdit}
          />
        </Form>
      )}
    </Modal>
  );
}
