export const DECISION_TIMELINES = [
  "This Term",
  "Next Term",
  "Specific Date",
  "Ready to Proceed",
  "SDC meets end of this term",
  "SDC meets next term",
  "Need more information",
  "Budget approval pending",
] as const;

// Map user-friendly labels to backend enum values
export const DECISION_TIMELINE_MAP: Record<string, string> = {
  "This Term": "this-term",
  "Next Term": "next-term",
  "Specific Date": "specific-date",
  "Ready to Proceed": "ready-to-proceed",
  "SDC meets end of this term": "sdc-meets-end-of-this-term",
  "SDC meets next term": "sdc-meets-next-term",
  "Need more information": "need-more-information",
  "Budget approval pending": "budget-approval-pending",
};
