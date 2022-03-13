"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isQueryMatch = exports.hasModifier = exports.hasOperator = exports.isUpdate = exports.isModifier = exports.isQuery = exports.isDocPrivate = exports.isDoc = exports.hasKey = exports.hasDot = exports.hasTag = exports.isTag = exports.isId = exports.isObjectEmtpy = exports.isObject = void 0;
/**
 * Validators
 * @module Validators
 */
const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
const dot = __importStar(require("@chronocide/dot-obj"));
const errors_1 = require("./errors");
const errorHandler_1 = require("./errorHandler");
const utils_1 = require("./utils");
/**
 * Validates if value is an object.
 * @namespace PrimitiveGuard
 * @memberof Validators
 * @param {unknown} x
 * @returns {boolean} boolean
 */
const isObject = (x) => x !== null && !Array.isArray(x) && typeof x === "object";
exports.isObject = isObject;
/**
 * Validates if an object is empty.
 * @namespace PrimitiveGuard
 * @memberof Validators
 * @param {object} x
 * @returns {boolean} boolean
 */
const isObjectEmtpy = (x) => Object.keys(x).length === 0;
exports.isObjectEmtpy = isObjectEmtpy;
/**
 * Validates if value is a valid ID.
 * @namespace PrimitiveGuard
 * @memberof Validators
 * @param {string} x
 * @returns {boolean} boolean
 */
const isId = (x) => {
    return typeof x === "string" && !(0, utils_1.containsSpecialChars)(x) && x.length > 0;
};
exports.isId = isId;
/**
 * Validates if value is a tag.
 * @namespace PrimitiveGuard
 * @memberof Validators
 * @param {string} x
 * @returns {boolean} boolean
 */
const isTag = (x) => x[0] === "$";
exports.isTag = isTag;
/**
 * Validates if key has a tag.
 * @namespace PrimitiveValidator
 * @memberof Validators
 * @param {Array.<{key: string, value: unknown}>} param0
 * @returns {boolean} boolean
 */
const hasTag = ([key, value]) => (0, exports.isTag)(key) && value !== undefined;
exports.hasTag = hasTag;
/**
 * Validates if key has a dit.
 * @namespace PrimitiveValidator
 * @memberof Validators
 * @param {Array.<{key: string, value: unknown}>} param0
 * @returns {boolean} boolean
 */
const hasDot = ([key, value]) => key.includes(".") && value !== undefined;
exports.hasDot = hasDot;
/**
 * Validates if entry has a key.
 * @namespace PrimitiveValidator
 * @memberof Validators
 * @param {Array.<{string, unknown}>, string} param0
 * @returns {boolean} boolean
 */
const hasKey = (entry, key) => entry[0] === key && entry[1] !== undefined;
exports.hasKey = hasKey;
/**
 * Validates if value is a document.
 * @namespace DatabaseGuard
 * @memberof Validators
 * @param {unknown} x
 * @returns {boolean} boolean
 */
const isDoc = (x) => (0, exports.isObject)(x) && dot.every(x, (entry) => !(0, exports.hasDot)(entry) && !(0, exports.hasTag)(entry));
exports.isDoc = isDoc;
/**
 * Validates if value is a private document.
 * @namespace DatabaseGuard
 * @memberof Validators
 * @param {unknown} x
 * @returns {boolean} boolean
 */
const isDocPrivate = (x) => (0, exports.isDoc)(x) && !!x._id && (0, exports.isId)(x._id);
exports.isDocPrivate = isDocPrivate;
/**
 * Validates if value is a query.
 * @namespace DatabaseGuard
 * @memberof Validators
 * @param {unknown} x
 * @returns {boolean} boolean
 */
const isQuery = (x) => (0, exports.isObject)(x) && dot.every(x, (entry) => !(0, exports.hasKey)(entry, "$deleted"));
exports.isQuery = isQuery;
/**
 * Validates if value is a modifer.
 * @namespace DatabaseGuard
 * @memberof Validators
 * @param {unknown} x
 * @returns {boolean} boolean
 */
const isModifier = (x) => (0, exports.isObject)(x) &&
    dot.every(x, (entry) => !(0, exports.hasKey)(entry, "$deleted") &&
        !(0, exports.hasKey)(entry, "_id") &&
        ((0, exports.hasKey)(entry, "$push") || (0, exports.hasKey)(entry, "$set") || (0, exports.hasKey)(entry, "$add")));
exports.isModifier = isModifier;
/**
 * Validates if value is a update op.
 * @namespace DatabaseGuard
 * @memberof Validators
 * @param {unknown} x
 * @returns {boolean} boolean
 */
const isUpdate = (x) => {
    return ((0, exports.isObject)(x) && !((0, exports.isDoc)(x) && (0, exports.isModifier)(x)) && ((0, exports.isDoc)(x) || (0, exports.isModifier)(x)));
};
exports.isUpdate = isUpdate;
/**
 * Validates if operator exists and is valid.
 * @namespace DatabaseValidator
 * @memberof Validators
 * @param {T} operator
 * @param {unknown} x
 * @returns {boolean} boolean
 */
