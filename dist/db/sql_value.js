import z from "zod";
export class SqlValue {
    value;
    constructor(value) {
        this.value = value;
    }
    get typeof() {
        return typeof this.value;
    }
    get raw() {
        return this.value;
    }
    /**
     * Helper function toe check if value is null
     * @returns {boolean}
     */
    isNull() {
        return this.value === null;
    }
    /**
     * Helper function toe check if value is a date
     * @returns {boolean}
     */
    isString() {
        return typeof this.value === "string";
    }
    /**
     * Helper function toe check if value is a valid uuid
     * @returns {boolean}
     */
    isUuid() {
        if (typeof this.value !== "string")
            return false;
        try {
            z.uuid().parse(this.toString());
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Helper function toe check if value is a number
     * @returns {boolean}
     */
    isBoolean() {
        return typeof this.value === "boolean";
    }
    /**
     * Helper function toe check if value is a number
     * @returns {boolean}
     */
    isNumber() {
        return typeof this.value === "number";
    }
    /**
     * Helper function toe check if value is a date
     * @returns {boolean}
     */
    isDate() {
        return this.value instanceof Date;
    }
    /**
     * Returns string representation of SQL value.
     * @returns {string}
     */
    toString() {
        if (this.value === null) {
            return "NULL";
        }
        if (this.value instanceof Date) {
            return this.value.toISOString();
        }
        switch (typeof this.value) {
            case "string":
                return this.value;
            case "number":
            case "boolean":
            case "bigint":
                return String(this.value);
            default:
                throw new TypeError(`Cannot convert ${typeof this.value} to string`);
        }
    }
    /**
     * Returns number representation of sql value
     * @returns {number}
     */
    toNumber() {
        if (this.value === null) {
            throw new TypeError("Cannot convert null to number");
        }
        if (typeof this.value === "number") {
            return this.value;
        }
        if (typeof this.value === "string") {
            const num = Number(this.value);
            if (Number.isNaN(num)) {
                throw new TypeError(`Invalid number: ${this.value}`);
            }
            return num;
        }
        if (typeof this.value === "boolean") {
            return this.value ? 1 : 0;
        }
        throw new TypeError(`Cannot convert ${typeof this.value} to number`);
    }
    /**
     * Returns boolean representation of sql value
     * @param {boolean} def - Default value if value is null
     * @returns {boolean}
     */
    toBoolean(def = false) {
        if (this.value === null) {
            return def;
            // throw new TypeError("Cannot convert null to boolean");
        }
        if (typeof this.value === "boolean") {
            return this.value;
        }
        if (typeof this.value === "number") {
            return this.value !== 0;
        }
        if (typeof this.value === "string") {
            const value = this.value.trim().toLowerCase();
            if (["true", "1", "yes", "y"].includes(value)) {
                return true;
            }
            if (["false", "0", "no", "n"].includes(value)) {
                return false;
            }
            throw new TypeError(`Invalid boolean string: ${this.value}`);
        }
        throw new TypeError(`Cannot convert ${typeof this.value} to boolean`);
    }
    /**
     * Returns Date representation of SQL value.
     * @returns {Date}
     */
    toDate() {
        if (this.value === null) {
            throw new TypeError("Cannot convert null to Date");
        }
        // Already a Date
        if (this.value instanceof Date) {
            return this.value;
        }
        // String or number -> Date
        if (typeof this.value === "string" || typeof this.value === "number") {
            const date = new Date(this.value);
            if (isNaN(date.getTime())) {
                throw new TypeError(`Invalid date value: ${this.value}`);
            }
            return date;
        }
        throw new TypeError(`Cannot convert ${typeof this.value} to Date`);
    }
}
