CREATE TABLE `deal_competitors` (
	`id` varchar(36) NOT NULL,
	`deal_id` varchar(36) NOT NULL,
	`competitor_name` text NOT NULL,
	`competitor_strength` int DEFAULT 50,
	`our_advantage` text,
	`their_advantage` text,
	`status` enum('active','eliminated','unknown') DEFAULT 'active',
	`notes` text,
	`identified_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deal_competitors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deal_health_history` (
	`id` varchar(36) NOT NULL,
	`deal_id` varchar(36) NOT NULL,
	`overall_score` int NOT NULL,
	`stakeholder_engagement` int NOT NULL,
	`timing` int NOT NULL,
	`competition` int NOT NULL,
	`budget` int NOT NULL,
	`notes` text,
	`calculated_by` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deal_health_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deal_stakeholders` (
	`id` varchar(36) NOT NULL,
	`deal_id` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`title` text,
	`email` text,
	`phone` text,
	`role` text NOT NULL,
	`influence` int NOT NULL DEFAULT 50,
	`sentiment` text DEFAULT ('neutral'),
	`last_contacted_at` timestamp,
	`contact_frequency` int DEFAULT 0,
	`engaged` boolean DEFAULT false,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deal_stakeholders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `deals` MODIFY COLUMN `currency` varchar(10) NOT NULL DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE `deals` MODIFY COLUMN `probability` int NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-06 11:52:01.765';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `upated_at` datetime DEFAULT '2025-10-06 11:52:01.765';--> statement-breakpoint
ALTER TABLE `deals` ADD `health_score` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `health_score_stakeholder_engagement` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `health_score_timing` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `health_score_competition` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `health_score_budget` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `health_score_last_calculated` timestamp;--> statement-breakpoint
ALTER TABLE `deal_competitors` ADD CONSTRAINT `deal_competitors_deal_id_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deal_health_history` ADD CONSTRAINT `deal_health_history_deal_id_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deal_stakeholders` ADD CONSTRAINT `deal_stakeholders_deal_id_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE cascade ON UPDATE no action;