ALTER TABLE `leads` MODIFY COLUMN `status` enum('new','contacted','qualified','unqualified','converted') NOT NULL DEFAULT 'new';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-11-17 14:55:56.016';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-11-17 14:55:56.016';--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `has_head`;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `has_bursar`;