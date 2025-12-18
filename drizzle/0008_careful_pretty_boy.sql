CREATE TABLE `deals` (
	`id` varchar(36) NOT NULL,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-02 07:01:01.482';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `upated_at` datetime DEFAULT '2025-10-02 07:01:01.482';--> statement-breakpoint
ALTER TABLE `leads` ADD `agent_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_agent_id_user_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;