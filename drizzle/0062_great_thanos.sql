DROP INDEX `lead_idx` ON `lead_qualification_criteria`;--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-11-17 09:54:21.676';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-11-17 09:54:21.676';--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `decision_team` json;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `has_head` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `has_bursar` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `product_needs` json;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `has_product_needs` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `plan_type` enum('cash','3-term','6-term','9-term');--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `has_plan_type` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `timeline_type` enum('this-term','next-term','specific-date');--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `specific_date` timestamp;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `has_timeline` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `budget_indicator` enum('high','medium','low','not-disclosed');--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `budget_amount` decimal(15,2);--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `has_budget` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `valid_phone` varchar(20);--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `valid_email` varchar(255);--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `province` varchar(100);--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `has_valid_contact` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `completion_percentage` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD `is_qualified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD CONSTRAINT `lead_qualification_criteria_lead_id_unique` UNIQUE(`lead_id`);--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` ADD CONSTRAINT `lead_qualification_criteria_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `budget`;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `authority`;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `need`;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `timeline`;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `notes`;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `qualified_by`;--> statement-breakpoint
ALTER TABLE `lead_qualification_criteria` DROP COLUMN `qualified_at`;