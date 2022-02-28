"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUIDWithCollisionChecking = exports.generateUIDByTimestamp = exports.generateUID = void 0;
const crypto_1 = __importDefault(require("crypto"));
let _generatedUIDs = {};
/**
 * Generate UID
 * @author Bolorunduro Valiant-Joshua
 * @returns {string} UUID
 */
const generateUID = () => {
    let firstPart = (Math.random() * 46656) | 0;
    let secondPart = (Math.random() * 46656) | 0;
    firstPart = ("000" + firstPart.toString(36)).slice(-3);
    secondPart = ("000" + secondPart.toString(36)).slice(-3);
    return firstPart + secondPart;
};
exports.generateUID = generateUID;
/**
 * Generate UID based on datetime
 * @author Bolorunduro Valiant-Joshua
 * @returns {string} UUID
 */
const generateUIDByTimestamp = (seed) => {
    seed = seed || crypto_1.default.randomBytes(1).readUInt8();
    const timestamp = Date.now().toString(16);
    const random = crypto_1.default.randomBytes(5).toString('hex');
    seed += 1;
    return `${timestamp}${random}${seed.toString(16)}`;
};
exports.generateUIDByTimestamp = generateUIDByTimestamp;
/**
 * Generates UID and checks if Identifier id duplicated
 * @author Bolorunduro Valiant-Joshua
 * @returns {string} UUID
 */
const generateUIDWithCollisionChecking = () => {
    while (true) {
        const uid = ("0000" + ((Math.random() * Math.pow(36, 4)) | 0).toString(36)).slice(-4);
        if (!_generatedUIDs.hasOwnProperty(uid)) {
            _generatedUIDs[uid] = true;
            return uid;
        }
    }
};
exports.generateUIDWithCollisionChecking = generateUIDWithCollisionChecking;
//# sourceMappingURL=idGenerator.js.map