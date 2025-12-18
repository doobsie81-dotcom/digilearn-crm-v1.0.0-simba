CREATE TABLE `emails` (
	`id` varchar(36) NOT NULL,
	`activity_id` varchar(36) NOT NULL,
	`lead_id` varchar(36) NOT NULL,
	`deal_id` varchar(36),
	`composer_id` varchar(36),
	`body` text NOT NULL,
	`recipients` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emails_id` PRIMARY KEY(`id`),
	CONSTRAINT `emails_activity_id_unique` UNIQUE(`activity_id`)
);
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-21 14:11:40.166';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-21 14:11:40.166';--> statement-breakpoint
ALTER TABLE `emails` ADD CONSTRAINT `emails_activity_id_lead_activities_id_fk` FOREIGN KEY (`activity_id`) REFERENCES `lead_activities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emails` ADD CONSTRAINT `emails_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emails` ADD CONSTRAINT `emails_deal_id_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emails` ADD CONSTRAINT `emails_composer_id_user_id_fk` FOREIGN KEY (`composer_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activity_idx` ON `emails` (`activity_id`);--> statement-breakpoint
CREATE INDEX `lead_idx` ON `emails` (`lead_id`);--> statement-breakpoint
CREATE INDEX `deal_idx` ON `emails` (`deal_id`);--> statement-breakpoint
CREATE INDEX `lead_deal_idx` ON `emails` (`lead_id`,`deal_id`);--> statement-breakpoint
CREATE INDEX `userl_idx` ON `emails` (`composer_id`);