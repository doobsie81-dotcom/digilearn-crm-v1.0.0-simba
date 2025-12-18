ALTER TABLE `event_attendees` DROP FOREIGN KEY `event_attendees_user_id_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-18 16:15:09.338';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-18 16:15:09.338';--> statement-breakpoint
ALTER TABLE `event_attendees` ADD `email` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `event_attendees` DROP COLUMN `user_id`;