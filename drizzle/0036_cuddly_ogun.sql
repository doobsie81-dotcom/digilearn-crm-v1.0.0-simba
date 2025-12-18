ALTER TABLE `events` MODIFY COLUMN `lead_id` varchar(36);--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-19 03:21:43.531';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-19 03:21:43.531';