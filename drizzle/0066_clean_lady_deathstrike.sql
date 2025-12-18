ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-11-24 16:34:40.513';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-11-24 16:34:40.513';--> statement-breakpoint
ALTER TABLE `companies` ADD `ownership_type` enum('Government','Council School','Mission / Church','Private Independent','Community / SDC','Other');--> statement-breakpoint
ALTER TABLE `companies` ADD `school_type` enum('Primary','Secondary','ECD Centre','College','Other');--> statement-breakpoint
ALTER TABLE `companies` ADD `district` varchar(100);