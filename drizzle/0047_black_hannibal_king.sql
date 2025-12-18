ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-24 08:13:23.590';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-24 08:13:23.590';--> statement-breakpoint
ALTER TABLE `companies` ADD `region` enum('urban','rural');--> statement-breakpoint
ALTER TABLE `companies` ADD `province` varchar(10);--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `state`;--> statement-breakpoint
ALTER TABLE `companies` DROP COLUMN `postal_code`;