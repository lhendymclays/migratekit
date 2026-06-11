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
//# sourceMappingURL=index.d.ts.map