CREATE TABLE `raffle_entries` (
	`id` varchar(36) NOT NULL,
	`raffle_id` varchar(36) NOT NULL,
	`lead_id` varchar(36) NOT NULL,
	`ticket_number` int NOT NULL,
	`entry_date` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `raffle_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `raffle_ticket_idx` UNIQUE(`raffle_id`,`ticket_number`)
);
--> statement-breakpoint
CREATE TABLE `raffles` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`location` varchar(255),
	`start_date` datetime NOT NULL,
	`end_date` datetime NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `raffles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-11-24 07:38:25.323';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-11-24 07:38:25.323';--> statement-breakpoint
ALTER TABLE `raffle_entries` ADD CONSTRAINT `raffle_entries_raffle_id_raffles_id_fk` FOREIGN KEY (`raffle_id`) REFERENCES `raffles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `raffle_entries` ADD CONSTRAINT `raffle_entries_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;