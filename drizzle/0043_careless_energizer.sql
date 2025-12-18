ALTER TABLE `deal_stakeholders` MODIFY COLUMN `contact_frequency` enum('daily','every-two-days','weekly','fortnightly','monthly') DEFAULT 'weekly';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-21 15:54:54.974';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-10-21 15:54:54.974';