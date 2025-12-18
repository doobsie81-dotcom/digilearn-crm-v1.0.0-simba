ALTER TABLE `leads` MODIFY COLUMN `status` enum('new','qualified','unqualified','converted') NOT NULL DEFAULT 'new';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-11-17 10:27:53.627';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-11-17 10:27:53.627';--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `has_influential_contact` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `needs` text;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `has_needs` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `phone_verified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `email_verified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `province_verified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `has_verified_contact` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `decision_team`;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `product_needs`;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `has_product_needs`;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `valid_phone`;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `valid_email`;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `province`;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `has_valid_contact`;