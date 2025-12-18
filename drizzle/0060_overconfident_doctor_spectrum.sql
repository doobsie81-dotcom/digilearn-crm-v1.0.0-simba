CREATE TABLE `call_outcomes` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`variant` enum('success','warning','default') DEFAULT 'default',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `call_outcomes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calls` (
	`id` varchar(36) NOT NULL,
	`lead_id` varchar(36),
	`deal_id` varchar(36),
	`contact_id` varchar(36) NOT NULL,
	`outcome_id` varchar(36),
	`type` enum('call','whatsapp','email') NOT NULL DEFAULT 'call',
	`summary` text NOT NULL,
	`next_steps` text NOT NULL,
	`due_date_time` timestamp,
	`is_draft` boolean NOT NULL DEFAULT false,
	`status` varchar(50) NOT NULL DEFAULT 'completed',
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-11-16 12:05:28.521';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-11-16 12:05:28.521';--> statement-breakpoint
ALTER TABLE `calls` ADD CONSTRAINT `calls_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calls` ADD CONSTRAINT `calls_deal_id_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calls` ADD CONSTRAINT `calls_contact_id_contacts_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calls` ADD CONSTRAINT `calls_outcome_id_call_outcomes_id_fk` FOREIGN KEY (`outcome_id`) REFERENCES `call_outcomes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `calls` ADD CONSTRAINT `calls_created_by_user_id_fk` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `name_idx` ON `call_outcomes` (`name`);--> statement-breakpoint
CREATE INDEX `lead_idx` ON `calls` (`lead_id`);--> statement-breakpoint
CREATE INDEX `deal_idx` ON `calls` (`deal_id`);--> statement-breakpoint
CREATE INDEX `contact_idx` ON `calls` (`contact_id`);--> statement-breakpoint
CREATE INDEX `created_by_idx` ON `calls` (`created_by`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `calls` (`created_at`);