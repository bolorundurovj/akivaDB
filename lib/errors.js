"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB_CONTAINS_SPECIAL_CHARS = exports.NOT_OBJECT = exports.NOT_NUMBER = exports.NOT_ARRAY = exports.INVALID_PROJECTION = exports.INVALID_MODIFIER = exports.INVALID_OPERATOR = exports.INVALID_UPDATE = exports.INVALID_QUERY = exports.INVALID_ID = exports.INVALID_DOC = exports.DUPLICATE_DOC = exports.MEMORY_MODE = void 0;
/**
 * Converts the passed value to a string.
 * @param {unknown} x
 * @returns {string} stringified value
 */
const toString = (value) => {
    typeof value === "object" ? JSON.stringify(value) : `${value}`;
};
const MEMORY_MODE = (fn) => `Tried to call '${fn}()' in memory mode`;
exports.MEMORY_MODE = MEMORY_MODE;
const DUPLICATE_DOC = (doc) => `Duplicate document: ${doc._id}`;
exports.DUPLICATE_DOC = DUPLICATE_DOC;
/**
 * Formats an invalid value message.
 * @param {string} param
 * @param {unknown} value
 * @returns {string} message
 */
const INVALID = (param, value) => `Invalid ${param}: ${toString(value)}`;
const INVALID_DOC = (doc) => INVALID("doc", doc);
exports.INVALID_DOC = INVALID_DOC;
const INVALID_ID = (_id) => INVALID("_id", _id);
exports.INVALID_ID = INVALID_ID;
const INVALID_QUERY = (query) => INVALID("query", query);
exports.INVALID_QUERY = INVALID_QUERY;
const INVALID_UPDATE = (update) => INVALID("update", update);
exports.INVALID_UPDATE = INVALID_UPDATE;
const INVALID_OPERATOR = (operator) => INVALID("operator", operator);
exports.INVALID_OPERATOR = INVALID_OPERATOR;
const INVALID_MODIFIER = (modifier) => INVALID("modifier", modifier);
exports.INVALID_MODIFIER = INVALID_MODIFIER;
const INVALID_PROJECTION = (projection) => INVALID("projection", projection);
exports.INVALID_PROJECTION = INVALID_PROJECTION;
/**
 * Format invalid type message.
 * @param {unknown} value
 * @param {string} type
 * @returns {string} message
 */
const NOT = (value, type) => `Invalid value '${toString(value)} (${typeof value})', expected type '${type}'`;
const NOT_ARRAY = (value) => NOT(value, "Array");
exports.NOT_ARRAY = NOT_ARRAY;
const NOT_NUMBER = (value) => NOT(value, "Number");
exports.NOT_NUMBER = NOT_NUMBER;
const NOT_OBJECT = (value) => NOT(value, "Object");
exports.NOT_OBJECT = NOT_OBJECT;
/**
 * Format special character type message.
 * @param {unknown} value
 * @param {string} name
 * @returns {string} message
 */
const CONTAINS_SPECIAL_CHARS = (name, value) => `Special characters in ${name} not allowed`;
const DB_CONTAINS_SPECIAL_CHARS = (value) => CONTAINS_SPECIAL_CHARS("Database Name", value);
exports.DB_CONTAINS_SPECIAL_CHARS = DB_CONTAINS_SPECIAL_CHARS;
//# sourceMappingURL=errors.js.map