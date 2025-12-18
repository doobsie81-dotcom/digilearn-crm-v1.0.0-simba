export type LeadStatus = "all" | "new" | "qualified" | "unqualified" | "converted";

export const STATUS_FILTERS: { value: LeadStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "unqualified", label: "Unqualified" },
  { value: "converted", label: "Converted" },
] as const;
