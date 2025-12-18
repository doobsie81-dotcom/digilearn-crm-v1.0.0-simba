ALTER TABLE `companies` MODIFY COLUMN `owner_id` varchar(36);--> statement-breakpoint
ALTER TABLE `contacts` MODIFY COLUMN `owner_id` varchar(36);--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-11-25 09:51:47.661';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-11-25 09:51:47.661';