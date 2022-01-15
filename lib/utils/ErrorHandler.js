/**
 * The custom error that used by the db
 * @extends {Error}
 */
class AkivaDBError extends Error {
  /**
   * @param {!String} message The error message
   * @param {!Number} code The error code
   */
  constructor(message, code) {
    super(message);

    Error.captureStackTrace(this, AkivaDBError);

    this.code = parseInt(code);
  }
}

module.exports = AkivaDBError;
