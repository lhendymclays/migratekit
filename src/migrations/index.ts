import path from "node:path";
import fs from "node:fs/promises";
import type { Database } from "../db/database.js";

export type Migration = {
	id: number;
	name: string;
	timeStamp: Date;
};

/**
 * Loads all .up.sql files from migration folder
 * @param {string} dirPath
 * @returns {Promise<string[]>}
 */
export async function loadUpMigrationFiles(dirPath: string): Promise<string[]> {
	try {
		dirPath = path.resolve(dirPath);

		await fs.access(dirPath);

		const files = await fs.readdir(dirPath);

		return files.filter((file) => file.endsWith(".up.sql"));
	} catch (err: unknown) {
		const errorPrefix = "initializing migration table";

		if (err instanceof Error) {
			throw Error(`${errorPrefix}: ${err.message}`);
		} else {
			throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
		}
	}
}

/**
 * Loads all .down.sql files from migration folder
 * @param {string} dirPath
 * @returns {Promise<string[]>}
 */
export async function loadDownMigrationFiles(
	dirPath: string
): Promise<string[]> {
	try {
		dirPath = path.resolve(dirPath);

		await fs.access(dirPath);

		const files = await fs.readdir(dirPath);

		return files.filter((file) => file.endsWith(".down.sql"));
	} catch (err: unknown) {
		const errorPrefix = "initializing migration table";

		if (err instanceof Error) {
			throw Error(`${errorPrefix}: ${err.message}`);
		} else {
			throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
		}
	}
}

/**
 * Handles initializing migration table if it doesn't exist
 * @param {sql.ConnectionPool} pool
 * @returns {Promise<Map<string, Migration>>}
 */
export async function loadMigrationTable(
	db: Database
): Promise<Map<string, Migration>> {
	try {
		await db.query(`
			IF OBJECT_ID('dbo.migrations', 'U') IS NULL
			BEGIN
				CREATE TABLE dbo.migrations (
					id INT IDENTITY(1,1) PRIMARY KEY,
					name VARCHAR(255) NOT NULL UNIQUE,
					time_stamp DATETIMEOFFSET(7) NOT NULL DEFAULT SYSDATETIMEOFFSET()
				);
			END
		`);

		const res = await db.query(`
			SELECT id, name, time_stamp
			FROM dbo.migrations
			ORDER BY time_stamp DESC, id DESC, name DESC;
		`);

		const map: Map<string, Migration> = new Map();

		for (const row of res.rows()) {
			const id = row.get("id")?.toNumber();
			const name = row.get("name")?.toString();
			const timeStamp = row.get("time_stamp")?.toDate();

			if (id === undefined) {
				throw Error("id was not found");
			}
			if (name === undefined) {
				throw Error("name was not found");
			}
			if (timeStamp === undefined) {
				throw Error("time stamp was not found");
			}

			map.set(name, { id, name, timeStamp });
		}

		return map;
	} catch (err: unknown) {
		const errorPrefix = "initializing migration table";

		if (err instanceof Error) {
			throw Error(`${errorPrefix}: ${err.message}`);
		} else {
			throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
		}
	}
}
