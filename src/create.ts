import fs from "node:fs";
import path from "node:path";
import z from "zod";

/**
 * Schema for cli options for creating new migration file
 */
const optionsSchema = z.object({
	dir: z.string()
});

/**
 * Returns formatted timestamp
 * @returns {string}
 */
function timestamp(): number {
	return new Date().getTime();
}

/**
 * Create up and down migration files
 * @param {any} name
 * @param {any} options
 * @returns {string}
 * @throws {Error}
 */
export function createMigration(name: any, options: any): string {
	try {
		// Validate name
		if (typeof name !== "string") {
			throw Error("migration name was not of type string");
		}

		// Validate options
		const res = optionsSchema.safeParse(options);
		if (!res.success) {
			throw Error(z.prettifyError(res.error));
		}
		const opts = res.data;

		const dir = opts.dir.replace(/'|"/g, "").trim();
		const baseName = `${timestamp()}_${name.replace(/\s+/g, "_").trim()}`;

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}

		const upPath = path.join(dir, `${baseName}.up.sql`);
		const downPath = path.join(dir, `${baseName}.down.sql`);

		fs.writeFileSync(
			upPath,
			`-- ${baseName} UP\n\n-- write your SQL here\n`
		);

		fs.writeFileSync(
			downPath,
			`-- ${baseName} DOWN\n\n-- rollback SQL here\n`
		);

		console.log(`Created migration: ${baseName}`);

		return baseName;
	} catch (err: unknown) {
		const errorPrefix = "creating migration file";

		if (err instanceof Error) {
			throw Error(`${errorPrefix}: ${err.message}`);
		} else {
			throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
		}
	}
}
