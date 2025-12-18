CREATE TABLE `task_comments` (
	`id` varchar(36) NOT NULL,
	`taskId` varchar(36),
	`comment` text NOT NULL,
	`commented_by` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `task_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-18 13:55:09.912';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-18 13:55:09.912';--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `reference_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `assigned_to` varchar(36);--> statement-breakpoint
ALTER TABLE `tasks` ADD `position` int NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `due_date` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `task_comments` ADD CONSTRAINT `task_comments_taskId_tasks_id_fk` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `task_comments` ADD CONSTRAINT `task_comments_commented_by_user_id_fk` FOREIGN KEY (`commented_by`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;