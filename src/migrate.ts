import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import z from "zod";
import sql from "mssql";

const require = createRequire(import.meta.url);

export type Config = {
	driver: string;
	database: {
		host: string;
		user: string;
		password: string;
		database: string;
	};
};

/**
 * Schema for config cjs file
 */
const configSchema = z.object({
	driver: z.string().default("ms"),
	database: z.object({
		host: z.string(),
		user: z.string(),
		password: z.string(),
		database: z.string()
	})
});

/**
 * Schema for cli options for creating new migration file
 */
const optionsSchema = z.object({
	envFile: z.string().optional(),
	database: z.string().optional(),
	dir: z.string()
});

/**
 * Loads config details
 * @returns {Promise<Config>}
 * @throws {Error}
 */
async function loadConfig(): Promise<Config> {
	try {
		const filePath = path.resolve("migratekit.config.cjs");

		const config = require(filePath);

		// Validate config
		const parseRes = configSchema.safeParse(config);
		if (!parseRes.success) {
			throw Error(z.prettifyError(parseRes.error));
		}

		return parseRes.data;
	} catch (err: unknown) {
		const errorPrefix = "loading config";

		if (err instanceof Error) {
			throw Error(`${errorPrefix}: ${err.message}`);
		} else {
			throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
		}
	}
}

/**
 * Opens connection to database
 * @param {Config} config
 * @returns {Promise<sql.ConnectionPool>}
 * @throws {Error}
 */
async function connectDb(config: Config): Promise<sql.ConnectionPool> {
	try {
		switch (config.driver) {
			case "ms":
				return await new sql.ConnectionPool({
					user: config.database.user,
					password: config.database.password,
					database: config.database.database,
					server: config.database.host,
					pool: {
						max: 1,
						min: 0,
						idleTimeoutMillis: 30000
					},
					options: {
						encrypt: false,
						trustServerCertificate: true
					}
				}).connect();
			default:
				throw Error("driver not supported");
		}
	} catch (err: unknown) {
		const errorPrefix = "connecting database";

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
 */
async function initializeMigrationTable(pool: sql.ConnectionPool) {
	try {
		await pool.query(`
			IF OBJECT_ID('dbo.migrations', 'U') IS NULL
			BEGIN
				CREATE TABLE dbo.migrations (
					id INT IDENTITY(1,1) PRIMARY KEY,
					name VARCHAR(255) NOT NULL UNIQUE,
					time_stamp DATETIMEOFFSET(7) NOT NULL DEFAULT SYSDATETIMEOFFSET()
				);
			END
			`);
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
 * Loads all .sql files from migration folder
 * @param {string} dirPath
 * @returns {string[]}
 */
function loadMigrationFiles(dirPath: string): string[] {
	try {
		dirPath = path.resolve(dirPath);

		if (!fs.existsSync(dirPath)) {
			throw Error("migration folder not found");
		}

		return fs.readdirSync(dirPath).filter((file) => file.endsWith(".sql"));
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
 * Performs up migrations
 * @param {any} options
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function up(options: any): Promise<void> {
	// Validate options
	const parseRes = optionsSchema.safeParse(options);
	if (!parseRes.success) {
		throw Error(z.prettifyError(parseRes.error));
	}
	const opts = parseRes.data;

	// Load config
	const config = await loadConfig();

	// Open connection
	const pool = await connectDb(config);
	await initializeMigrationTable(pool);

	// Load migration files
	const files = loadMigrationFiles(opts.dir);

	try {
		// Start transaction
		const transaction = new sql.Transaction(pool);
		const t = await transaction.begin();

		/*

		// Migrations
		const request = new sql.Request(t);
		await request.query("");

		*/

		// Commit
		await t.commit();
	} catch (err: unknown) {
		const errorPrefix = "performing up migrations";

		if (err instanceof Error) {
			throw Error(`${errorPrefix}: ${err.message}`);
		} else {
			throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
		}
	} finally {
		try {
			await pool.close();
		} catch {}
	}
}
