ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-30 07:53:53.941';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-30 07:53:53.941';--> statement-breakpoint
ALTER TABLE `session` ADD `impersonated_by` varchar(36);--> statement-breakpoint
ALTER TABLE `user` ADD `banned` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `user` ADD `ban_reason` text;--> statement-breakpoint
ALTER TABLE `user` ADD `ban_expires` timestamp;