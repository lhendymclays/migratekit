import { SqlServerDatabase } from "./adapters/microsoft_sql_server.js";
import type { Config } from "../config/config.js";
import type { Database } from "./database.js";

/**
 * Database adapter factory
 * @param {Config} config
 * @returns {Database}
 */
export function createDatabase(config: Config): Database {
	switch (config.driver) {
		case "mssql":
			return new SqlServerDatabase(config);
		default:
			throw new Error(`Unsupported DB driver: ${config.driver}`);
	}
}
