"use client";

import { useState, useMemo, useEffect } from "react";
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
import { CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { cn } from "~/lib/utils";
import { trpc } from "~/trpc/client";
import { createInvoiceSchema } from "~/validation/accounting";
import { z } from "zod";
import { useSearchParams } from "next/navigation";
import InvoicePreviewModal from "~/components/modals/invoice-preview-modal";
import { DocumentItems } from "~/components/document-items";
import useDebounceValue from "~/hooks/use-debounce-value";
import { Autocomplete, type AutocompleteOption } from "~/components/ui/autocomplete";

interface CreateInvoiceFormProps {
  onSuccess?: (invoiceId: string) => void;
  defaultCompanyId?: string;
  defaultDealId?: string;
  defaultQuoteId?: string;
}

type CreateInvoiceValues = z.infer<typeof createInvoiceSchema>;

export default function CreateInvoiceForm({
  onSuccess,
  defaultCompanyId,
  defaultDealId,
  defaultQuoteId,
}: CreateInvoiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [newInvoiceId, setNewInvoiceId] = useState<string | null>(null);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");

  const debouncedCompanySearchTerm = useDebounceValue(companySearchTerm, 700);
  const debouncedProductSearchTerm = useDebounceValue(productSearchTerm, 700);

  const searchParams = useSearchParams();

  const quoteId = defaultQuoteId ?? searchParams.get("quoteId") ?? undefined;
  const utils = trpc.useUtils();

  // Prefetch data
  const { data: companies } = trpc.companies.list.useQuery({
    search: debouncedCompanySearchTerm,
  });
  const { data: products } = trpc.products.list.useQuery({
    search: debouncedProductSearchTerm,
    isActive: true,
  });
  const { data: quote } = trpc.quotes.getById.useQuery(
    { id: quoteId ?? "" },
    { enabled: !!quoteId }
  );

  const createInvoice = trpc.invoices.create.useMutation({
    onSuccess: (data) => {
      onSuccess?.(data.id);
      utils.invoices.listWithFilters.invalidate();
      setNewInvoiceId(data.id);
      setIsPreviewing(true);
      form.reset();
    },
  });

  const form = useForm<CreateInvoiceValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      clientId: defaultCompanyId ?? "",
      dealId: defaultDealId ?? "",
      quoteId: quoteId ?? "",
      dueDate: addDays(new Date(), 30),
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

  const { append } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { setValue } = form;
  const watchedClientId = form.watch("clientId");

  // If we have a quote, set the form values accordingly
  useEffect(() => {
    if (quote) {
      setValue("quoteId", quote.id);
      // now add line items from the quote
      if (quote.items && quote.items.length) {
        // clear existing items
        setValue("items", []);
        quote.items.forEach((item) => {
          append({
            productId: item.productId ?? "",
            description: item.description,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            discount: item.discount?.toString() ?? "0",
            tax: item.tax?.toString() ?? "0",
          });
        });
      }
      // set clientId, personId, dueDate from quote as well
      setValue("clientId", quote.clientId);
      setValue("dealId", quote.dealId ?? "");
      setValue("clientName", quote.clientName);
      setValue("clientEmail", quote.clientEmail ?? "");
      if (quote.personId) {
        setValue("personId", quote.personId);
      }
    }
  }, [quote, setValue, append]);

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
    // we have to update address here...
    // we can have a helper method for formatting the address

    // formValue.setValue('clientAddress', formatAddress(company))

    return company?.persons || [];
  }, [companies, watchedClientId]);

  const onSubmit = async (data: CreateInvoiceValues) => {
    setIsSubmitting(true);
    try {
      await createInvoice.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground mt-1">
            Generate a new Invoice for your customer
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <Card className="border-none ">
            <CardHeader className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
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
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Q-2025-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
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
            <CardContent>
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
              {isSubmitting ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </Form>
      <InvoicePreviewModal
        invoiceId={newInvoiceId}
        isOpen={isPreviewing}
        onClose={() => {
          setNewInvoiceId(null);
          setIsPreviewing(false);
        }}
      />
    </div>
  );
}
