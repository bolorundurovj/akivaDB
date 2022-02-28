"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AkivaDBError = void 0;
/**
 * The custom error that used by the db
 * @extends {Error}
 * @author Bolorunduro Valiant-Joshua
 */
class AkivaDBError extends Error {
    /**
     * @param {!String} message The error message
     * @param {!Number} code The error code
     */
    constructor(message, code) {
        super(message);
        this.stack = null;
        Object.setPrototypeOf(this, new.target.prototype);
        // Error.captureStackTrace(this, AkivaDBError);
        code = code;
    }
}
exports.AkivaDBError = AkivaDBError;
//# sourceMappingURL=errorHandler.js.map