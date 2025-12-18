ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-11-09 20:47:41.428';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-11-09 20:47:41.428';--> statement-breakpoint
ALTER TABLE `invoices` ADD `owner_id` varchar(36);--> statement-breakpoint
ALTER TABLE `quotes` ADD `owner_id` varchar(36);--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_owner_id_user_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_owner_id_user_id_fk` FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;