ALTER TABLE `tasks` DROP FOREIGN KEY `tasks_assigned_to_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `tasks` DROP FOREIGN KEY `tasks_created_by_user_id_fk`;
--> statement-breakpoint
DROP INDEX `reference_idx` ON `tasks`;--> statement-breakpoint
DROP INDEX `assigned_to_idx` ON `tasks`;--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-19 03:12:25.864';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-19 03:12:25.864';--> statement-breakpoint
ALTER TABLE `events` ADD `lead_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `deal_id` varchar(36);--> statement-breakpoint
ALTER TABLE `lead_activities` ADD `deal_id` varchar(36);--> statement-breakpoint
ALTER TABLE `tasks` ADD `activity_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `lead_id` varchar(36);--> statement-breakpoint
ALTER TABLE `tasks` ADD `deal_id` varchar(36);--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_activity_id_unique` UNIQUE(`activity_id`);--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_deal_id_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_activities` ADD CONSTRAINT `lead_activities_deal_id_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_activity_id_lead_activities_id_fk` FOREIGN KEY (`activity_id`) REFERENCES `lead_activities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_deal_id_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `lead_deal_idx` ON `lead_activities` (`lead_id`,`deal_id`);--> statement-breakpoint
CREATE INDEX `lead_idx` ON `tasks` (`lead_id`);--> statement-breakpoint
CREATE INDEX `deal_idx` ON `tasks` (`deal_id`);--> statement-breakpoint
CREATE INDEX `activity_idx` ON `tasks` (`activity_id`);--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `reference_type`;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `reference_id`;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `assigned_to`;--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `created_by`;