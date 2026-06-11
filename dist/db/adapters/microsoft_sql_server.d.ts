import sql from "mssql";
import type { Database, Transaction, SqlResult, SqlRecord } from "../database.js";
import type { Config } from "../../config/config.js";
import { SqlValue } from "../sql_value.js";
import type { SqlParam } from "../sql_param.js";
import type { Migration } from "../../migrations/index.js";
export declare class SqlServerDatabase implements Database {
    pool: sql.ConnectionPool;
    config: Config;
    constructor(config: Config);
    /**
     * Opens connection to database
     * @returns {Promise<this>}
     * @throws {Error}
     */
    connect(): Promise<this>;
    /**
     * Closes database connection
     * @returns {Promise<void>}
     */
    close(): Promise<void>;
    /**
     * Executes sql query
     * @param {string} sqlQuery
     * @param {SqlParam} params
     * @returns {Promise<SqlServerResult>}
     */
    query(sqlQuery: string, params?: SqlParam): Promise<SqlServerResult>;
    transaction(): Transaction;
    /**
     * Initializes migration table if not found
     */
    initMigrationTable(): Promise<void>;
    /**
     * Returns all migrations as map, with filename as the key
     * @returns {Promise<Map<string, Migration>>}
     */
    loadMigrationTableMap(): Promise<Map<string, Migration>>;
    /**
     * Returns all migrations as an array
     * @returns {Promise<Migration[]>}
     */
    loadMigrationTableArray(): Promise<Migration[]>;
}
export declare class SqlServerTransaction implements Transaction {
    private transaction;
    constructor(pool: sql.ConnectionPool);
    /**
     * Begin a transaction
     * @returns {Promise<this>}
     */
    begin(): Promise<this>;
    /**
     * Commit a transaction
     * @returns {Promise<this>}
     */
    commit(): Promise<void>;
    /**
     * Rollback a transaction
     * @returns {Promise<this>}
     */
    rollback(): Promise<void>;
    /**
     * Executes a query inside a transaction
     * Automatically rollback transaction on error
     * @returns {Promise<this>}
     */
    query(sqlQuery: string, params?: SqlParam): Promise<SqlResult>;
}
export declare class SqlServerRecord implements SqlRecord {
    raw: any;
    constructor(record: any);
    get(key: string): SqlValue | undefined;
}
export declare class SqlServerResult implements SqlResult {
    private result;
    private isOk;
    private err;
    constructor(result: sql.IResult<any> | Error);
    ok(): boolean;
    error(): Error | undefined;
    rows(): SqlServerRecord[];
    length(): number;
}
//# sourceMappingURL=microsoft_sql_server.d.ts.map