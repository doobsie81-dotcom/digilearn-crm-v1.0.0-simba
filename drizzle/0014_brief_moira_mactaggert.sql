CREATE TABLE `deal_stage_history` (
	`id` varchar(36) NOT NULL,
	`deal_id` varchar(36) NOT NULL,
	`from_status` varchar(255),
	`to_status` varchar(255) NOT NULL,
	`notes` text,
	`moved_by` varchar(255) NOT NULL,
	`moved_by_id` varchar(36),
	`moved_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deal_stage_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pipeline_stages` (
	`id` varchar(36) NOT NULL,
	`status` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`order` int NOT NULL,
	`color` text NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pipeline_stages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pipeline_stages_status_unique` UNIQUE(`status`),
	CONSTRAINT `pipeline_stages_order_unique` UNIQUE(`order`)
);
--> statement-breakpoint
DROP TABLE `pipelines`;--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-02 19:41:07.812';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `upated_at` datetime DEFAULT '2025-10-02 19:41:07.812';--> statement-breakpoint
ALTER TABLE `deals` ADD `lead_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `title` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `description` text;--> statement-breakpoint
ALTER TABLE `deals` ADD `value` decimal(12,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `currency` text DEFAULT ('USD') NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `current_status` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `probability` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `deals` ADD `expected_close_date` timestamp;--> statement-breakpoint
ALTER TABLE `deals` ADD `actual_close_date` timestamp;--> statement-breakpoint
ALTER TABLE `deals` ADD `lost_reason` text;--> statement-breakpoint
ALTER TABLE `deals` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `deal_stage_history` ADD CONSTRAINT `deal_stage_history_deal_id_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deal_stage_history` ADD CONSTRAINT `deal_stage_history_moved_by_id_user_id_fk` FOREIGN KEY (`moved_by_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deals` ADD CONSTRAINT `deals_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;