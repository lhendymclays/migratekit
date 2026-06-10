import { createRequire } from "node:module";
import path from "node:path";
import z from "zod";

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
 * Loads config details
 * @returns {Promise<Config>}
 * @throws {Error}
 */
export async function loadConfig(): Promise<Config> {
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
