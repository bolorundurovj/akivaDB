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
Object.defineProperty(exports, "__esModule", { value: true });
exports.modify = exports.project = void 0;
const dot = __importStar(require("@chronocide/dot-obj"));
const errorHandler_1 = require("./errorHandler");
const errors_1 = require("./errors");
const validators_1 = require("./validators");
/**
 * Projects the selected field(s).
 * @param {T} doc
 * @param {P} projection
 * @returns {Projection<T,P>} doc
 * @todo Add `_id` by default
 */
const project = (doc, projection) => {
    if (!Array.isArray(projection))
        throw new errorHandler_1.AkivaDBError((0, errors_1.NOT_ARRAY)(projection), 2);
    return projection.reduce((acc, key) => (Object.assign(Object.assign({}, acc), { [key]: doc[key] })), {});
};
exports.project = project;
/**
 * Modifies the document based on the provided modifier(s).
 * @param {T} doc
 * @param {Partial<Modifiers>} modifiers
 * @returns {T} doc
 */
const modify = (doc, modifiers) => {
    Object.entries(modifiers).forEach(([modifier, value]) => {
        switch (modifier) {
            case "$push":
                if (!(0, validators_1.hasModifier)(modifier, value))
                    break;
                Object.entries(value).forEach((entry) => {
                    const cur = dot.get(doc, entry[0]);
                    if (!Array.isArray(cur))
                        throw new errorHandler_1.AkivaDBError((0, errors_1.NOT_ARRAY)(cur), 2);
                    dot.set(doc, entry[0], [...cur, entry[1]]);
                });
                break;
            case "$set":
                if (!(0, validators_1.hasModifier)(modifier, value))
                    break;
                Object.entries(value).forEach((entry) => dot.set(doc, entry[0], entry[1]));
                break;
            case "$add":
                if (!(0, validators_1.hasModifier)(modifier, value))
                    break;
                Object.entries(value).forEach((entry) => {
                    const cur = dot.get(doc, entry[0]);
                    if (typeof cur !== "number")
                        throw new errorHandler_1.AkivaDBError((0, errors_1.NOT_NUMBER)(cur), 2);
                    dot.set(doc, entry[0], cur + entry[1]);
                });
                break;
            default:
                throw new errorHandler_1.AkivaDBError((0, errors_1.INVALID_MODIFIER)(modifier), 1);
        }
    });
    return doc;
};
exports.modify = modify;
//# sourceMappingURL=modifiers.js.map