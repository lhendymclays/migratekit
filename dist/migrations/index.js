import path from "node:path";
import fs from "node:fs/promises";
/**
 * Loads all .up.sql files from migration folder
 * @param {string} dirPath
 * @returns {Promise<string[]>}
 */
export async function loadUpMigrationFiles(dirPath) {
    try {
        dirPath = path.resolve(dirPath);
        await fs.access(dirPath);
        const files = await fs.readdir(dirPath);
        return files.filter((file) => file.endsWith(".up.sql"));
    }
    catch (err) {
        const errorPrefix = "initializing migration table";
        if (err instanceof Error) {
            throw Error(`${errorPrefix}: ${err.message}`);
        }
        else {
            throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
        }
    }
}
/**
 * Loads all .down.sql files from migration folder
 * @param {string} dirPath
 * @returns {Promise<string[]>}
 */
export async function loadDownMigrationFiles(dirPath) {
    try {
        dirPath = path.resolve(dirPath);
        await fs.access(dirPath);
        const files = await fs.readdir(dirPath);
        return files.filter((file) => file.endsWith(".down.sql"));
    }
    catch (err) {
        const errorPrefix = "initializing migration table";
        if (err instanceof Error) {
            throw Error(`${errorPrefix}: ${err.message}`);
        }
        else {
            throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
        }
    }
}
