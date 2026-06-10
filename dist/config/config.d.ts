export type InputOptions = {
    env?: string;
    driver?: string;
    config?: string;
    host?: string;
    user?: string;
    password?: string;
    database?: string;
    dir?: string;
};
export type Config = {
    driver: string;
    dir: string;
    database: {
        host: string;
        user: string;
        password: string;
        database: string;
    };
};
/**
 * Loads config details
 * @returns {Promise<Config>}
 * @throws {Error}
 */
export declare function loadOptions(opts: InputOptions): Config;
//# sourceMappingURL=config.d.ts.map