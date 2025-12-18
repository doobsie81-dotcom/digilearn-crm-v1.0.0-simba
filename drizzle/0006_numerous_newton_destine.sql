ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-01 06:10:23.074';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `upated_at` datetime DEFAULT '2025-10-01 06:10:23.074';--> statement-breakpoint
ALTER TABLE `leads` ADD `status` enum('new','qualified','disqualified') DEFAULT 'new' NOT NULL;