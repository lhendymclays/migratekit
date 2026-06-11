#!/usr/bin/env node
import path from "node:path";
import { Command } from "commander";
import { createMigration } from "./commands/create.js";
import { up, down } from "./commands/migrate.js";
const program = new Command();
program
    .name("Node DB Migrate")
    .description("Node package to run microsoft database emigrations")
    .version("0.0.1");
program
    .command("create")
    .description("Create a new migration file")
    .argument("<name>", "Migration file Name")
    .option("-d, --dir <path>", "Migration folder", path.join(process.cwd(), "migrations"))
    .action((name, options) => {
    const migrationName = createMigration(name, options);
    console.log(`Created migration: ${migrationName}`);
});
program
    .command("up")
    .description("Run all up migrations")
    .option("--env <env_file_name>", "Environment File")
    .option("--config <config_file_name>", "Config File")
    .option("--driver <database_driver>", "Database Driver")
    .option("--host <database_host>", "Database Host")
    .option("--user <database_user>", "Database User")
    .option("--password <database_password>", "Database Password")
    .option("--database <database_name>", "Database Name")
    .option("--dir <migration_folder>", "Migration Folder", "migrations")
    .action((options) => {
    up(options);
});
program
    .command("down")
    .description("Run all down migrations")
    .option("--env <env_file_name>", "Environment File")
    .option("--config <config_file_name>", "Config File")
    .option("--driver <database_driver>", "Database Driver")
    .option("--host <database_host>", "Database Host")
    .option("--user <database_user>", "Database User")
    .option("--password <database_password>", "Database Password")
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
