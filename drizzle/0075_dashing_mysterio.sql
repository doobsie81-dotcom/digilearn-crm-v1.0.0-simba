ALTER TABLE `invoices` DROP FOREIGN KEY `invoices_payment_term_id_payment_terms_id_fk`;
--> statement-breakpoint
ALTER TABLE `quotes` DROP FOREIGN KEY `quotes_payment_term_id_payment_terms_id_fk`;
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-12-01 06:08:19.021';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-12-01 06:08:19.021';