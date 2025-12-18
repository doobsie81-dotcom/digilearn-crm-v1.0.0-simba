export function formatCurrency(
  amount: number,
  currency: string = "USD",
  exchangeRate?: number
): string {
  let value = amount;
  if (exchangeRate && !isNaN(exchangeRate)) {
    value = value * exchangeRate;
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
