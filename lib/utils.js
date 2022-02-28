"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decode = exports.encode = exports.splitArray = exports.boolToNumber = exports.humanReadableFileSize = exports.containsSpecialChars = exports.toArray = void 0;
const CHUNK = 16384;
const characterFormat = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
/**
 * Converts passed value to an array.
 * @param {T | T[]} x
 * @returns {Array} array
 */
const toArray = (x) => (Array.isArray(x) ? x : [x]);
exports.toArray = toArray;
/**
 * Checks for special characters.
 * @param {string} x
 * @returns {boolean} boolean
 */
const containsSpecialChars = (x) => characterFormat.test(x);
exports.containsSpecialChars = containsSpecialChars;
/**
 * Convert bytes to human readable formats.
 * @param {number} x
 * @returns {string} formattedSize
 */
const humanReadableFileSize = (x) => {
    const units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    let l = 0, n = x || 0;
    while (n >= 1024 && ++l) {
        n = n / 1024;
    }
    return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l];
};
exports.humanReadableFileSize = humanReadableFileSize;
/**
 * Covert boolean to number
 * @param x boolean
 * @returns {number} 1 or 0
 */
const boolToNumber = (x) => (x ? 1 : 0);
exports.boolToNumber = boolToNumber;
/**
 * Split array
 * @param {[]} array The array to split
 * @param {!Number} [pages] array to split every pages
 * @returns {Array<Array<any>>} array
 */
const splitArray = (array, pages = 2) => __awaiter(void 0, void 0, void 0, function* () {
    if (!array.length)
        return [];
    const chunks = [];
    for (let i = 0; i < array.length;) {
        chunks.push(array.slice(i, (i += pages)));
    }
    return chunks;
});
exports.splitArray = splitArray;
/**
 * Encode strings
 * @param {string} string The string to encode
 * @returns encodedString
 */
const encode = (string) => {
    const b64 = Buffer.from(string).toString("base64");
    let enc = "";
    let l = 0;
    while (l < b64.length) {
        const str = b64.substring(l, l + CHUNK);
        let codes = [];
        let i = 0;
        while (i < str.length) {
            const strng = str.substring(i, i + 2);
            const code = [strng.charCodeAt(0), strng.charCodeAt(1)];
            const first = code[0] - 33;
            const second = (code[1] || 93) - 33;
            codes.push(`${first}${second}`);
            i += 2;
        }
        const encStr = String.fromCharCode(...codes);
        enc += encStr;
        l += CHUNK;
        if (l < b64.length)
            enc += "\n";
    }
    return enc;
};
exports.encode = encode;
/**
 * Decode strings
 * @param {string} string The string to Decode
 * @returns decodedString
 */
const decode = (string) => {
    if (!string.length)
        return "";
    const strings = string.replace(/\n/g, "");
    let b64 = "";
    let l = 0;
    while (l < strings.length) {
        const str = strings.substring(l, l + CHUNK / 2);
        let codes = [];
        let i = 0;
        while (i < str.length) {
            const code = `${str[i].charCodeAt(0)}`;
            const first = 1 * parseInt(code.substring(0, 2)) + 33;
            const second = 1 * parseInt(code.substring(2)) + 33;
            codes.push(first);
            if (second != 93)
                codes.push(second);
            i++;
        }
        const decStr = String.fromCharCode(...codes);
        b64 += decStr;
        l += CHUNK / 2;
    }
    const decoded = Buffer.from(b64, "base64").toString();
    return decoded;
};
exports.decode = decode;
//# sourceMappingURL=utils.js.map