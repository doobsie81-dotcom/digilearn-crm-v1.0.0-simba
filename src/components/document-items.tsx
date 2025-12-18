"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Product, PaymentTerm } from "~/db/types";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { useCallback, useMemo, useState } from "react";
import { TAX_CONFIG } from "~/data/tax-configs";
import {
  createInvoiceSchema,
  createQuoteSchema,
} from "~/validation/accounting";
import { Input } from "./ui/input";
import z from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Autocomplete, type AutocompleteOption } from "./ui/autocomplete";
import PaymentTermsCalculatorModal from "./modals/payment-terms-calculator-modal";
import { trpc } from "~/trpc/client";
import {
  calculatePaymentTerms,
  generatePaymentTermsNotes,
} from "~/lib/payment-terms-calculator";

interface DocumentItemsProps {
  products: Product[];
  onSearch?: (value: string) => void;
  productSearchTerm?: string;
}

type Form =
  | z.infer<typeof createInvoiceSchema>
  | z.infer<typeof createQuoteSchema>;

export const DocumentItems = ({
  products,
  onSearch,
  productSearchTerm,
}: DocumentItemsProps) => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const form = useFormContext<Form>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const paymentTermId = form.watch("paymentTermId");
  const appliedInterest = form.watch("interest");
  const appliedTax = form.watch("tax");
  const appliedTotal = form.watch("total");

  // Fetch payment terms to display selected term
  const { data: paymentTerms = [] } = trpc.paymentTerms.getAll.useQuery({
    includeInactive: false,
  });

  const selectedPaymentTerm = paymentTerms.find((t) => t.id === paymentTermId);

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    watchedItems?.forEach((item) => {
      const qty = parseFloat(item.quantity || "0");
      const price = parseFloat(item.unitPrice || "0");
      const discountPercent = parseFloat(item.discount || "0");
      const taxPercent = parseFloat(item.taxRate || "0");

      const itemSubtotal = qty * price;
      const itemDiscount = (itemSubtotal * discountPercent) / 100;
      const itemTax = ((itemSubtotal - itemDiscount) * taxPercent) / 100;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalTax += itemTax;
    });

    const total = subtotal - totalDiscount + totalTax;

    return { subtotal, totalDiscount, totalTax, total };
  };

  const calculateItemTotal = useCallback(
    (index: number) => {
      const item = watchedItems[index];
      const qty = parseFloat(item?.quantity || "0");
      const price = parseFloat(item?.unitPrice || "0");
      const discountPercent = parseFloat(item?.discount || "0");
      const taxPercent = parseFloat(item?.taxRate || "0");

      const subtotal = qty * price;
      const discountAmount = (subtotal * discountPercent) / 100;
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = (taxableAmount * taxPercent) / 100;
      const total = taxableAmount + taxAmount;

      return total.toFixed(2);
    },
    [watchedItems]
  );

  const productOptions: AutocompleteOption[] = useMemo(
    () =>
      (products || []).map((product) => ({
        value: product.id,
        label: product.name,
        subtitle: `$${product.price}`,
      })),
    [products]
  );

  const totals = calculateTotals();

  return (
    <div className="pt-6 mb-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Tax</TableHead>
            <TableHead className="max-w-32">Item Total</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => (
            <TableRow key={field.id}>
              <TableCell className="space-y-1">
                <FormField
                  control={form.control}
                  name={`items.${index}.productId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Autocomplete
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            const product = products?.find(
                              (p) => p.id === value
                            );
                            if (product) {
                              form.setValue(
                                `items.${index}.description`,
                                product.name
                              );
                              form.setValue(
                                `items.${index}.unitPrice`,
                                product.price
                              );
                            }
                          }}
                          options={productOptions}
                          placeholder="Select product"
                          searchPlaceholder="Search products..."
                          emptyText="No products found"
                          searchValue={productSearchTerm}
                          onSearchChange={onSearch}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="Item description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TableCell>
              <TableCell className="align-top max-w-32">
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TableCell>
              <TableCell className="align-top max-w-32">
                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TableCell>
              <TableCell className="align-top max-w-32">
                <FormField
                  control={form.control}
                  name={`items.${index}.discount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} type="number" step="5" min="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TableCell>
              <TableCell className="align-top max-w-32">
                <FormField
                  control={form.control}
                  name={`items.${index}.taxRate`}
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Tax" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TAX_CONFIG.map((tax) => (
                            <SelectItem
                              key={tax.name}
                              value={tax.rate.toString()}
                            >
                              {tax.name},{tax.rate}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />{" "}
              </TableCell>
              <TableCell className="align-top max-w-32">
                <div className="flex justify-end max-w-32">
                  <span className="font-semibold">
                    ${calculateItemTotal(index)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="shrink-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Separator className="my-6" />
      <div className="flex items-start gap-x-2">
        <div className="flex flex-1 items-center gap-x-2">
          <Button
            type="button"
            onClick={() =>
              append({
                description: "",
                quantity: "1",
                unitPrice: "0",
                discount: "0",
                tax: "0",
              })
            }
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsTermsModalOpen(true)}
          >
            Apply Terms
          </Button>
        </div>
        {/* Totals Summary */}
        <div className="rounded-lg w-lg max-w-full bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium text-green-600">
                -${totals.totalDiscount.toFixed(2)}
              </span>
            </div>

            {/* Payment Term Information */}
            {selectedPaymentTerm && appliedInterest !== undefined && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment Plan</span>
                  <span className="font-semibold">
                    {selectedPaymentTerm.name || selectedPaymentTerm.type}
                  </span>
                </div>
                {parseFloat(appliedInterest) > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>
                        Interest (
                        {parseFloat(selectedPaymentTerm.interestRate).toFixed(
                          2
                        )}
                        % APR)
                      </span>
                      <span>+${parseFloat(appliedInterest).toFixed(2)}</span>
                    </div>
                    {selectedPaymentTerm.numberOfTerms && (
                      <div className="flex justify-between text-xs text-purple-600">
                        <span>Installments</span>
                        <span>
                          {selectedPaymentTerm.numberOfTerms} terms @ $
                          {(
                            (totals.subtotal -
                              totals.totalDiscount +
                              parseFloat(appliedInterest)) /
                            selectedPaymentTerm.numberOfTerms
                          ).toFixed(2)}
                          /term
                        </span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">
                $
                {appliedTax
                  ? parseFloat(appliedTax).toFixed(2)
                  : totals.totalTax.toFixed(2)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">
                $
                {appliedTotal
                  ? parseFloat(appliedTotal).toFixed(2)
                  : totals.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <PaymentTermsCalculatorModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        disableInputs
        onApply={(data) => {
          const selectedTerm = paymentTerms.find(
            (t) => t.id === data.paymentTermId
          );

          // Set payment term values (convert numbers to strings for validation schema)
          form.setValue("paymentTermId", data.paymentTermId);
          form.setValue("interest", data.interest.toString());
          form.setValue("tax", data.tax.toString());
          form.setValue("total", data.total.toString());

          // Generate and append payment terms notes
          if (selectedTerm) {
            const result = calculatePaymentTerms({
              subtotal: totals.subtotal,
              discount: totals.totalDiscount,
              taxRate: 0, // Tax rate is 0 here since we're just generating notes
              interestRate: parseFloat(selectedTerm.interestRate),
              numberOfTerms: selectedTerm.numberOfTerms || 9,
            });

            const paymentNotes = generatePaymentTermsNotes(
              selectedTerm.name || selectedTerm.type,
              result,
              parseFloat(selectedTerm.interestRate),
              selectedTerm.termsAndConditions || undefined
            );

            // Append to existing notes if any
            const currentNotes = form.getValues("notes") || "";
            const newNotes = currentNotes
              ? `${currentNotes}\n\n---\n${paymentNotes}`
              : paymentNotes;
            form.setValue("notes", newNotes);
          }

          setIsTermsModalOpen(false);
        }}
        initialSubtotal={totals.subtotal}
        initialDiscount={totals.totalDiscount}
        initialTaxRate={0}
        initialPaymentTermId={paymentTermId}
      />
    </div>
  );
};
