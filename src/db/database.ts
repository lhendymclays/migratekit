import type { SqlParam } from "./sql_param.js";
import type { SqlValue } from "./sql_value.js";

export interface Database {
	connect(): Promise<this>;
	close(): Promise<void>;
	query(sql: string, params?: SqlParam): Promise<SqlResult>;
	transaction(): Transaction;
}

export interface Transaction {
	begin(): Promise<this>;
	commit(): Promise<void>;
	rollback(): Promise<void>;
	query(sql: string, params?: SqlParam): Promise<SqlResult>;
}

export interface SqlResult {
	ok(): boolean;
	error(): Error | undefined;
	rows(): SqlRecord[];
	length(): number;
}

export interface SqlRecord {
	get(key: string): SqlValue | undefined;
}
