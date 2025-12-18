ALTER TABLE `user` MODIFY COLUMN `role` enum('admin','sales-agent','sales-manager','manager') NOT NULL DEFAULT 'sales-agent';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-13 06:15:35.424';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-13 06:15:35.424';