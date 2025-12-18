RENAME TABLE `lead_contacts` TO `pipelines`;--> statement-breakpoint
ALTER TABLE `pipelines` DROP FOREIGN KEY `lead_contacts_lead_id_leads_id_fk`;
--> statement-breakpoint
ALTER TABLE `pipelines` DROP FOREIGN KEY `lead_contacts_contact_id_contacts_id_fk`;
--> statement-breakpoint
ALTER TABLE `pipelines` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-02 14:02:34.896';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `upated_at` datetime DEFAULT '2025-10-02 14:02:34.896';--> statement-breakpoint
ALTER TABLE `pipelines` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `contacts` ADD `lead_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `is_primary` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pipelines` DROP COLUMN `lead_id`;--> statement-breakpoint
ALTER TABLE `pipelines` DROP COLUMN `contact_id`;--> statement-breakpoint
ALTER TABLE `pipelines` DROP COLUMN `is_primary`;