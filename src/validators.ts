/**
 * Validators
 * @module Validators
 */
import deepEqual from "fast-deep-equal";
import * as dot from "@chronocide/dot-obj";
import { INVALID_OPERATOR } from "./errors";
import { Doc, DocPrivate, Modifiers, Operators, Query, Update } from "./types";
import { AkivaDBError } from "./errorHandler";
import { containsSpecialChars } from "./utils";

/**
 * Validates if value is an object.
 * @namespace PrimitiveGuard
 * @memberof Validators
 * @param {unknown} x
 * @returns {boolean} boolean
 */
export const isObject = (x: unknown): x is object =>
  x !== null && !Array.isArray(x) && typeof x === "object";

/**
 * Validates if an object is empty.
 * @namespace PrimitiveGuard
 * @memberof Validators
 * @param {object} x
 * @returns {boolean} boolean
 */
export const isObjectEmtpy = (x: object) => Object.keys(x).length === 0;

/**
 * Validates if value is a valid ID.
 * @namespace PrimitiveGuard
 * @memberof Validators
 * @param {string} x
 * @returns {boolean} boolean
 */
export const isId = (x: string) => {
  return typeof x === "string" && !containsSpecialChars(x) && x.length > 0;
};

/**
 * Validates if value is a tag.
 * @namespace PrimitiveGuard
 * @memberof Validators
 * @param {string} x
 * @returns {boolean} boolean
 */
export const isTag = (x: string) => x[0] === "$";

/**
 * Validates if key has a tag.
 * @namespace PrimitiveValidator
 * @memberof Validators
 * @param {Array.<{key: string, value: unknown}>} param0
 * @returns {boolean} boolean
 */
export const hasTag = ([key, value]: [string, unknown]) =>
  isTag(key) && value !== undefined;

/**
 * Validates if key has a dit.
 * @namespace PrimitiveValidator
 * @memberof Validators
 * @param {Array.<{key: string, value: unknown}>} param0
 * @returns {boolean} boolean
 */
export const hasDot = ([key, value]: [string, unknown]) =>
  key.includes(".") && value !== undefined;

/**
 * Validates if entry has a key.
 * @namespace PrimitiveValidator
 * @memberof Validators
 * @param {Array.<{string, unknown}>, string} param0
 * @returns {boolean} boolean
 */
export const hasKey = (entry: [string, unknown], key: string) =>
  entry[0] === key && entry[1] !== undefined;

/**
 * Validates if value is a document.
 * @namespace DatabaseGuard
 * @memberof Validators
 * @param {unknown} x
 * @returns {boolean} boolean
 */
export const isDoc = <T extends object>(x: unknown): x is Doc<T> =>
  isObject(x) && dot.every(x, (entry) => !hasDot(entry) && !hasTag(entry));

/**
 * Validates if value is a private document.
 * @namespace DatabaseGuard
 * @memberof Validators
 * @param {unknown} x
 * @returns {boolean} boolean
 */
export const isDocPrivate = <T extends object>(
  x: unknown
): x is DocPrivate<T> => isDoc(x) && !!x._id && isId(x._id);

/**
 * Validates if value is a query.
 * @namespace DatabaseGuard
 * @memberof Validators
 * @param {unknown} x
 * @returns {boolean} boolean
 */
export const isQuery = (x: unknown): x is Query =>
  isObject(x) && dot.every(x, (entry) => !hasKey(entry, "$deleted"));

/**
 * Validates if value is a modifer.
 * @namespace DatabaseGuard
 * @memberof Validators
 * @param {unknown} x
 * @returns {boolean} boolean
 */
export const isModifier = (x: unknown): x is Partial<Modifiers> =>
  isObject(x) &&
  dot.every(
    x,
    (entry) =>
      !hasKey(entry, "$deleted") &&
      !hasKey(entry, "_id") &&
      (hasKey(entry, "$push") || hasKey(entry, "$set") || hasKey(entry, "$add"))
  );

/**
 * Validates if value is a update op.
 * @namespace DatabaseGuard
 * @memberof Validators
 * @param {unknown} x
 * @returns {boolean} boolean
 */
export const isUpdate = <T>(x: unknown): x is Update<T> => {
  return (
    isObject(x) && !(isDoc(x) && isModifier(x)) && (isDoc(x) || isModifier(x))
  );
};

/**
 * Validates if operator exists and is valid.
 * @namespace DatabaseValidator
 * @memberof Validators
 * @param {T} operator
 * @param {unknown} x
 * @returns {boolean} boolean
 */
