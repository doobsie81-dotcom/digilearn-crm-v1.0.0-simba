ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-20 05:09:16.672';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-20 05:09:16.672';--> statement-breakpoint
ALTER TABLE `deals` ADD `position` int DEFAULT 1000 NOT NULL;