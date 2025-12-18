"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Calendar } from "~/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "~/lib/utils";
import { trpc } from "~/trpc/client";
import { createQuoteSchema } from "~/validation/accounting";
import { z } from "zod";
import QuotePreviewModal from "~/components/modals/quote-preview-modal";
import { generateDocumentNumber } from "~/lib/generators";
import { DocumentItems } from "~/components/document-items";
import useDebounceValue from "~/hooks/use-debounce-value";
import {
  Autocomplete,
  type AutocompleteOption,
} from "~/components/ui/autocomplete";

interface CreateQuoteFormProps {
  onSuccess?: (quoteId: string) => void;
  defaultCompanyId?: string | null;
  defaultDealId?: string | null;
}

type CreateQuoteValues = z.infer<typeof createQuoteSchema>;

export default function CreateQuoteForm({
  onSuccess,
  defaultCompanyId,
  defaultDealId,
}: CreateQuoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [newQuoteId, setNewQuoteId] = useState<string | null>(null);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");

  const debouncedCompanySearchTerm = useDebounceValue(companySearchTerm, 700);
  const debouncedProductSearchTerm = useDebounceValue(productSearchTerm, 700);

  const utils = trpc.useUtils();
  // Prefetch data
  const { data: dealData } = trpc.deals.getDealDetails.useQuery(
    defaultDealId ?? "",
    { enabled: !!defaultDealId }
  );
  const { data: companies, isFetching } = trpc.companies.list.useQuery({
    search: debouncedCompanySearchTerm,
  });
  const { data: products } = trpc.products.list.useQuery({
    search: debouncedProductSearchTerm,
    isActive: true,
  });

  const createQuote = trpc.quotes.create.useMutation({
    onSuccess: (data) => {
      onSuccess?.(data.id);
      utils.quotes.listWithFilters.invalidate();
      setNewQuoteId(data.id);
      setIsPreviewing(true);
      form.reset();
    },
  });

  const form = useForm<CreateQuoteValues>({
    resolver: zodResolver(createQuoteSchema),
    defaultValues: {
      quoteNumber: generateDocumentNumber(),
      clientId: defaultCompanyId ?? "",
      dealId: defaultDealId ?? "",
      items: [
        {
          productId: "",
          description: "",
          quantity: "1",
          unitPrice: "0",
          discount: "0",
          tax: "0",
        },
      ],
      paymentTermId: undefined,
      interest: undefined,
      tax: undefined,
      total: undefined,
    },
  });

  const { setValue } = form;

  const watchedClientId = form.watch("clientId");

  const companyOptions: AutocompleteOption[] = useMemo(
    () =>
      (companies?.companies || []).map((company) => ({
        value: company.id,
        label: company.name,
        subtitle: company.city
          ? `${company.city}${company.province ? `, ${company.province}` : ""}`
          : undefined,
      })),
    [companies]
  );

  const persons = useMemo(() => {
    if (!companies?.companies && !companies?.companies?.length) return [];
    if (!watchedClientId) return [];

    const company = companies.companies.find(
      (company) => company.id === watchedClientId
    );

    return company?.persons || [];
  }, [companies, watchedClientId]);

  useEffect(() => {
    if (dealData) {
      // Set company/client

      if (dealData.companyId) {
        const company = companies?.companies.find(
          (c) => c.id === dealData.companyId
        );
        setValue("clientId", dealData.companyId);
        setValue("clientAddress", company?.addressLine1 ?? "");
      }

      // Set contact person if available
      if (dealData.lead.primaryContact) {
        const person = dealData.lead.primaryContact;
        setValue("personId", person.id);
        setValue("clientEmail", person.email);
        setValue("clientName", `${person.firstName} ${person.lastName}`);
      }

      // Set deal ID
      setValue("dealId", dealData.id);
    }
  }, [dealData, companies?.companies, setValue, defaultDealId]);

  const onSubmit = async (data: CreateQuoteValues) => {
    setIsSubmitting(true);
    try {
      await createQuote.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Quote</h1>
          <p className="text-muted-foreground mt-1">
            Generate a new quote for your customer
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <Card className="border-none ">
            <CardHeader className="bg-gradient-to-br from-slate-50 py-1.5 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>
                Select the organization and contact person
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization *</FormLabel>
                      <FormControl>
                        <Autocomplete
                          value={field.value}
                          onValueChange={field.onChange}
                          options={companyOptions}
                          placeholder="Select organization"
                          searchPlaceholder="Search companies..."
                          emptyText="No companies found"
                          searchValue={companySearchTerm}
                          onSearchChange={setCompanySearchTerm}
                          isLoading={isFetching}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // update clientName,
                          const person = persons.find(
                            (person) => person.id === value
                          );
                          if (person) {
                            form.setValue(
                              "clientName",
                              `${person.firstName} ${person.lastName}`
                            );
                            form.setValue("clientEmail", person.email);
                          }
                        }}
                        value={field.value}
                        defaultValue={field.value}
                        disabled={!watchedClientId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contact" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* this is coming from selected company */}
                          {persons?.map((person) => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.firstName} {person.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="quoteNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote Number *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Q-2025-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until</FormLabel>
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
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card className="border-none ">
            <CardContent className="pt-6">
              <DocumentItems
                products={products || []}
                productSearchTerm={productSearchTerm}
                onSearch={setProductSearchTerm}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-none ">
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>
                Add any special terms or conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter any additional notes or terms..."
                        className="min-h-[100px] resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" size="lg">
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="min-w-[150px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSubmitting ? "Creating..." : "Create Quote"}
            </Button>
          </div>
        </form>
      </Form>
      <QuotePreviewModal
        quoteId={newQuoteId}
        isOpen={isPreviewing}
        onClose={() => {
          setNewQuoteId(null);
          setIsPreviewing(false);
        }}
      />
    </div>
  );
}
