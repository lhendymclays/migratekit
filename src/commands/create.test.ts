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
import { mkdirSync, existsSync, rmSync, rmdirSync } from "fs";
import path from "path";
import { createMigration } from "./create";

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

	test("pass", async function () {
		const fileName = createMigration("test_migration", { dir: tmpDir });

		expect(existsSync(path.join(tmpDir, fileName + ".up.sql"))).toBe(true);
		expect(existsSync(path.join(tmpDir, fileName + ".down.sql"))).toBe(
			true
		);
	});

	test("replace empty spaces", async function () {
		const fileName = createMigration("test migration", { dir: tmpDir });

		expect(existsSync(path.join(tmpDir, fileName + ".up.sql"))).toBe(true);
		expect(existsSync(path.join(tmpDir, fileName + ".down.sql"))).toBe(
			true
		);
	});
});
