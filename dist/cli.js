import path from "node:path";
import { Command } from "commander";
import { createMigration } from "./create.js";
import { up } from "./migrate.js";
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
    createMigration(name, options);
});
program
    .command("up")
    .description("Run up all migrations")
    .option("--envFile <env_file_name>", "Environment File")
    .option("--database <database_name>", "Database Name")
    .action((options) => {
    up(options);
});
program.parse();
