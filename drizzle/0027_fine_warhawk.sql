CREATE TABLE `document_items` (
	`id` varchar(36) NOT NULL,
	`document_type` enum('Quote','Invoice','Deal') NOT NULL,
	`document_id` varchar(36) NOT NULL,
	`description` text NOT NULL,
	`product_id` varchar(36),
	`quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
	`unit_price` decimal(10,2) NOT NULL,
	`discount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`tax` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `document_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` varchar(36) NOT NULL,
	`invoice_number` varchar(50) NOT NULL,
	`person_id` varchar(36),
	`deal_id` varchar(36),
	`quote_id` varchar(36),
	`client_id` varchar(36) NOT NULL,
	`client_name` varchar(255) NOT NULL,
	`client_email` varchar(255),
	`client_address` text,
	`invoice_status` enum('Draft','Sent','Paid','Overdue','Cancelled') NOT NULL DEFAULT 'Draft',
	`payment_status` enum('Unpaid','Partial','Paid') NOT NULL DEFAULT 'Unpaid',
	`subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
	`tax` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL DEFAULT '0.00',
	`amount_paid` decimal(10,2) NOT NULL DEFAULT '0.00',
	`due_date` timestamp,
	`paid_date` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoice_number_unique` UNIQUE(`invoice_number`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` varchar(36) NOT NULL,
	`quote_number` varchar(50) NOT NULL,
	`person_id` varchar(36),
	`deal_id` varchar(36),
	`client_id` varchar(36) NOT NULL,
	`client_name` varchar(255) NOT NULL,
	`client_email` varchar(255),
	`client_address` text,
	`quote_status` enum('Draft','Sent','Accepted','Rejected','Expired') NOT NULL DEFAULT 'Draft',
	`subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
	`tax` decimal(10,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL DEFAULT '0.00',
	`valid_until` timestamp,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotes_quote_number_unique` UNIQUE(`quote_number`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(36) NOT NULL,
	`productType` enum('product','service') NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(255),
	`price` decimal(10,2) NOT NULL DEFAULT '0',
	`discount` decimal(10,2) NOT NULL DEFAULT '0',
	`tax` decimal(10,2) NOT NULL DEFAULT '0',
	`unit` enum('piece','kilogram','gram','use','litre','hour','metre') NOT NULL,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-08 08:13:20.064';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-08 08:13:20.064';--> statement-breakpoint
ALTER TABLE `document_items` ADD CONSTRAINT `document_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_client_id_companies_id_fk` FOREIGN KEY (`client_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_client_id_companies_id_fk` FOREIGN KEY (`client_id`) REFERENCES `companies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `name_idx` ON `products` (`name`);