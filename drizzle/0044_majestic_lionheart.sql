ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-22 08:29:19.664';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-22 08:29:19.664';--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `unique_contact` UNIQUE(`first_name`,`last_name`,`company_id`);