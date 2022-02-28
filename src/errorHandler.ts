/**
 * The custom error that used by the db
 * @extends {Error}
 * @author Bolorunduro Valiant-Joshua
 */
export class AkivaDBError extends Error {
  /**
   * @param {!String} message The error message
   * @param {!Number} code The error code
   */
  constructor(message: string, code: number) {
    super(message);
    this.stack = null;

    Object.setPrototypeOf(this, new.target.prototype);

    // Error.captureStackTrace(this, AkivaDBError);

    code = code;
  }
}
