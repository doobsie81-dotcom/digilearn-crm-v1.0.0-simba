ALTER TABLE `invoices` MODIFY COLUMN `invoice_status` enum('Draft','Sent','Paid','Partially-Paid','Overdue','Cancelled') NOT NULL DEFAULT 'Draft';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-27 06:53:49.563';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-27 06:53:49.563';