import { SqlServerDatabase } from "./adapters/microsoft_sql_server.js";
/**
 * Database adapter factory
 * @param {Config} config
 * @returns {Database}
 */
export function createDatabase(config) {
    switch (config.driver) {
        case "mssql":
            return new SqlServerDatabase(config);
        default:
            throw new Error(`Unsupported DB driver: ${config.driver}`);
    }
}
