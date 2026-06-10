export type Uuid = `${string}-${string}-${string}-${string}-${string}`;
export type SqlValueType = string | number | bigint | boolean | Date | Uuid | null;
export declare class SqlValue {
    value: SqlValueType;
    constructor(value: SqlValueType);
    get typeof(): string;
    get raw(): SqlValueType;
    /**
     * Helper function toe check if value is null
     * @returns {boolean}
     */
    isNull(): boolean;
    /**
     * Helper function toe check if value is a date
     * @returns {boolean}
     */
    isString(): boolean;
    /**
     * Helper function toe check if value is a valid uuid
     * @returns {boolean}
     */
    isUuid(): boolean;
    /**
     * Helper function toe check if value is a number
     * @returns {boolean}
     */
    isBoolean(): boolean;
    /**
     * Helper function toe check if value is a number
     * @returns {boolean}
     */
    isNumber(): boolean;
    /**
     * Helper function toe check if value is a date
     * @returns {boolean}
     */
    isDate(): boolean;
    /**
     * Returns string representation of SQL value.
     * @returns {string}
     */
    toString(): string;
    /**
     * Returns number representation of sql value
     * @returns {number}
     */
    toNumber(): number;
    /**
     * Returns boolean representation of sql value
     * @param {boolean} def - Default value if value is null
     * @returns {boolean}
     */
    toBoolean(def?: boolean): boolean;
    /**
     * Returns Date representation of SQL value.
     * @returns {Date}
     */
    toDate(): Date;
}
//# sourceMappingURL=sql_value.d.ts.map