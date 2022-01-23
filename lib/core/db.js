const Util = require("../utils");
const AkivaDBError = require("../utils/ErrorHandler");
const Collection = require("./collection");
const { EventEmitter } = require("events");

const characterFormat = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;

/**
 * The main hub to interact with the database
 * @extends {EventEmitter}
 */
class Database extends EventEmitter {
  /**
   * @param {!String} name The name for the storage
   */
  constructor(name) {
    if (typeof name !== "string")
      throw new AkivaDBError("Name must be typeof string!", 1);

    super();

    this._waitForReady = [];

    this.ready = false;
    this.name = name;
    this.cache = new Map();
    this.collections = new Map();
    this.sizeCache = Object.create(null);

    this.once("ready", () => {
      this.ready = true;

      let i = 0;

      while (i < this._waitForReady.length) {
        const resolve = this._waitForReady.shift();

        resolve();

        i++;
      }
    });

    new Promise(async (resolve, reject) => {
      await Util.createStorage(name).catch(reject);

      this.emit("ready");
    });
  }

  /**
   * The database name
   * @returns {String}
   */
  get displayName() {
    return this.name;
  }

  /**
   * The condition if the Database is ready to use
   * @returns {Boolean}
   */
  get isReady() {
    return this.ready;
  }

  /**
   * The hub to interact with the collections
   * @param {!Object} opts The options for the collection
   * @returns {Collection} The Collection
   */
  collection(opts) {
    if (typeof opts.name !== "string")
      throw new AkivaDBError("Collection name must be a string!", 2);

    if (opts.name.includes("/"))
      throw new AkivaDBError("/ in filename is not allowed!", 4);

    if (opts.name.includes("\\"))
      throw new AkivaDBError(" in filename is not allowed!", 4);

    if (characterFormat.test(opts.name)) {
      throw new AkivaDBError(
        "Special Characters in filename is not allowed!",
        4
      );
    }

    if (typeof opts.ttl === "number" && opts.ttl < 5)
      throw new AkivaDBError(
        "TTL must be a minimum of 5 seconds!",
        5
      );

    if (this.collections.has(opts.name)) return this.collections.get(opts.name);

    const col = new Collection(this, opts);

    this.collections.set(opts.name, col);

    return col;
  }
}

module.exports = Database;
