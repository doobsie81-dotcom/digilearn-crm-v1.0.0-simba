ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-27 07:14:10.394';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-27 07:14:10.394';--> statement-breakpoint
ALTER TABLE `quotes` ADD `po_received` boolean DEFAULT false;