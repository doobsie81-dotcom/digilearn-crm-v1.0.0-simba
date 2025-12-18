ALTER TABLE `events` DROP FOREIGN KEY `events_created_by_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-19 08:38:21.332';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-19 08:38:21.332';--> statement-breakpoint
ALTER TABLE `events` DROP COLUMN `created_by`;