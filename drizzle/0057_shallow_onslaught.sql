CREATE TABLE `permissions` (
	`id` varchar(36) NOT NULL,
	`role` enum('admin','sales-agent','sales-manager','manager') NOT NULL,
	`action` enum('create','read','update','delete','manage') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`conditions` text,
	`inverted` boolean DEFAULT false,
	CONSTRAINT `permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-11-06 13:32:26.371';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-11-06 13:32:26.371';