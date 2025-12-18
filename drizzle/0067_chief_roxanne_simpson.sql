ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-11-24 19:31:32.079';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-11-24 19:31:32.079';--> statement-breakpoint
ALTER TABLE `contacts` ADD `title` varchar(100);