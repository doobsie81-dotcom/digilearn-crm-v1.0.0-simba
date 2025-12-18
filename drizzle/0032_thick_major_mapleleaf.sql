CREATE TABLE `tasks` (
	`id` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('todo','in-progress','done','backlog') NOT NULL DEFAULT 'todo',
	`reference_type` enum('lead','deal') NOT NULL,
	`reference_id` varchar(255) NOT NULL,
	`assigned_to` varchar(255),
	`created_by` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-18 08:49:39.479';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-18 08:49:39.479';--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assigned_to_user_id_fk` FOREIGN KEY (`assigned_to`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_created_by_user_id_fk` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `reference_idx` ON `tasks` (`reference_type`,`reference_id`);--> statement-breakpoint
CREATE INDEX `assigned_to_idx` ON `tasks` (`assigned_to`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `tasks` (`status`);