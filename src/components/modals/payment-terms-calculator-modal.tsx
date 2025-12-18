"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
  FormField,
  FormDescription,
  FormLabel,
  FormControl,
  FormMessage,
  FormItem,
  Form,
} from "~/components/ui/form";
import Modal from "~/components/ui/modal";
import { trpc } from "~/trpc/client";
import { Calculator, DollarSign, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  calculatePaymentTerms,
  type PaymentTermCalculationResult,
} from "~/lib/payment-terms-calculator";

const calculatorSchema = z.object({
  paymentTermId: z.string().min(1, "Please select a payment term"),
  subtotal: z.number().min(0, "Subtotal must be positive"),
  discount: z.number().min(0, "Discount must be positive"),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0 and 100"),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

interface PaymentTermsCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: {
    paymentTermId: string;
    interest: number;
    tax: number;
    total: number;
  }) => void;
  // If these are provided, calculator is linked to a document
  initialSubtotal?: number;
  initialDiscount?: number;
  initialTaxRate?: number;
  initialPaymentTermId?: string;
  disableInputs?: boolean;
}

export default function PaymentTermsCalculatorModal({
  isOpen,
  onClose,
  onApply,
  initialSubtotal,
  initialDiscount,
  initialTaxRate,
  initialPaymentTermId,
  disableInputs,
}: PaymentTermsCalculatorModalProps) {
  const [calculationResult, setCalculationResult] =
    useState<PaymentTermCalculationResult | null>(null);

  const { data: paymentTerms = [], isLoading } =
    trpc.paymentTerms.getAll.useQuery({
      includeInactive: false,
    });

  // Get default payment term (cash)
  const defaultTerm =
    paymentTerms.find((t) => t.isDefault) ||
    paymentTerms.find((t) => t.type === "cash");

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: useMemo(
      () => ({
        paymentTermId: initialPaymentTermId || defaultTerm?.id || "",
        subtotal: initialSubtotal ?? 0,
        discount: initialDiscount ?? 0,
        taxRate: initialTaxRate ?? 0,
      }),
      [
        initialPaymentTermId,
        initialSubtotal,
        initialDiscount,
        initialTaxRate,
        defaultTerm?.id,
      ]
    ),
  });

  // Update form values when initial props change
  useEffect(() => {
    form.setValue("subtotal", initialSubtotal ?? 0);
    form.setValue("discount", initialDiscount ?? 0);
    form.setValue("taxRate", initialTaxRate ?? 0);
    if (initialPaymentTermId) {
      form.setValue("paymentTermId", initialPaymentTermId);
    } else if (defaultTerm?.id) {
      form.setValue("paymentTermId", defaultTerm.id);
    }
  }, [
    initialSubtotal,
    initialDiscount,
    initialTaxRate,
    initialPaymentTermId,
    defaultTerm?.id,
    form,
  ]);

  const selectedPaymentTermId = form.watch("paymentTermId");
  const subtotal = form.watch("subtotal");
  const discount = form.watch("discount");
  const taxRate = form.watch("taxRate");

  // Find the selected payment term
  const selectedTerm = paymentTerms.find((t) => t.id === selectedPaymentTermId);

  // Auto-calculate when values change
  useEffect(() => {
    if (
      selectedPaymentTermId &&
      subtotal !== undefined &&
      taxRate !== undefined
    ) {
      calculateTotals();
    }
  }, [selectedPaymentTermId, subtotal, discount, taxRate]);

  const calculateTotals = () => {
    if (!selectedTerm) return;

    const result = calculatePaymentTerms({
      subtotal: Number(subtotal) || 0,
      discount: Number(discount) || 0,
      taxRate: Number(taxRate) || 0,
      interestRate: parseFloat(selectedTerm.interestRate),
      numberOfTerms: selectedTerm.numberOfTerms || 1,
    });

    setCalculationResult(result);
  };

  const handleApply = () => {
    if (!calculationResult) {
      toast.error("Please calculate totals first");
      return;
    }

    onApply({
      paymentTermId: selectedPaymentTermId,
      interest: calculationResult.interestAmount,
      tax: calculationResult.taxAmount,
      total: calculationResult.total,
    });

    toast.success("Payment terms applied successfully");
    onClose();
  };

  const handleClose = () => {
    setCalculationResult(null);
    form.reset();
    onClose();
  };

  if (isLoading) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Payment Terms Calculator
        </div>
      }
      description="Calculate interest and final totals based on selected payment terms"
      className="max-w-3xl"
    >
      <Form {...form}>
        <form className="space-y-6">
          {/* Payment Term Selection */}
          <FormField
            control={form.control}
            name="paymentTermId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Term</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment term" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paymentTerms.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{term.name || term.type}</span>
                          <span className="text-muted-foreground text-xs">
                            {parseFloat(term.interestRate).toFixed(2)}% interest
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTerm?.description && (
                  <FormDescription>{selectedTerm.description}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            {/* Subtotal */}
            <FormField
              control={form.control}
              name="subtotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtotal</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-9"
                        disabled={disableInputs}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Total product value</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Discount */}
            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-9"
                        {...field}
                        disabled={disableInputs}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Total discount</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tax Rate */}
            <FormField
              control={form.control}
              name="taxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Rate (%)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="16.00"
                        className="pl-9"
                        disabled={disableInputs}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>VAT/Tax rate</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Calculation Result */}
          {calculationResult && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Calculation Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">
                      {Number(subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>- {Number(discount || 0).toFixed(2)}</span>
                  </div>
                  <hr className="border-dashed" />
                  <div className="flex justify-between">
                    <span>Subtotal After Discount:</span>
                    <span className="font-semibold">
                      {calculationResult.subtotalAfterDiscount.toFixed(2)}
                    </span>
                  </div>
                  {calculationResult.installmentAmount &&
                    calculationResult.termCount && (
                      <div className="flex justify-between text-purple-600">
                        <span>
                          Installment ({calculationResult.termCount} terms):
                        </span>
                        <span>
                          {calculationResult.installmentAmount.toFixed(2)} per
                          term
                        </span>
                      </div>
                    )}
                  <div className="flex justify-between text-blue-600">
                    <span>
                      Interest (
                      {parseFloat(selectedTerm?.interestRate || "0").toFixed(2)}
                      % APR):
                    </span>
                    <span>+ {calculationResult.interestAmount.toFixed(2)}</span>
                  </div>
                  <hr className="border-dashed" />
                  <div className="flex justify-between">
                    <span>Amount Before Tax:</span>
                    <span className="font-semibold">
                      {calculationResult.amountBeforeTax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Tax ({taxRate}%):</span>
                    <span>+ {calculationResult.taxAmount.toFixed(2)}</span>
                  </div>
                  <hr className="border-double border-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>TOTAL:</span>
                    <span className="text-primary">
                      {calculationResult.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {selectedTerm?.termsAndConditions && (
                  <div className="mt-4 p-3 bg-background rounded-md border">
                    <p className="text-xs font-semibold mb-1">
                      Terms & Conditions:
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {selectedTerm.termsAndConditions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={!calculationResult || !selectedPaymentTermId}
            >
              Apply Payment Terms
            </Button>
          </div>
        </form>
      </Form>
    </Modal>
  );
}
