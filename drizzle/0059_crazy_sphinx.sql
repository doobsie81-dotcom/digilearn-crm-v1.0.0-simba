CREATE TABLE `deal_tags` (
	`deal_id` varchar(36) NOT NULL,
	`tag_id` varchar(36) NOT NULL,
	`added_at` timestamp NOT NULL DEFAULT (now()),
	`added_by` varchar(36) NOT NULL,
	CONSTRAINT `deal_tags_deal_id_tag_id_pk` PRIMARY KEY(`deal_id`,`tag_id`)
);
--> statement-breakpoint
CREATE TABLE `lead_tags` (
	`lead_id` varchar(36) NOT NULL,
	`tag_id` varchar(36) NOT NULL,
	`added_at` timestamp NOT NULL DEFAULT (now()),
	`added_by` varchar(36) NOT NULL,
	CONSTRAINT `lead_tags_lead_id_tag_id_pk` PRIMARY KEY(`lead_id`,`tag_id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(7) NOT NULL,
	`description` text,
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `owner_id` varchar(36);--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-11-16 11:24:54.788';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-11-16 11:24:54.788';--> statement-breakpoint
ALTER TABLE `deal_tags` ADD CONSTRAINT `deal_tags_deal_id_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deal_tags` ADD CONSTRAINT `deal_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deal_tags` ADD CONSTRAINT `deal_tags_added_by_user_id_fk` FOREIGN KEY (`added_by`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_tags` ADD CONSTRAINT `lead_tags_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_tags` ADD CONSTRAINT `lead_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_tags` ADD CONSTRAINT `lead_tags_added_by_user_id_fk` FOREIGN KEY (`added_by`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `tags_created_by_user_id_fk` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `deal_idx` ON `deal_tags` (`deal_id`);--> statement-breakpoint
CREATE INDEX `tag_idx` ON `deal_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `lead_idx` ON `lead_tags` (`lead_id`);--> statement-breakpoint
CREATE INDEX `tag_idx` ON `lead_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `tags` (`name`);--> statement-breakpoint
CREATE INDEX `created_by_idx` ON `tags` (`created_by`);