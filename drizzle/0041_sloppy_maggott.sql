CREATE TABLE `notes` (
	`id` varchar(36) NOT NULL,
	`activity_id` varchar(36) NOT NULL,
	`lead_id` varchar(36) NOT NULL,
	`deal_id` varchar(36),
	`content` text NOT NULL,
	`tags` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `notes_activity_id_unique` UNIQUE(`activity_id`)
);
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-20 18:02:31.165';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-20 18:02:31.165';--> statement-breakpoint
ALTER TABLE `deals` ADD `close_status` enum('ongoing','won','lost') DEFAULT 'ongoing';--> statement-breakpoint
ALTER TABLE `notes` ADD CONSTRAINT `notes_activity_id_lead_activities_id_fk` FOREIGN KEY (`activity_id`) REFERENCES `lead_activities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notes` ADD CONSTRAINT `notes_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notes` ADD CONSTRAINT `notes_deal_id_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_idx` ON `notes` (`activity_id`);--> statement-breakpoint
CREATE INDEX `lead_idx` ON `notes` (`lead_id`);--> statement-breakpoint
CREATE INDEX `deal_idx` ON `notes` (`deal_id`);--> statement-breakpoint
CREATE INDEX `lead_deal_idx` ON `notes` (`lead_id`,`deal_id`);