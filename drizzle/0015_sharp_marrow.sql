CREATE TABLE `sla_violations` (
	`id` varchar(36) NOT NULL,
	`deal_id` varchar(36) NOT NULL,
	`stage_status` varchar(255) NOT NULL,
	`rule_violation_type` enum('sla_breach','deadline_approaching','task_overdue','approval_pending'),
	`escalation_severity` enum('low','medium','high','critical'),
	`description` text NOT NULL,
	`expected_by` timestamp NOT NULL,
	`actual_violation_time` timestamp NOT NULL,
	`hours_overdue` int NOT NULL,
	`escalated` boolean DEFAULT false,
	`escalated_to` text,
	`escalated_at` timestamp,
	`resolved` boolean DEFAULT false,
	`resolved_at` timestamp,
	`resolved_by` text,
	`resolution_notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sla_violations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-10-03 07:36:08.192';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `upated_at` datetime DEFAULT '2025-10-03 07:36:08.192';--> statement-breakpoint
ALTER TABLE `deals` ADD `current_stage_since` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `deals` ADD `assigned_to` varchar(36);--> statement-breakpoint
ALTER TABLE `deals` ADD `assigned_to_email` text;--> statement-breakpoint
ALTER TABLE `deals` ADD `manager_email` text;--> statement-breakpoint
ALTER TABLE `deal_stage_history` ADD `sla_compliant` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `deal_stage_history` ADD `time_in_stage` int;--> statement-breakpoint
ALTER TABLE `deal_stage_history` ADD `sla_deadline_was` timestamp;--> statement-breakpoint
ALTER TABLE `pipeline_stages` ADD `sla_hours` int;--> statement-breakpoint
ALTER TABLE `pipeline_stages` ADD `sla_days` int;--> statement-breakpoint
ALTER TABLE `pipeline_stages` ADD `requires_action` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pipeline_stages` ADD `action_description` text;--> statement-breakpoint
ALTER TABLE `pipeline_stages` ADD `escalation_target` text;--> statement-breakpoint
ALTER TABLE `pipeline_stages` ADD `escalation_message` text;--> statement-breakpoint
ALTER TABLE `pipeline_stages` ADD `auto_reminder_enabled` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `pipeline_stages` ADD `reminder_interval_hours` int;--> statement-breakpoint
ALTER TABLE `pipeline_stages` ADD `required_fields` json;--> statement-breakpoint
ALTER TABLE `pipeline_stages` ADD `prevent_progress_without` text;--> statement-breakpoint
ALTER TABLE `pipeline_stages` ADD `auto_reassign_on_violation` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `sla_violations` ADD CONSTRAINT `sla_violations_deal_id_deals_id_fk` FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deals` ADD CONSTRAINT `deals_assigned_to_user_id_fk` FOREIGN KEY (`assigned_to`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;