/**
 * Converts the passed value to a string.
 * @param {unknown} x
 * @returns {string} stringified value
 */
const toString = (value: unknown) => {
  typeof value === "object" ? JSON.stringify(value) : `${value}`;
};

export const MEMORY_MODE = (fn: string) =>
  `Tried to call '${fn}()' in memory mode`;
export const DUPLICATE_DOC = (doc: { _id: string }) =>
  `Duplicate document: ${doc._id}`;

/**
 * Formats an invalid value message.
 * @param {string} param
 * @param {unknown} value
 * @returns {string} message
 */
const INVALID = (param: string, value: unknown) =>
  `Invalid ${param}: ${toString(value)}`;

export const INVALID_DOC = (doc: unknown) => INVALID("doc", doc);
export const INVALID_ID = (_id: string) => INVALID("_id", _id);
export const INVALID_QUERY = (query: unknown) => INVALID("query", query);
export const INVALID_UPDATE = (update: unknown) => INVALID("update", update);
export const INVALID_OPERATOR = (operator: unknown) =>
  INVALID("operator", operator);
export const INVALID_MODIFIER = (modifier: unknown) =>
  INVALID("modifier", modifier);
export const INVALID_PROJECTION = (projection: unknown) =>
  INVALID("projection", projection);

/**
 * Format invalid type message.
 * @param {unknown} value
 * @param {string} type
 * @returns {string} message
 */
const NOT = (value: unknown, type: string) =>
  `Invalid value '${toString(
    value
  )} (${typeof value})', expected type '${type}'`;
export const NOT_ARRAY = (value: unknown) => NOT(value, "Array");
export const NOT_NUMBER = (value: unknown) => NOT(value, "Number");
export const NOT_OBJECT = (value: unknown) => NOT(value, "Object");

/**
 * Format special character type message.
 * @param {unknown} value
 * @param {string} name
 * @returns {string} message
 */
const CONTAINS_SPECIAL_CHARS = (name: string, value: unknown) =>
  `Special characters in ${name} not allowed`;
export const DB_CONTAINS_SPECIAL_CHARS = (value: unknown) =>
  CONTAINS_SPECIAL_CHARS("Database Name", value);
