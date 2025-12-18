CREATE TABLE `event_attendees` (
	`id` varchar(36) NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`is_organizer` boolean NOT NULL DEFAULT false,
	`response_status` varchar(50) DEFAULT 'pending',
	CONSTRAINT `event_attendees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
	`google_calendar_ref` varchar(255),
	`created_by` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone_number` varchar(13),
	`email` varchar(255),
	`position` varchar(255),
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_contacts` (
	`id` varchar(36) NOT NULL,
	`lead_id` varchar(36) NOT NULL,
	`contact_id` varchar(36) NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT false,
	CONSTRAINT `lead_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` varchar(255) NOT NULL,
	`source` enum('form','call','referral') NOT NULL,
	`primary_email` varchar(255) NOT NULL,
	`email_verified` boolean DEFAULT false,
	`primary_phone_number` varchar(255) NOT NULL,
	`phoneNumber_verified` boolean DEFAULT false,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `leads_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `event_attendees` ADD CONSTRAINT `event_attendees_event_id_events_id_fk` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_attendees` ADD CONSTRAINT `event_attendees_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_created_by_user_id_fk` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_contacts` ADD CONSTRAINT `lead_contacts_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_contacts` ADD CONSTRAINT `lead_contacts_contact_id_contacts_id_fk` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;