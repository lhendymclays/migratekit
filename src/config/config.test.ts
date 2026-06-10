import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	expect,
	suite,
	test
} from "vitest";
import os from "os";
import { mkdirSync, existsSync, rmSync, rmdirSync, writeFileSync } from "fs";
import path from "path";
import { loadOptions } from "./config";

const tmpDir = path.join(os.tmpdir(), "migratekit");

suite("Create migration file", function () {
	beforeEach(async function () {
		if (existsSync(tmpDir))
			rmSync(tmpDir, { recursive: true, force: true });
		if (!existsSync(tmpDir)) mkdirSync(tmpDir);
	});

	afterEach(async function () {
		if (existsSync(tmpDir))
			rmSync(tmpDir, { recursive: true, force: true });
	});

	test("load options from cli", async function () {
		const dir = "test_dir";
		const driver = "mssql";
		const host = "database_host";
		const user = "database_user";
		const password = "database_password";
		const database = "database_name";

		const options = loadOptions({
			dir,
			driver,
			host,
			user,
			password,
			database
		});

		expect(options.dir).toBe(dir);
		expect(options.driver).toBe(driver);
		expect(options.database.host).toBe(host);
		expect(options.database.user).toBe(user);
		expect(options.database.password).toBe(password);
		expect(options.database.database).toBe(database);
	});

	test("load options from env file", async function () {
		const dir = "test_dir";
		const driver = "mssql";
		const host = "database_host";
		const user = "database_user";
		const password = "database_password";
		const database = "database_name";

		let fileData = "";
		fileData += `MIGRATIONS_DIR: ${dir}\r\n`;
		fileData += `DB_DRIVER: ${driver}\r\n`;
		fileData += `DB_HOST: ${host}\r\n`;
		fileData += `DB_USER: ${user}\r\n`;
		fileData += `DB_PASSWORD: ${password}\r\n`;
		fileData += `DB_DATABASE: ${database}\r\n`;

		const filePath = path.join(tmpDir, ".env");
		writeFileSync(filePath, fileData);

		const options = loadOptions({ env: filePath });

		expect(options.dir).toBe(dir);
		expect(options.driver).toBe(driver);
		expect(options.database.host).toBe(host);
		expect(options.database.user).toBe(user);
		expect(options.database.password).toBe(password);
		expect(options.database.database).toBe(database);
	});

	test("load options from config file", async function () {
		const dir = "test_dir";
		const driver = "mssql";
		const host = "database_host";
		const user = "database_user";
		const password = "database_password";
		const database = "database_name";

		let fileData = "";
		fileData += "module.exports = {\r\n";
		fileData += `\tdriver: "${driver}",\r\n`;
		fileData += `\tdir: "${dir}",\r\n`;
		fileData += `\tdatabase: {\r\n`;
		fileData += `\t\thost: "${host}",\r\n`;
		fileData += `\t\tuser: "${user}",\r\n`;
		fileData += `\t\tpassword: "${password}",\r\n`;
		fileData += `\t\tdatabase: "${database}",\r\n`;
		fileData += "\t}\r\n";
		fileData += "};\r\n";

		const filePath = path.join(tmpDir, "migratekit.config.cjs");
		writeFileSync(filePath, fileData);

		const options = loadOptions({ config: filePath });

		expect(options.dir).toBe(dir);
		expect(options.driver).toBe(driver);
		expect(options.database.host).toBe(host);
		expect(options.database.user).toBe(user);
		expect(options.database.password).toBe(password);
		expect(options.database.database).toBe(database);
	});
});
