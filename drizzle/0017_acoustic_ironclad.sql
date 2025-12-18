ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-03 14:16:52.983';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `upated_at` datetime DEFAULT '2025-10-03 14:16:52.983';--> statement-breakpoint
ALTER TABLE `deals` ADD `current_stage_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD CONSTRAINT `deals_current_stage_id_pipeline_stages_id_fk` FOREIGN KEY (`current_stage_id`) REFERENCES `pipeline_stages`(`id`) ON DELETE cascade ON UPDATE no action;