export const TAX_CONFIG = [
  {
    name: "Zero Tax (0%)",
    rate: 0,
  },
  {
    name: "Vat 15",
    rate: 14.5,
  },
] as const;

export type TaxNames = (typeof TAX_CONFIG)[number]["name"];
export type Tax = (typeof TAX_CONFIG)[number];
