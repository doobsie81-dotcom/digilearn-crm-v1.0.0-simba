export const EMAIL_PRIORITIES = ['low', 'normal', 'high'] as const;
export type EmailPriority = typeof EMAIL_PRIORITIES[number];

export const EMAIL_STATUSES = ['draft', 'sent', 'failed', 'pending'] as const;
export type EmailStatus = typeof EMAIL_STATUSES[number];

export const EMAIL_CATEGORIES = ['general', 'marketing', 'sales', 'support', 'internal'] as const;
export type EmailCategory = typeof EMAIL_CATEGORIES[number];
