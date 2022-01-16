const FS = require("fs");
const BaseDatabase = require("./core/db");
const BaseWriter = require("./core/writer");
const Bison = require("./fns");
const JSon = require("./json/jsonPool");
const AkivaDBError = require("./utils/ErrorHandler");
const { EventEmitter } = require("events");

const Databases = new Map();
const Json = new JSon();

/**
 * The hub to interact with the database
 * @param {!string} name The database name
 * @returns {BaseDatabase}
 */
function database(name) {
  if (!Databases.has(name)) {
    const Database = new BaseDatabase(name);

    Database.json = Json;

    Databases.set(name, Database);
  }

  return Databases.get(name);
}

module.exports = database;
module.exports.version = require("../package.json").version;
