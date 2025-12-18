CREATE TABLE `settings` (
	`id` varchar(36) NOT NULL DEFAULT '89f29af5-71e9-46cb-85e9-d6db83ef2868',
	`key` varchar(255) NOT NULL,
	`value` varchar(255) NOT NULL,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
