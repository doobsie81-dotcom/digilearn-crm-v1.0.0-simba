ALTER TABLE `account` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `updated_at` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `settings` MODIFY COLUMN `id` varchar(36) NOT NULL;--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `expires_at_idx` ON `session` (`expires_at`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `verification_expires_at_idx` ON `verification` (`expires_at`);