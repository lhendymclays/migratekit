import path from "node:path";
import fs from "node:fs";
import z from "zod";
import { createDatabase } from "../db/factory.js";
import { loadOptions } from "../config/config.js";
import { loadDownMigrationFiles, loadMigrationTable, loadUpMigrationFiles } from "../migrations/index.js";
/**
 * Schema for cli options for down migration
 */
const upOptionsSchema = z.object({
    env: z.string().optional(),
    driver: z.string().optional(),
    config: z.string().optional(),
    host: z.string().optional(),
    user: z.string().optional(),
    password: z.string().optional(),
    database: z.string().optional(),
    dir: z.string()
});
/**
 * Schema for cli options for down migration
 */
const downOptionsSchema = z.object({
    env: z.string().optional(),
    driver: z.string().optional(),
    config: z.string().optional(),
    host: z.string().optional(),
    user: z.string().optional(),
    password: z.string().optional(),
    database: z.string().optional(),
    dir: z.string(),
    num: z.coerce.number(),
    all: z.coerce.boolean()
});
/**
 * Performs up migrations
 * @param {any} options
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function up(options) {
    // Validate options
    const parseRes = upOptionsSchema.safeParse(options);
    if (!parseRes.success) {
        throw Error(z.prettifyError(parseRes.error));
    }
    const inputOptions = parseRes.data;
    const config = loadOptions(inputOptions);
    const db = createDatabase(config);
    try {
        await db.connect();
        const tsx = db.transaction();
        const [migrations, files] = await Promise.all([
            loadMigrationTable(db),
            loadUpMigrationFiles(inputOptions.dir)
        ]);
        await tsx.begin();
        // Migrations
        for (const fileName of files) {
            if (migrations.has(fileName)) {
                console.log(`Skipping migration: ${fileName}`);
                continue;
            }
            const filePath = path.join(inputOptions.dir, fileName);
            const file = fs.readFileSync(filePath, { encoding: "utf-8" });
            console.log(file);
            await tsx.query(file);
            await tsx.query("INSERT INTO migrations (name) VALUES (@name)", {
                name: fileName.replace(".up.sql", "")
            });
        }
        await tsx.commit();
        console.log("All Migrations Complete !!");
    }
    catch (err) {
        const errorPrefix = "performing up migrations";
        if (err instanceof Error) {
            throw Error(`${errorPrefix}: ${err.message}`);
        }
        else {
            throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
        }
    }
    finally {
        await db.close();
    }
}
/**
 * Performs down migrations
 * @param {any} options
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function down(options) {
    // Validate options
    const parseRes = downOptionsSchema.safeParse(options);
    if (!parseRes.success) {
        throw Error(z.prettifyError(parseRes.error));
    }
    const inputOptions = parseRes.data;
    const config = await loadOptions(inputOptions);
    const db = createDatabase(config);
    try {
        await db.connect();
        const tsx = db.transaction();
        const [migrations, files] = await Promise.all([
            loadMigrationTable(db),
            loadDownMigrationFiles(inputOptions.dir)
        ]);
        const migrationArray = Array.from(migrations.values());
        await tsx.begin();
        // Migrations
        if (inputOptions.all) {
            throw Error("all command not implemented");
        }
        else {
            for (let i = 0; i < inputOptions.num; i++) {
                if (migrationArray.length === 0) {
                    continue;
                }
                if (i >= migrationArray.length) {
                    throw Error("exceeded migration length");
                }
                const migration = migrationArray[i];
                const fileName = migration.name + ".down.sql";
                const filePath = path.join(inputOptions.dir, fileName);
                if (!files.some((f) => f === fileName)) {
                    throw Error("down migration file not found");
                }
                const file = fs.readFileSync(filePath, { encoding: "utf-8" });
                console.log(file);
                await tsx.query(file);
                await tsx.query("DELETE FROM migrations WHERE name = @name", {
                    name: fileName.replace(".down.sql", "")
                });
            }
        }
        await tsx.commit();
        console.log("All Migrations Complete !!");
    }
    catch (err) {
        const errorPrefix = "performing up migrations";
        if (err instanceof Error) {
            throw Error(`${errorPrefix}: ${err.message}`);
        }
        else {
            throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
        }
    }
    finally {
        await db.close();
    }
}
