DROP TABLE `event_attendees`;--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-19 08:29:42.013';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-19 08:29:42.013';--> statement-breakpoint
ALTER TABLE `events` ADD `activity_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `platform` enum('zoom','teams','google_meet','in_person') NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `location` varchar(255);--> statement-breakpoint
ALTER TABLE `events` ADD `attendees` text;--> statement-breakpoint
ALTER TABLE `events` ADD `agenda` text;--> statement-breakpoint
ALTER TABLE `events` ADD `meeting_link` text;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_activity_id_unique` UNIQUE(`activity_id`);--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_activity_id_lead_activities_id_fk` FOREIGN KEY (`activity_id`) REFERENCES `lead_activities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` DROP COLUMN `google_calendar_ref`;