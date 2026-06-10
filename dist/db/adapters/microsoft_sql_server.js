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