export const hasOperator = <T extends keyof Operators>(
  operator: T,
  x: unknown
): x is Operators[T] => {
  switch (operator) {
    case "$gt":
    case "$gte":
    case "$lt":
    case "$lte":
      if (!isObject(x)) return false;
      if (dot.some(x, (entry) => typeof entry[1] !== "number")) return false;
      return true;
    case "$string":
    case "$stringStrict":
      if (!isObject(x)) return false;
      if (dot.some(x, (entry) => typeof entry[1] !== "string")) return false;
      return true;
    case "$includes":
    case "$not":
      return isObject(x);
    case "$keys":
      if (!Array.isArray(x)) return false;
      return x.every((i) => typeof i === "string");
    case "$or":
      if (!Array.isArray(x)) return false;
      return x.every(isQuery);
    default:
      return false;
  }
};

/**
 * Validates if modifier exists and is valid.
 * @namespace DatabaseValidator
 * @memberof Validators
 * @param {T} modifer
 * @param {unknown} x
 * @returns {boolean} boolean
 */
export const hasModifier = <T extends keyof Modifiers>(
  modifier: T,
  x: unknown
): x is Modifiers[T] => {
  switch (modifier) {
    case "$push":
    case "$set":
      if (!isObject(x)) return false;
      if (dot.some(x, (entry) => typeof entry[1] !== "number")) return false;
      return true;
    case "add":
      if (!isObject(x)) return false;
      if (dot.some(x, (entry) => !isObject(entry[1]))) return false;
      return true;
    default:
      return false;
  }
};

/**
 * Validates if Query is valid.
 * @namespace Query
 * @memberof Validators
 * @param {Doc<T>} doc
 * @param {Query} query
 * @returns {boolean} boolean
 * @throws {AkivaDBError} InvalidOperatorError
 */
export const isQueryMatch = <T extends object>(
  doc: Doc<T>,
  query: Query
): boolean => {
  if (isObjectEmtpy(query)) return true;

  const isMatchMath =
    (match: (x: number, y: number) => boolean) =>
    (value: Record<string, number>) =>
      Object.entries(value).every((entry) => {
        const cur = dot.get(doc, entry[0]);
        if (typeof cur !== "number") return false;
        return match(cur, entry[1]);
      });

  const isMatchString =
    (match: (x: string, y: string) => boolean) =>
    (value: Record<string, string>) =>
      Object.entries(value).every((entry) => {
        const cur = dot.get(doc, entry[0]);
        if (typeof cur !== "string") return false;
        return match(cur, entry[1]);
      });

  return Object.entries(query).every(([operator, value]) => {
    if (!isTag(operator)) return deepEqual(dot.get(doc, operator), value);
    switch (operator) {
      case "$gt":
        if (!hasOperator(operator, value)) return false;
        return isMatchMath((x, y) => x > y)(value);
      case "$gte":
        if (!hasOperator(operator, value)) return false;
        return isMatchMath((x, y) => x >= y)(value);
      case "$lt":
        if (!hasOperator(operator, value)) return false;
        return isMatchMath((x, y) => x < y)(value);
      case "$lte":
        if (!hasOperator(operator, value)) return false;
        return isMatchMath((x, y) => x <= y)(value);
      case "$string":
        if (!hasOperator(operator, value)) return false;
        return isMatchString((a, b) =>
          a.toLocaleLowerCase().includes(b.toLocaleLowerCase())
        )(value);
      case "$stringStrict":
        if (!hasOperator(operator, value)) return false;
        return isMatchString((a, b) => a.includes(b))(value);
      case "$includes":
        if (!hasOperator(operator, value)) return false;
        return Object.entries(value).every((e) => {
          const current = dot.get(doc, e[0]);
          if (!Array.isArray(current)) return false;
          return current.some((item) => deepEqual(item, e[1]));
        });
      case "$not":
        if (!hasOperator(operator, value)) return false;
        return Object.entries(value).every(
          (e) => !deepEqual(dot.get(doc, e[0]), e[1])
        );
      case "$keys":
        if (!hasOperator(operator, value)) return false;
        return value.every((key) => dot.get(doc, key) !== undefined);
      case "$or":
        if (!hasOperator(operator, value)) return false;
        return value.some((q) => isQueryMatch(doc, q));
      default:
        throw new AkivaDBError(INVALID_OPERATOR(operator), 1);
    }
  });
};
