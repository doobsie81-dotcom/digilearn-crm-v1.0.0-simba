/**
 * Payment Terms Calculator
 *
 * Calculates compound interest for Zimbabwean school term-based payment plans
 * using the ordinary annuity formula.
 */

export interface PaymentTermCalculationParams {
  subtotal: number;
  discount: number;
  taxRate: number; // Percentage (e.g., 16 for 16%)
  interestRate: number; // Annual percentage rate (e.g., 15 for 15%)
  numberOfTerms?: number; // Number of payment terms (default: 9)
}

export interface PaymentTermCalculationResult {
  subtotalAfterDiscount: number;
  interestAmount: number;
  amountBeforeTax: number;
  taxAmount: number;
  total: number;
  installmentAmount?: number;
  termCount?: number;
}

/**
 * Calculate payment terms with compound interest
 *
 * Formula: M = PV × i × (1 + i)^n / [(1 + i)^n - 1]
 * Where:
 * - M = installment amount per term
 * - PV = present value (cash price after discount)
 * - i = per-term interest rate (APR / compounding frequency)
 * - n = number of terms
 */
export function calculatePaymentTerms(
  params: PaymentTermCalculationParams
): PaymentTermCalculationResult {
  const { subtotal, discount, taxRate, interestRate, numberOfTerms = 9 } = params;

  // Step 1: Subtotal - Discount = Cash Price (PV)
  const cashPrice = subtotal - discount;

  // Step 2: Calculate compound interest using annuity formula
  const nominalApr = interestRate / 100; // Convert percentage to decimal
  const compoundingFrequency = 3; // Zimbabwean school terms per year
  const termCount = numberOfTerms;
  const perTermRate = nominalApr / compoundingFrequency; // i = APR / 3

  let interestAmount = 0;
  let totalPayable = cashPrice;
  let installment = 0;

  // Only calculate compound interest if there's a non-zero interest rate
  if (nominalApr > 0 && termCount > 0) {
    // Installment formula: M = PV * i * (1 + i)^n / [(1 + i)^n - 1]
    const onePlusI = 1 + perTermRate;
    const onePlusIPowerN = Math.pow(onePlusI, termCount);
    installment =
      (cashPrice * perTermRate * onePlusIPowerN) / (onePlusIPowerN - 1);

    // Total amount payable = installment * number of terms
    totalPayable = installment * termCount;

    // Interest = Total Payable - Cash Price
    interestAmount = totalPayable - cashPrice;
  }

  // Step 3: Amount Before Tax = Cash Price + Interest
  const amountBeforeTax = totalPayable;

  // Step 4: Calculate Tax
  const taxAmount = (amountBeforeTax * taxRate) / 100;

  // Step 5: Total = Amount Before Tax + Tax
  const total = amountBeforeTax + taxAmount;

  return {
    subtotalAfterDiscount: cashPrice,
    interestAmount,
    amountBeforeTax,
    taxAmount,
    total,
    installmentAmount: installment > 0 ? installment : undefined,
    termCount: termCount > 0 ? termCount : undefined,
  };
}

/**
 * Format installment information for display
 */
export function formatInstallmentInfo(result: PaymentTermCalculationResult): string {
  if (!result.installmentAmount || !result.termCount) {
    return "Cash payment - no installments";
  }

  return `${result.termCount} installments of $${result.installmentAmount.toFixed(2)} per term`;
}

/**
 * Generate payment terms notes for document
 */
export function generatePaymentTermsNotes(
  paymentTermName: string,
  result: PaymentTermCalculationResult,
  interestRate: number,
  termsAndConditions?: string
): string {
  const notes: string[] = [];

  notes.push(`Payment Terms: ${paymentTermName}`);

  if (result.installmentAmount && result.termCount) {
    notes.push(`Installment Plan: ${result.termCount} terms @ $${result.installmentAmount.toFixed(2)} per term`);
    notes.push(`Interest Rate: ${interestRate.toFixed(2)}% APR (compound interest)`);
    notes.push(`Total Interest: $${result.interestAmount.toFixed(2)}`);
  } else {
    notes.push("Payment Type: Cash (no interest)");
  }

  if (termsAndConditions) {
    notes.push("");
    notes.push("Terms & Conditions:");
    notes.push(termsAndConditions);
  }

  return notes.join("\n");
}
