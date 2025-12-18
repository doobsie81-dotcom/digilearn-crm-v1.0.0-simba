ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-31 14:53:51.161';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-31 14:53:51.161';--> statement-breakpoint
ALTER TABLE `document_items` ADD `tax_rate` enum('0','14.5');--> statement-breakpoint
ALTER TABLE `invoices` DROP COLUMN `tax_rate`;--> statement-breakpoint
ALTER TABLE `quotes` DROP COLUMN `tax_rate`;