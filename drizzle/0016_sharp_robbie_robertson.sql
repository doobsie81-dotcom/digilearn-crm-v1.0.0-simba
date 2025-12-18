ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-03 10:39:57.472';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `upated_at` datetime DEFAULT '2025-10-03 10:39:57.472';--> statement-breakpoint
ALTER TABLE `pipeline_stages` ADD `stage_probability` int unsigned NOT NULL;