const hasOperator = (operator, x) => {
    switch (operator) {
        case "$gt":
        case "$gte":
        case "$lt":
        case "$lte":
            if (!(0, exports.isObject)(x))
                return false;
            if (dot.some(x, (entry) => typeof entry[1] !== "number"))
                return false;
            return true;
        case "$string":
        case "$stringStrict":
            if (!(0, exports.isObject)(x))
                return false;
            if (dot.some(x, (entry) => typeof entry[1] !== "string"))
                return false;
            return true;
        case "$includes":
        case "$not":
            return (0, exports.isObject)(x);
        case "$keys":
            if (!Array.isArray(x))
                return false;
            return x.every((i) => typeof i === "string");
        case "$or":
            if (!Array.isArray(x))
                return false;
            return x.every(exports.isQuery);
        default:
            return false;
    }
};
exports.hasOperator = hasOperator;
/**
 * Validates if modifier exists and is valid.
 * @namespace DatabaseValidator
 * @memberof Validators
 * @param {T} modifer
 * @param {unknown} x
 * @returns {boolean} boolean
 */
const hasModifier = (modifier, x) => {
    switch (modifier) {
        case "$push":
        case "$set":
            if (!(0, exports.isObject)(x))
                return false;
            if (dot.some(x, (entry) => typeof entry[1] !== "number"))
                return false;
            return true;
        case "add":
            if (!(0, exports.isObject)(x))
                return false;
            if (dot.some(x, (entry) => !(0, exports.isObject)(entry[1])))
                return false;
            return true;
        default:
            return false;
    }
};
exports.hasModifier = hasModifier;
/**
 * Validates if Query is valid.
 * @namespace Query
 * @memberof Validators
 * @param {Doc<T>} doc
 * @param {Query} query
 * @returns {boolean} boolean
 * @throws {AkivaDBError} InvalidOperatorError
 */
const isQueryMatch = (doc, query) => {
    if ((0, exports.isObjectEmtpy)(query))
        return true;
    const isMatchMath = (match) => (value) => Object.entries(value).every((entry) => {
        const cur = dot.get(doc, entry[0]);
        if (typeof cur !== "number")
            return false;
        return match(cur, entry[1]);
    });
    const isMatchString = (match) => (value) => Object.entries(value).every((entry) => {
        const cur = dot.get(doc, entry[0]);
        if (typeof cur !== "string")
            return false;
        return match(cur, entry[1]);
    });
    return Object.entries(query).every(([operator, value]) => {
        if (!(0, exports.isTag)(operator))
            return (0, fast_deep_equal_1.default)(dot.get(doc, operator), value);
        switch (operator) {
            case "$gt":
                if (!(0, exports.hasOperator)(operator, value))
                    return false;
                return isMatchMath((x, y) => x > y)(value);
            case "$gte":
                if (!(0, exports.hasOperator)(operator, value))
                    return false;
                return isMatchMath((x, y) => x >= y)(value);
            case "$lt":
                if (!(0, exports.hasOperator)(operator, value))
                    return false;
                return isMatchMath((x, y) => x < y)(value);
            case "$lte":
                if (!(0, exports.hasOperator)(operator, value))
                    return false;
                return isMatchMath((x, y) => x <= y)(value);
            case "$string":
                if (!(0, exports.hasOperator)(operator, value))
                    return false;
                return isMatchString((a, b) => a.toLocaleLowerCase().includes(b.toLocaleLowerCase()))(value);
            case "$stringStrict":
                if (!(0, exports.hasOperator)(operator, value))
                    return false;
                return isMatchString((a, b) => a.includes(b))(value);
            case "$includes":
                if (!(0, exports.hasOperator)(operator, value))
                    return false;
                return Object.entries(value).every((e) => {
                    const current = dot.get(doc, e[0]);
                    if (!Array.isArray(current))
                        return false;
                    return current.some((item) => (0, fast_deep_equal_1.default)(item, e[1]));
                });
            case "$not":
                if (!(0, exports.hasOperator)(operator, value))
                    return false;
                return Object.entries(value).every((e) => !(0, fast_deep_equal_1.default)(dot.get(doc, e[0]), e[1]));
            case "$keys":
                if (!(0, exports.hasOperator)(operator, value))
                    return false;
                return value.every((key) => dot.get(doc, key) !== undefined);
            case "$or":
                if (!(0, exports.hasOperator)(operator, value))
                    return false;
                return value.some((q) => (0, exports.isQueryMatch)(doc, q));
            default:
                throw new errorHandler_1.AkivaDBError((0, errors_1.INVALID_OPERATOR)(operator), 1);
        }
    });
};
exports.isQueryMatch = isQueryMatch;
//# sourceMappingURL=validators.js.map