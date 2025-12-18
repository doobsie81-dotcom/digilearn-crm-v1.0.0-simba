CREATE TABLE `payments` (
	`id` varchar(36) NOT NULL,
	`invoice_id` varchar(36) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`payment_date` timestamp NOT NULL DEFAULT (now()),
	`method` varchar(100),
	`reference` varchar(255),
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `role` varchar(255) NOT NULL DEFAULT 'sales-agent';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-12 21:18:53.326';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-12 21:18:53.326';--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_invoice_id_invoices_id_fk` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE cascade ON UPDATE no action;