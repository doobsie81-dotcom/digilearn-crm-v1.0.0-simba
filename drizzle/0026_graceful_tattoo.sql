ALTER TABLE `verification` MODIFY COLUMN `identifier` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-07 05:47:23.023';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-07 05:47:23.023';