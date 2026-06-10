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
export declare function loadUpMigrationFiles(dirPath: string): Promise<string[]>;
/**
 * Loads all .down.sql files from migration folder
 * @param {string} dirPath
 * @returns {Promise<string[]>}
 */
export declare function loadDownMigrationFiles(dirPath: string): Promise<string[]>;
/**
 * Handles initializing migration table if it doesn't exist
 * @param {sql.ConnectionPool} pool
 * @returns {Promise<Map<string, Migration>>}
 */
export declare function loadMigrationTable(db: Database): Promise<Map<string, Migration>>;
//# sourceMappingURL=index.d.ts.map