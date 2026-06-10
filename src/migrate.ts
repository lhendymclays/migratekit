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

export type Migration = {
	id: number;
	name: string;
	timeStamp: Date;
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
 * Schema for cli options for down migration
 */
const downOptionsSchema = z.object({
	envFile: z.string().optional(),
	database: z.string().optional(),
	dir: z.string(),
	num: z.coerce.number(),
	all: z.coerce.boolean()
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
 * @returns {Promise<Map<string, Migration>>}
 */
async function loadMigrationTable(
	pool: sql.ConnectionPool
): Promise<Map<string, Migration>> {
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

		const res = await pool.query(`
			SELECT id, name, time_stamp
			FROM dbo.migrations
			ORDER BY time_stamp DESC, id DESC, name DESC;
		`);

		const map: Map<string, Migration> = new Map();

		for (const row of res.recordset) {
			const id = row["id"];
			const name = row["name"];
			const timeStamp = row["time_stamp"];

			if (typeof id !== "number") {
				throw Error("id was not of type number");
			}
			if (typeof name !== "string") {
				throw Error("name was not of type string");
			}
			if (!(timeStamp instanceof Date)) {
				throw Error("time stamp was not of type Date");
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

/**
 * Loads all .up.sql files from migration folder
 * @param {string} dirPath
 * @returns {string[]}
 */
function loadUpMigrationFiles(dirPath: string): string[] {
	try {
		dirPath = path.resolve(dirPath);

		if (!fs.existsSync(dirPath)) {
			throw Error("migration folder not found");
		}

		return fs
			.readdirSync(dirPath)
			.filter((file) => file.endsWith(".up.sql"));
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
 * @returns {string[]}
 */
function loadDownMigrationFiles(dirPath: string): string[] {
	try {
		dirPath = path.resolve(dirPath);

		if (!fs.existsSync(dirPath)) {
			throw Error("migration folder not found");
		}

		return fs
			.readdirSync(dirPath)
			.filter((file) => file.endsWith(".down.sql"));
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

	try {
		const migrations = await loadMigrationTable(pool);

		// Load migration files
		const files = loadUpMigrationFiles(opts.dir);

		// Start transaction
		const transaction = new sql.Transaction(pool);
		const t = await transaction.begin();

		// Migrations
		for (const fileName of files) {
			if (migrations.has(fileName)) {
				console.log(`Skipping migration: ${fileName}`);
				continue;
			}

			const filePath = path.join(opts.dir, fileName);
			const file = fs.readFileSync(filePath, { encoding: "utf-8" });

			console.log(file);

			const migration = new sql.Request(t);
			await migration.query(file);

			const log = new sql.Request(t);
			log.input("name", fileName.replace(".up.sql", ""));
			await log.query(`
				INSERT INTO migrations
				(name)
				VALUES (@name)
			`);
		}

		// Commit
		await t.commit();

		console.log("All Migrations Complete !!");
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

/**
 * Performs down migrations
 * @param {any} options
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function down(options: any): Promise<void> {
	// Validate options
	const parseRes = downOptionsSchema.safeParse(options);
	if (!parseRes.success) {
		throw Error(z.prettifyError(parseRes.error));
	}
	const opts = parseRes.data;

	// Load config
	const config = await loadConfig();

	// Open connection
	const pool = await connectDb(config);

	const migrations = await loadMigrationTable(pool);
	const migrationArray = Array.from(migrations.values());

	// Start transaction
	const transaction = new sql.Transaction(pool);

	try {
		const t = await transaction.begin();

		// Migrations
		if (opts.all) {
			throw Error("all command not implemented");
		} else {
			for (let i = 0; i < opts.num; i++) {
				if (migrationArray.length === 0) {
					continue;
				}

				if (i >= migrationArray.length) {
					throw Error("exceeded migration length");
				}

				const migration = migrationArray[i];
				const fileName = migration.name + ".down.sql";

				const filePath = path.join(opts.dir, fileName);

				if (!fs.existsSync(filePath)) {
					throw Error("down migration file not found");
				}

				const file = fs.readFileSync(filePath, { encoding: "utf-8" });

				console.log(file);

				const downMigration = new sql.Request(t);
				await downMigration.query(file);

				const log = new sql.Request(t);
				log.input("name", fileName.replace(".down.sql", ""));
				await log.query(`
					DELETE FROM migrations
					WHERE name = @name
				`);
			}
		}

		// Commit
		await t.commit();

		console.log("All Migrations Complete !!");
	} catch (err: unknown) {
		await transaction.rollback().catch(() => {});

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
