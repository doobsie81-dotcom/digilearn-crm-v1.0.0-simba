ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-24 07:18:45.977';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-24 07:18:45.977';--> statement-breakpoint
ALTER TABLE `invoices` ADD `discount` decimal(10,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `discount` decimal(10,2) DEFAULT '0.00' NOT NULL;