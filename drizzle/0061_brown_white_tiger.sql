CREATE TABLE `files` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`original_name` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`size` bigint NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`type` enum('image','pdf','document','spreadsheet','other') NOT NULL,
	`lead_id` varchar(36),
	`deal_id` varchar(36),
	`uploaded_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-11-17 07:21:37.995';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-11-17 07:21:37.995';--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_deal_id_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_uploaded_by_user_id_fk` FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `lead_idx` ON `files` (`lead_id`);--> statement-breakpoint
CREATE INDEX `deal_idx` ON `files` (`deal_id`);--> statement-breakpoint
CREATE INDEX `uploaded_by_idx` ON `files` (`uploaded_by`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `files` (`created_at`);