import sql from "mssql";
import type {
	Database,
	Transaction,
	SqlResult,
	SqlRecord
} from "../database.js";
import type { Config } from "../../config/config.js";
import { SqlValue } from "../sql_value.js";
import type { SqlParam } from "../sql_param.js";
import type { Migration } from "../../migrations/index.js";

export class SqlServerDatabase implements Database {
	pool: sql.ConnectionPool;
	config: Config;

	constructor(config: Config) {
		this.config = config;
		this.pool = new sql.ConnectionPool({
			user: this.config.database.user,
			password: this.config.database.password,
			database: this.config.database.database,
			server: this.config.database.host,
			pool: {
				max: 1,
				min: 0,
				idleTimeoutMillis: 30000
			},
			options: {
				encrypt: false,
				trustServerCertificate: true
			}
		});
	}

	/**
	 * Opens connection to database
	 * @returns {Promise<this>}
	 * @throws {Error}
	 */
	async connect(): Promise<this> {
		try {
			this.pool = await this.pool.connect();
			return this;
		} catch (err: unknown) {
			const errorPrefix = "connecting database";

			if (err instanceof Error) {
				throw Error(`${errorPrefix}: ${err.message}`);
			} else {
				throw Error(
					`${errorPrefix}: unknown error type: ${String(err)}`
				);
			}
		}
	}

	/**
	 * Closes database connection
	 * @returns {Promise<void>}
	 */
	async close(): Promise<void> {
		try {
			await this.pool.close();
		} catch {}
	}

	/**
	 * Executes sql query
	 * @param {string} sqlQuery
	 * @param {SqlParam} params
	 * @returns {Promise<SqlServerResult>}
	 */
	async query(sqlQuery: string, params?: SqlParam): Promise<SqlServerResult> {
		const request = new sql.Request(this.pool);

		if (params) {
			for (const [key, value] of Object.entries(params)) {
				request.input(key, value);
			}
		}

		return new SqlServerResult(await request.query(sqlQuery));
	}

	transaction(): Transaction {
		return new SqlServerTransaction(this.pool);
	}

	/**
	 * Initializes migration table if not found
	 */
	async initMigrationTable(): Promise<void> {
		try {
			await this.query(`
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
				throw Error(
					`${errorPrefix}: unknown error type: ${String(err)}`
				);
			}
		}
	}

	/**
	 * Returns all migrations as map, with filename as the key
	 * @returns {Promise<Map<string, Migration>>}
	 */
	async loadMigrationTableMap(): Promise<Map<string, Migration>> {
		try {
			const res = await this.query(`
				SELECT id, name, time_stamp
				FROM migrations
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
			const errorPrefix = "loading migration table map";

			if (err instanceof Error) {
				throw Error(`${errorPrefix}: ${err.message}`);
			} else {
				throw Error(
					`${errorPrefix}: unknown error type: ${String(err)}`
				);
			}
		}
	}

	/**
	 * Returns all migrations as an array
	 * @returns {Promise<Migration[]>}
	 */
	async loadMigrationTableArray(): Promise<Migration[]> {
		try {
			const res = await this.query(`
				SELECT id, name, time_stamp
				FROM migrations
				ORDER BY time_stamp DESC, id DESC, name DESC;
			`);

			const array: Migration[] = [];

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

				array.push({ id, name, timeStamp });
			}

			return array;
		} catch (err: unknown) {
			const errorPrefix = "loading migration table array";

			if (err instanceof Error) {
				throw Error(`${errorPrefix}: ${err.message}`);
			} else {
				throw Error(
					`${errorPrefix}: unknown error type: ${String(err)}`
				);
			}
		}
	}
}

export class SqlServerTransaction implements Transaction {
	private transaction: sql.Transaction;

	constructor(pool: sql.ConnectionPool) {
		this.transaction = new sql.Transaction(pool);
	}

	/**
	 * Begin a transaction
	 * @returns {Promise<this>}
	 */
	async begin(): Promise<this> {
		await this.transaction.begin();
		return this;
	}

	/**
	 * Commit a transaction
	 * @returns {Promise<this>}
	 */
	async commit(): Promise<void> {
		await this.transaction.commit();
	}

	/**
	 * Rollback a transaction
	 * @returns {Promise<this>}
	 */
	async rollback(): Promise<void> {
		try {
			await this.transaction.rollback();
		} catch {}
	}

	/**
	 * Executes a query inside a transaction
	 * Automatically rollback transaction on error
	 * @returns {Promise<this>}
	 */
	async query(sqlQuery: string, params?: SqlParam): Promise<SqlResult> {
		try {
			const request = new sql.Request(this.transaction);

			if (params) {
				for (const [key, value] of Object.entries(params)) {
					request.input(key, value);
				}
			}

			return new SqlServerResult(await request.query(sqlQuery));
		} catch (err: unknown) {
			this.rollback();
			throw err;
		}
	}
}

export class SqlServerRecord implements SqlRecord {
	raw: any;

	constructor(record: any) {
		this.raw = record;
	}

	get(key: string): SqlValue | undefined {
		try {
			return new SqlValue(this.raw[key]);
		} catch {
			return undefined;
		}
	}
}

export class SqlServerResult implements SqlResult {
	private result: sql.IResult<any> | undefined;
	private isOk: boolean;
	private err: Error | undefined;

	constructor(result: sql.IResult<any> | Error) {
		if (result instanceof Error) {
			this.isOk = false;
			this.err = result;
		} else {
			this.isOk = true;
			this.result = result;
		}
	}

	ok(): boolean {
		return this.isOk;
	}

	error(): Error | undefined {
		return this.err;
	}

	rows(): SqlServerRecord[] {
		if (!this.result) throw Error("result was no ok");
		return this.result.recordset.map((v) => new SqlServerRecord(v));
	}

	length(): number {
		return this.rows().length;
	}
}
