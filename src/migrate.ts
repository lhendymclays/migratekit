import z from "zod";

/**
 * Schema for cli options for creating new migration file
 */
const optionsSchema = z.object({
	envFile: z.string().optional(),
	database: z.string().optional()
});

/**
 * Performs up migrations
 * @param {any} options
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function up(options: any): Promise<void> {
	try {
		// Validate options
		const res = optionsSchema.safeParse(options);
		if (!res.success) {
			throw Error(z.prettifyError(res.error));
		}
		const opts = res.data;
	} catch (err: unknown) {
		const errorPrefix = "performing up migrations";

		if (err instanceof Error) {
			throw Error(`${errorPrefix}: ${err.message}`);
		} else {
			throw Error(`${errorPrefix}: unknown error type: ${String(err)}`);
		}
	}
}
