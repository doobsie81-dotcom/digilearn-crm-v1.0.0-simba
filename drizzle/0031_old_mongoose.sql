ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-13 09:18:49.199';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-13 09:18:49.199';--> statement-breakpoint
ALTER TABLE `deal_stakeholders` ADD `contact_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `deal_stakeholders` ADD CONSTRAINT `deal_stakeholders_contact_id_contacts_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deal_stakeholders` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `deal_stakeholders` DROP COLUMN `title`;--> statement-breakpoint
ALTER TABLE `deal_stakeholders` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `deal_stakeholders` DROP COLUMN `phone`;