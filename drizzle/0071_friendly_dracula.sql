CREATE TABLE `applied_payment_terms` (
	`id` varchar(36) NOT NULL,
	`document_id` varchar(36) NOT NULL,
	`document_type` enum('Invoice','Quote') NOT NULL,
	`payment_term_id` varchar(36),
	`term_name` varchar(100) NOT NULL,
	`term_type` enum('cash','3-term','4-term','6-term','9-term','custom-date','net-30','net-60','net-90') NOT NULL,
	`interest_rate` decimal(5,2) NOT NULL,
	`interest_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`number_of_terms` int,
	`term_length_days` int,
	`days_until_due` int,
	`due_date` timestamp,
	`terms_and_conditions` text,
	`calculation_breakdown` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `applied_payment_terms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_terms` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`code` varchar(50) NOT NULL,
	`type` enum('cash','3-term','4-term','6-term','9-term','custom-date','net-30','net-60','net-90') NOT NULL,
	`interest_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`number_of_terms` int,
	`term_length_days` int,
	`days_until_due` int,
	`terms_and_conditions` text,
	`description` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`is_default` boolean NOT NULL DEFAULT false,
	`display_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_terms_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_terms_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-11-30 15:30:23.519';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-11-30 15:30:23.519';--> statement-breakpoint
ALTER TABLE `invoices` ADD `interest` decimal(10,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `payment_term_id` varchar(36);--> statement-breakpoint
ALTER TABLE `quotes` ADD `interest` decimal(10,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `payment_term_id` varchar(36);--> statement-breakpoint
ALTER TABLE `applied_payment_terms` ADD CONSTRAINT `applied_payment_terms_payment_term_id_payment_terms_id_fk` FOREIGN KEY (`payment_term_id`) REFERENCES `payment_terms`(`id`) ON DELETE set null ON UPDATE no action;