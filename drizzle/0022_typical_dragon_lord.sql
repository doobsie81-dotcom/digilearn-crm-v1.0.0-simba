CREATE TABLE `companies` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`website` varchar(255),
	`industry` varchar(100),
	`employee_count` int,
	`annual_revenue` decimal(15,2),
	`address_line1` varchar(255),
	`address_line2` varchar(255),
	`city` varchar(100),
	`state` varchar(100),
	`postal_code` varchar(20),
	`country` varchar(100),
	`description` text,
	`owner_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_activities` (
	`id` varchar(36) NOT NULL,
	`lead_id` varchar(36) NOT NULL,
	`contact_id` varchar(36),
	`type` enum('call','email','meeting','note','task','sms') NOT NULL,
	`status` enum('scheduled','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`subject` varchar(255) NOT NULL,
	`description` text,
	`scheduled_at` timestamp,
	`completed_at` timestamp,
	`duration` int,
	`created_by` varchar(36) NOT NULL,
	`assigned_to` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_contacts` (
	`lead_id` varchar(36) NOT NULL,
	`contact_id` varchar(36) NOT NULL,
	`role` enum('primary','decision_maker','influencer','technical','financial','end_user','other') NOT NULL,
	`is_primary` boolean DEFAULT false,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_contacts_lead_id_contact_id_pk` PRIMARY KEY(`lead_id`,`contact_id`)
);
--> statement-breakpoint
CREATE TABLE `lead_qualification_criteria` (
	`id` varchar(36) NOT NULL,
	`lead_id` varchar(36) NOT NULL,
	`budget` int,
	`authority` int,
	`need` int,
	`timeline` int,
	`notes` text,
	`qualified_by` varchar(36),
	`qualified_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_qualification_criteria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` DROP INDEX `leads_name_unique`;--> statement-breakpoint
ALTER TABLE `contacts` DROP FOREIGN KEY `contacts_lead_id_leads_id_fk`;
--> statement-breakpoint
ALTER TABLE `leads` DROP FOREIGN KEY `leads_agent_id_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `contacts` MODIFY COLUMN `phone_number` varchar(50);--> statement-breakpoint
ALTER TABLE `contacts` MODIFY COLUMN `email` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `source` enum('website','referral','cold_call','social_media','event','partner','other') NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `status` enum('new','contacted','qualified','unqualified','converted') NOT NULL DEFAULT 'new';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-07 05:28:52.610';--> statement-breakpoint
ALTER TABLE `deals` ADD `company_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `company_id` varchar(36);--> statement-breakpoint
ALTER TABLE `contacts` ADD `first_name` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `last_name` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `mobile_phone` varchar(50);--> statement-breakpoint
ALTER TABLE `contacts` ADD `job_title` varchar(100);--> statement-breakpoint
ALTER TABLE `contacts` ADD `department` varchar(100);--> statement-breakpoint
ALTER TABLE `contacts` ADD `linkedin_url` varchar(255);--> statement-breakpoint
ALTER TABLE `contacts` ADD `twitter_handle` varchar(100);--> statement-breakpoint
ALTER TABLE `contacts` ADD `preferred_contact_method` enum('email','phone','sms','linkedin');--> statement-breakpoint
ALTER TABLE `contacts` ADD `do_not_call` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `contacts` ADD `do_not_email` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `contacts` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `contacts` ADD `owner_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `leads` ADD `company_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `primary_contact_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `estimated_value` decimal(12,2);--> statement-breakpoint
ALTER TABLE `leads` ADD `qualification_score` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `leads` ADD `owner_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `updated_at` datetime DEFAULT '2025-10-07 05:28:52.610';--> statement-breakpoint
ALTER TABLE `leads` ADD `last_contacted_at` timestamp;--> statement-breakpoint
ALTER TABLE `leads` ADD `converted_at` timestamp;--> statement-breakpoint
ALTER TABLE `leads` ADD `deleted_at` timestamp;--> statement-breakpoint
ALTER TABLE `lead_contacts` ADD CONSTRAINT `lead_contacts_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_contacts` ADD CONSTRAINT `lead_contacts_contact_id_contacts_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `name_idx` ON `companies` (`name`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `companies` (`owner_id`);--> statement-breakpoint
CREATE INDEX `lead_idx` ON `lead_activities` (`lead_id`);--> statement-breakpoint
CREATE INDEX `contact_idx` ON `lead_activities` (`contact_id`);--> statement-breakpoint
CREATE INDEX `created_by_idx` ON `lead_activities` (`created_by`);--> statement-breakpoint
CREATE INDEX `scheduled_at_idx` ON `lead_activities` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `lead_activities` (`status`);--> statement-breakpoint
CREATE INDEX `lead_idx` ON `lead_contacts` (`lead_id`);--> statement-breakpoint
CREATE INDEX `contact_idx` ON `lead_contacts` (`contact_id`);--> statement-breakpoint
CREATE INDEX `lead_idx` ON `lead_qualification_criteria` (`lead_id`);--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_primary_contact_id_contacts_id_fk` FOREIGN KEY (`primary_contact_id`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `email_idx` ON `contacts` (`email`);--> statement-breakpoint
CREATE INDEX `company_idx` ON `contacts` (`company_id`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `contacts` (`owner_id`);--> statement-breakpoint
CREATE INDEX `company_idx` ON `leads` (`company_id`);--> statement-breakpoint
CREATE INDEX `primary_contact_idx` ON `leads` (`primary_contact_id`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `leads` (`owner_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `leads` (`created_at`);--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `position`;--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `lead_id`;--> statement-breakpoint
ALTER TABLE `contacts` DROP COLUMN `is_primary`;--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `address`;--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `primary_email`;--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `primary_phone_number`;--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `agent_id`;--> statement-breakpoint
ALTER TABLE `leads` DROP COLUMN `upated_at`;