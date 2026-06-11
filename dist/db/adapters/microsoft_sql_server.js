import sql from "mssql";
import { SqlValue } from "../sql_value.js";
export class SqlServerDatabase {
    pool;
    config;
    constructor(config) {
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
    async connect() {
        try {
            this.pool = await this.pool.connect();
            return this;
        }
        catch (err) {
            const errorPrefix = "connecting database";
            if (err instanceof Error) {
                throw Error(`${errorPrefix}: ${err.message}`);
            }
            else {
                throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
            }
        }
    }
    /**
     * Closes database connection
     * @returns {Promise<void>}
     */
    async close() {
        try {
            await this.pool.close();
        }
        catch { }
    }
    /**
     * Executes sql query
     * @param {string} sqlQuery
     * @param {SqlParam} params
     * @returns {Promise<SqlServerResult>}
     */
    async query(sqlQuery, params) {
        const request = new sql.Request(this.pool);
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                request.input(key, value);
            }
        }
        return new SqlServerResult(await request.query(sqlQuery));
    }
    transaction() {
        return new SqlServerTransaction(this.pool);
    }
    /**
     * Initializes migration table if not found
     */
    async initMigrationTable() {
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
     * Returns all migrations as map, with filename as the key
     * @returns {Promise<Map<string, Migration>>}
     */
    async loadMigrationTableMap() {
        try {
            const res = await this.query(`
				SELECT id, name, time_stamp
				FROM migrations
				ORDER BY time_stamp DESC, id DESC, name DESC;
			`);
            const map = new Map();
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
        }
        catch (err) {
            const errorPrefix = "loading migration table map";
            if (err instanceof Error) {
                throw Error(`${errorPrefix}: ${err.message}`);
            }
            else {
                throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
            }
        }
    }
    /**
     * Returns all migrations as an array
     * @returns {Promise<Migration[]>}
     */
    async loadMigrationTableArray() {
        try {
            const res = await this.query(`
				SELECT id, name, time_stamp
				FROM migrations
				ORDER BY time_stamp DESC, id DESC, name DESC;
			`);
            const array = [];
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
        }
        catch (err) {
            const errorPrefix = "loading migration table array";
            if (err instanceof Error) {
                throw Error(`${errorPrefix}: ${err.message}`);
            }
            else {
                throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
            }
        }
    }
}
export class SqlServerTransaction {
    transaction;
    constructor(pool) {
        this.transaction = new sql.Transaction(pool);
    }
    /**
     * Begin a transaction
     * @returns {Promise<this>}
     */
    async begin() {
        await this.transaction.begin();
        return this;
    }
    /**
     * Commit a transaction
     * @returns {Promise<this>}
     */
    async commit() {
        await this.transaction.commit();
    }
    /**
     * Rollback a transaction
     * @returns {Promise<this>}
     */
    async rollback() {
        try {
            await this.transaction.rollback();
        }
        catch { }
    }
    /**
     * Executes a query inside a transaction
     * Automatically rollback transaction on error
     * @returns {Promise<this>}
     */
    async query(sqlQuery, params) {
        try {
            const request = new sql.Request(this.transaction);
            if (params) {
                for (const [key, value] of Object.entries(params)) {
                    request.input(key, value);
                }
            }
            return new SqlServerResult(await request.query(sqlQuery));
        }
        catch (err) {
            this.rollback();
            throw err;
        }
    }
}
export class SqlServerRecord {
    raw;
    constructor(record) {
        this.raw = record;
    }
    get(key) {
        try {
            return new SqlValue(this.raw[key]);
        }
        catch {
            return undefined;
        }
    }
}
export class SqlServerResult {
    result;
    isOk;
    err;
    constructor(result) {
        if (result instanceof Error) {
            this.isOk = false;
            this.err = result;
        }
        else {
            this.isOk = true;
            this.result = result;
        }
    }
    ok() {
        return this.isOk;
    }
    error() {
        return this.err;
    }
    rows() {
        if (!this.result)
            throw Error("result was no ok");
        return this.result.recordset.map((v) => new SqlServerRecord(v));
    }
    length() {
        return this.rows().length;
    }
}
