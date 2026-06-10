import path from "node:path";
import { Command } from "commander";
import { createMigration } from "./create.js";
import { up, down } from "./migrate.js";

const program = new Command();

program
	.name("Node DB Migrate")
	.description("Node package to run microsoft database emigrations")
	.version("0.0.1");

program
	.command("create")
	.description("Create a new migration file")
	.argument("<name>", "Migration file Name")
	.option(
		"-d, --dir <path>",
		"Migration folder",
		path.join(process.cwd(), "migrations")
	)
	.action((name, options) => {
		createMigration(name, options);
	});

program
	.command("up")
	.description("Run all up migrations")
	.option("--envFile <env_file_name>", "Environment File")
	.option("--database <database_name>", "Database Name")
	.option("--dir <migration_folder>", "Migration Folder", "migrations")
	.action((options) => {
		up(options);
	});

program
	.command("down")
	.description("Run all down migrations")
	.option("--envFile <env_file_name>", "Environment File")
	.option("--database <database_name>", "Database Name")
	.option("--dir <migration_folder>", "Migration Folder", "migrations")
	.option("--num <number>", "Number Of down migrations", "1")
	.option("--all", "Run all down migrations", false)
	.action((options) => {
		down(options);
	});

program.parse();

process.on("uncaughtException", (err) => {
	console.error(err);
});
