ALTER TABLE `lead_qualification_criteria` MODIFY COLUMN `timeline_type` enum('this-term','next-term','specific-date','ready-to-proceed','sdc-meets-end-of-this-term','sdc-meets-next-term','need-more-information','budget-approval-pending');--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `created_at` datetime DEFAULT '2025-11-25 06:50:13.550';--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `updated_at` datetime DEFAULT '2025-11-25 06:50:13.550';--> statement-breakpoint
ALTER TABLE `companies` ADD `church_denomination` enum('Roman Catholic','Anglican','Seventh-Day Adventis');