ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-30 18:35:10.332';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-30 18:35:10.332';--> statement-breakpoint
ALTER TABLE `invoices` ADD `tax_rate` enum('0','14.5');--> statement-breakpoint
ALTER TABLE `quotes` ADD `tax_rate` enum('0','14.5');