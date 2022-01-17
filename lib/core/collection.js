const fs = require("fs");
const fsp = fs.promises;
const deepClone = require("rfdc")();
const Util = require("../utils");
const AkivaDBError = require("../utils/ErrorHandler");
const Writer = require("./writer");
const DB = require("./db");
const Bison = require("../fns");
const { EventEmitter } = require("events");

const MAX_SIZE = 1018220;

/**
 * The hub to interact with the db Collections
 * @extends {EventEmitter}
 */
class Collection extends EventEmitter {
  /**
   * @param {!DB} db The database
   * @param {!String} name The collection name
   * @param {!Number} [ttl] Make the collection support ttl or not
   */
  constructor(db, opts) {
    super();

    this._waitForReady = [];
    this._waitForTTL = [];

    this.ready = false;
    this.closed = false;
    this.db = db;
    this.name = `${opts.name}.akvdb`;
    this.ttl = opts.ttl || 0;
    this.ttlCheck = null;
    this.ttlChecking = false;
    this.indexes = {};
    this.ttls = {};

    this.writer = new Writer(db, this);

    this.once("ready", () => {
      this.ready = true;

      let waitReady = 0;

      while (waitReady < this._waitForReady.length) {
        const resolve = this._waitForReady.shift();

        resolve();

        waitReady++;
      }

      if (this.ttl >= 5) {
        this.on("ttl", async (check) => {
          if (!check) {
            let waitTTL = 0;

            while (waitTTL < this._waitForTTL.length) {
              const resolve = this._waitForTTL.shift();

              resolve();

              waitTTL++;
            }
          }
        });

        this.checkTTL = async () => {
          const entries = Object.entries(this.ttls);
          const expired = [];

          let i = 0;

          while (i < entries.length) {
            if (entries[i][1] <= Date.now()) expired.push(entries[i][0]);

            i++;
          }

          if (!expired.length) return;

          const indexes = expired.map((key) => this.indexes[key]);

          const indexs = Object.entries(this.indexes);
          const newIndexes = {};
          const re = [];

          let id = 0;

          while (id < indexs.length) {
            const index = expired.indexOf(indexs[id][0]);

            if (index >= 0) {
              delete this.ttls[indexs[id][0]];

              let idx;

              const reid = re.findIndex((ind) => ind <= indexs[id][1]);

              if (reid < 0) idx = indexs[id][1];
              else idx = indexs[id][1] - (re.length - reid);

              re.push(idx);

              this.emit("expired", this.db.cache.get(this.displayName)[idx]);

              this.db.cache.get(this.displayName).splice(idx, 1);

              re.sort((a, b) => a - b);

              id++;

              continue;
            }

            const reid = re.findIndex((ind) => ind <= indexs[id][1]);

            if (reid < 0) {
              newIndexes[indexs[id][0]] = indexs[id][1];

              id++;

              continue;
            }

            newIndexes[indexs[id][0]] = indexs[id][1] - (re.length - reid);

            id++;
          }

          this.indexes = newIndexes;

          this.writer.emit("exec");

          return;
        };

        this.ttlCheck = setInterval(async () => {
          if (this.ttlChecking)
            await new Promise(async (resolve) => {
              this._waitForTTL.push(resolve);

              setImmediate(() => {
                if (!this.ttlChecking) resolve();
              });

              if (!this.ttlChecking) resolve();
            });

          this.emit("ttl", true);

          await this.checkTTL();

          this.emit("ttl", false);
        }, this.ttl * 1000);
      }
    });
    (async () => {
      if (!this.db.ready)
        await new Promise((res) => {
          this.db._waitForReady.push(res);

          setImmediate(() => {
            if (this.db.ready) res();
          });

          if (this.db.ready) res();
        });

      const path = `${this.db.name}/${this.displayName}`;

      const main = await fsp.open(`${path}.akvdb`, "r+").catch((err) => null);
      const temp = await fsp.open(`${path}.tmp`, "r+").catch((err) => null);

      if (!(main || temp)) {
        this.db.cache.set(this.displayName, []);

        return;
      }

      const sz = await fsp.readFile(`${path}.sz`, "utf8").catch((err) => null);

      let fh = main || temp;

      if (main && temp) {
        if (sz && sz.length) {
          const tmpStat = await temp.stat();

          if (tmpStat.size == sz.split(" ")[0]) {
            fh = temp;

            await main.close();
          } else {
            fh = main;

            await temp.close();
          }
        } else {
          fh = main;

          await temp.close();
        }
      }

      await fh.sync();

      const stream = fs.createReadStream(null, {
        fd: fh.fd,
        encoding: "utf8",
        autoClose: false,
      });

      await new Promise((res, rej) => {
        let data = "";

        stream.once("end", async () => {
          stream.removeAllListeners();

          await fh.close();

          if (!data.length) {
            this.db.cache.set(this.displayName, []);

            return res();
          }

          data = Bison.decode(data);

          let json;

          try {
            if (sz && sz.length && sz.split(" ")[1] <= MAX_SIZE) {
              json = JSON.parse(`[${data}]`);
            } else {
              json = await this.db.json.parse(`[${data}]`);
            }
          } catch (err) {
            rej(new AkivaDBError("Failed to deserialize data", 3));
          }

          if (!json) return;

          this.db.cache.set(this.displayName, json);

          res();
        });

        stream.on("data", (chunk) => {
          data += chunk;
        });
      });

      const col = this.db.cache.get(this.displayName);

      for (let i = 0; i < col.length; ++i) {
        const val = col[i];

        this.indexes[val._index] = i;

        if (!isNaN(val._ttl) && this.ttl >= 5) {
          this.ttls[val._index] = val._ttl;
        }
      }
    })().then(() => this.emit("ready"));
  }

  /**
   * The collection name
   * @returns {String}
   */
  get displayName() {
    return this.name.substr(0, this.name.length - 6);
  }

  /**
   * The collection size
   * @returns {Number}
   */
  get size() {
    if (this.closed) throw new AkivaDBError("Collection is closed!", 10);

    return this.db.cache.get(this.displayName).length;
  }

  /**
   * The condition if the Collection can be used
   * @returns {Boolean}
   */
  get isOpen() {
    return this.ready && !this.closed;
  }

  /**
   * Destroy and delete the Collection
   * @returns {Promise<Boolean>}
   */
  async destroy() {
    if (!this.ready)
      await new Promise(async (resolve) => {
        this._waitForReady.push(resolve);

        setImmediate(() => {
          if (this.ready) resolve();
        });

        if (this.ready) resolve();
      });

    if (this.closed) throw new AkivaDBError("Collection is closed!", 10);

    this.closed = true;

    super.removeAllListeners();

    if (this.ttlCheck) clearInterval(this.ttlCheck);

    if (this.ttlChecking)
      await new Promise(async (resolve) => {
        this._waitForTTL.push(resolve);

        setImmediate(() => {
          if (!this.ttlChecking) resolve();
        });

        if (!this.ttlChecking) resolve();
      });

    if (this.writer.run)
      await new Promise(async (resolve) => {
        this.writer._waitForReady.push(resolve);

        setImmediate(() => {
          if (!this.writer.run) resolve();
        });

        if (!this.writer.run) resolve();
      });

    for (const promise of this.writer.promises) {
      promise[1](new AkivaDBError("Collection is closed!", 10));
    }

    await fs.promises.unlink(`${this.db.name}/${this.name}`).catch((err) => {});

    this.db.cache.delete(this.displayName);

    this.db.collections.delete(this.displayName);

    delete this;

    return true;
  }

  /**
   * Close the Collection, the data will be saved and remain in the Collection
   * @returns {Promise<Boolean>}
   */
  async close() {
    if (!this.ready)
      await new Promise(async (resolve) => {
        this._waitForReady.push(resolve);

        setImmediate(() => {
          if (this.ready) resolve();
        });

        if (this.ready) resolve();
      });

    if (this.closed) throw new AkivaDBError("Collection is closed!", 10);

    this.closed = true;

    super.removeAllListeners();

    if (this.ttlCheck) clearInterval(this.ttlCheck);

    if (this.ttlChecking)
      await new Promise(async (resolve) => {
        this._waitForTTL.push(resolve);

        setImmediate(() => {
          if (!this.ttlChecking) resolve();
        });

        if (!this.ttlChecking) resolve();
      });

    if (this.writer.run)
      await new Promise(async (resolve) => {
        this.writer._waitForReady.push(resolve);

        setImmediate(() => {
          if (!this.writer.run) resolve();
        });

        if (!this.writer.run) resolve();
      });

    for (const promise of this.writer.promises) {
      promise[1](new AkivaDBError("Collection is closed!", 10));
    }

    this.db.cache.delete(this.displayName);

    this.db.collections.delete(this.displayName);

    delete this;

    return true;
  }

  /**
   * Finds data in the Collection
   * @param {!Object} filter The Filter to find the data
   * @param {!Number} [max] Limit for the filter
   * @return {Promise<Array>}
   */
  async find(filter, max = Infinity) {
    if (!this._isObject(filter))
      throw new AkivaDBError(`Data must be instanceof Object`, 9);

    if (this.closed) throw new AkivaDBError("Collection is closed!", 10);

    await this._check(filter);

    if (!this.ready)
      await new Promise(async (resolve) => {
        this._waitForReady.push(resolve);

        setImmediate(() => {
          if (this.ready) resolve();
        });

        if (this.ready) resolve();
      });

    if (this.closed) throw new AkivaDBError("Collection is closed!", 10);

    if (filter._index !== undefined) {
      const index = this.indexes[String(filter._index)];
      const item = this.db.cache.get(this.displayName)[index];

      return item ? [deepClone(item)] : [];
    }

    const find = await Util.find(
      this.db.cache.get(this.displayName),
      filter,
      max,
      this.db.json
    );

    return find;
  }

  /**
   * Find one data in the Collection
   * @param {!Object} filter The Filter to find the data
   * @returns {Promise}
   */
  async findOne(filter) {
    if (!this._isObject(filter))
      throw new AkivaDBError(`Data must be instanceof Object`, 9);

    if (this.closed) throw new AkivaDBError("Collection is closed!", 10);

    await this._check(filter);

    if (!this.ready)
      await new Promise(async (resolve) => {
        this._waitForReady.push(resolve);

        setImmediate(() => {
          if (this.ready) resolve();
        });

        if (this.ready) resolve();
      });

    if (this.closed) throw new AkivaDBError("Collection is closed!", 10);

    if (filter._index !== undefined) {
      const index = this.indexes[String(filter._index)];
      const item = this.db.cache.get(this.displayName)[index];

      return item ? deepClone(item) : item;
    }

    const { item } = await Util.findOne(
      this.db.cache.get(this.displayName),
      filter
    );

    return item ? deepClone(item) : undefined;
  }

  /**
   * Method to set a data into collection
   * @param {!Object} data The data to set
   * @param {!Object} [filter] A filter to replace a data
   * @returns {Promise<Boolean>}
   */
  async set(data, filter) {
    if (!this._isObject(data))
      throw new AkivaDBError("Data must be instanceof Object!", 9);

    if (this.closed) throw new AkivaDBError("Collection is closed!", 10);

    await this._check(data);

    if (!this.ready)
      await new Promise(async (resolve) => {
        this._waitForReady.push(resolve);

        setImmediate(() => {
          if (this.ready) resolve();
        });

        if (this.ready) resolve();
      });

    if (this.ttlChecking)
      await new Promise(async (resolve) => {
        this._waitForTTL.push(resolve);

        setImmediate(() => {
          if (!this.ttlChecking) resolve();
        });

        if (!this.ttlChecking) resolve();
      });

    if (this.closed) throw new AkivaDBError("Collection is closed!", 10);

    if (!this._isObject(filter)) {
      if (data._index === undefined) {
        let i = this.db.cache.get(this.displayName).length;

        while (this.indexes[i]) i++;

        data._index = String(i);
      }

      data._index = String(data._index);

      if (typeof this.indexes[data._index] === "number")
        throw new AkivaDBError("Duplicated data found!", 11);

      if (typeof data._ttl === "number" && this.ttl >= 15) {
        this.ttls[data._index] = String(data._ttl);
      }

      this.db.cache.get(this.displayName).push(data);

      this.indexes[data._index] =
        this.db.cache.get(this.displayName).length - 1;

      await new Promise((res, rej) => {
        this.writer.promises.push([res, rej]);
        this.writer.emit("exec");
      });

      this.emit("dataInserted", data);
      return true;
    }

    await this._check(filter);

    if ("_index" in filter) {
      const index = this.indexes[String(filter._index)];

      if (!("_index" in data)) {
        data._index = filter._index;
      }

      data._index = String(data._index);

      if (
        data._index !== String(filter._index) &&
        typeof this.indexes[data._index] === "number"
      )
        throw new AkivaDBError("Duplicated data found!", 11);

      if (typeof data._ttl === "number" && this.ttl >= 5) {
        this.ttls[data._index] = String(data._ttl);
      }

      if (data._index !== filter._index) delete this.indexes[filter._index];

      if (typeof index === "number") {
        this.db.cache.get(this.displayName)[index] = data;

        this.indexes[data._index] = index;
      } else {
        this.db.cache.get(this.displayName).push(data);

        this.indexes[data._index] =
          this.db.cache.get(this.displayName).length - 1;
      }

      await new Promise((res, rej) => {
        this.writer.promises.push([res, rej]);
        this.writer.emit("exec");
      });
      this.emit("dataInserted", data);
      return true;
    }

    const obj = await Util.findOne(this.db.cache.get(this.displayName), filter);

    if (!("_index" in data)) {
      if (obj.item) {
        data._index = obj.item._index;
      } else {
        let i = this.db.cache.get(this.displayName).length;

        while (!isNaN(this.indexes[i])) i++;

        data._index = String(i);
      }
    }

    data._index = String(data._index);

    if (!obj.item && typeof this.indexes[data._index] === "number")
      throw new AkivaDBError("Duplicated data found!", 11);

    if (typeof data._ttl === "number" && this.ttl >= 5) {
      this.ttls[data._index] = String(data._ttl);
    }

    if (obj.item && obj.item._index !== data._index)
      delete this.indexes[obj.item._index];

    if (typeof obj.index === "number") {
      this.db.cache.get(this.displayName)[obj.index] = data;

      this.indexes[data._index] = obj.index;
    } else {
      this.db.cache.get(this.displayName).push(data);

      this.indexes[data._index] =
        this.db.cache.get(this.displayName).length - 1;
    }

    await new Promise((res, rej) => {
      this.writer.promises.push([res, rej]);
      this.writer.emit("exec");
    });

    this.emit("dataInserted", data);
    return true;
  }

  /**
   * Method to delete a data from the collection
   * @param {!Object} filter The filter of the data that will be deleted
   * @param {!Number} [max] The maximum data to delete
   * @returns {Promise<Boolean>}
   */
  async delete(filter, max = Infinity) {
    const result = await this.find(filter, max);

    if (this.ttlChecking)
      await new Promise(async (resolve) => {
        this._waitForTTL.push(resolve);

        setImmediatet(() => {
          if (!this.ttlChecking) resolve();
        });

        if (!this.ttlChecking) resolve();
      });

    if (!result.length) return false;

    if (
      result.length === 1 &&
      this.db.cache.get(this.displayName)[this.indexes[result[0]._index]] ===
        this.db.cache.get(this.displayName).length - 1
    ) {
      this.db.cache.get(this.displayName).pop();

      delete this.indexes[result[0]._index];
      delete this.ttls[result[0]._index];

      await new Promise((res, rej) => {
        this.writer.promises.push([res, rej]);
        this.writer.emit("exec");
      });

      this.emit("dataDeleted", filter);
      return true;
    }

    const indexes = [];
    const ids = [];

    let id = 0;

    while (id < result.length) {
      ids.push(result[id]._index);
      indexes.push(this.indexes[result[id]._index]);

      id++;
    }

    const indexs = Object.entries(this.indexes);
    const newIndexes = {};
    const re = [];

    let i = 0;

    while (i < indexs.length) {
      const index = ids.indexOf(indexs[i][0]);

      if (index >= 0) {
        let idx;

        const reid = re.findIndex((ind) => ind <= indexs[i][1]);

        if (reid < 0) idx = indexs[i][1];
        else idx = indexs[i][1] - (re.length - reid);

        re.push(idx);

        delete this.ttls[indexs[i][0]];

        this.db.cache.get(this.displayName).splice(idx, 1);

        re.sort((a, b) => a - b);

        i++;

        continue;
      }

      const reid = re.findIndex((ind) => ind <= indexs[i][1]);

      if (reid < 0) {
        newIndexes[indexs[i][0]] = indexs[i][1];

        i++;

        continue;
      }

      newIndexes[indexs[i][0]] = indexs[i][1] - (re.length - reid);

      i++;
    }

    this.indexes = newIndexes;

    await new Promise((res, rej) => {
      this.writer.promises.push([res, rej]);
      this.writer.emit("exec");
    });

    this.emit("dataDeleted", filter);
    return true;
  }

  /**
   * Update filtered data property value
   * @param {!Object} filter The filter to the data
   * @param {string[]} property The property to access
   * @param {any} value The value to give
   * @returns {Boolean}
   */
  async update(filter, property, value, object = false) {
    if (!this._isObject(filter))
      throw new AkivaDBError("Data must be instanceof Object!", 9);

    if (this.closed) throw new AkivaDBError("Collection is closed!", 10);

    if (!Array.isArray(property)) property = [property];

    await this._check(filter);

    if (typeof value === "function")
      throw new AkivaDBError("Function is not allowed!", 7);
    else if (value instanceof Object) await this._check(value);

    if (!this.ready)
      await new Promise(async (resolve) => {
        this._waitForReady.push(resolve);

        setImmediate(() => {
          if (this.ready) resolve();
        });

        if (this.ready) resolve();
      });

    if (this.ttlChecking)
      await new Promise(async (resolve) => {
        this._waitForTTL.push(resolve);

        setImmediate(() => {
          if (!this.ttlChecking) resolve();
        });

        if (!this.ttlChecking) resolve();
      });

    let data = {};

    if (filter._index !== undefined) {
      const index = this.indexes[String(filter._index)];

      if (isNaN(index)) return false;

      data = this.db.cache.get(this.displayName)[index];
    } else {
      const item = await Util.findOne(
        this.db.cache.get(this.displayName),
        filter
      );

      if (!item.item) return false;

      data = item.item;
    }

    if (
      property[0] === "_index" &&
      property.length === 1 &&
      data._index !== String(value)
    )
      throw new AkivaDBError("Duplicated data found!", 11);

    let dataCheck = data;
    let i = 0;

    while (i < property.length) {
      if (!(dataCheck instanceof Object)) {
        if (!object)
          throw new AkivaDBError("Data must be instanceof Object!", 9);
        else {
          eval(`data[\`${property.slice(0, i).join("`][`")}\`] = {}`);

          dataCheck = {};
        }
      }

      dataCheck = dataCheck[String(property[i])];

      i++;
    }

    if (i === 1 && property[0] === "_index") {
      value = String(value);
    }

    eval(`data[\`${property.join("`][`")}\`] = value`);

    if (!isNaN(data._ttl) && this.ttl >= 5)
      this.ttls[data._index] = String(data._ttl);

    await new Promise((res, rej) => {
      this.writer.promises.push([res, rej]);
      this.writer.emit("exec");
    });

    this.emit("dataUpdated", filter);
    return true;
  }

  /**
   * Delete some data in the collection
   * @param {...Object} filters The filter of data to delete
   * @returns {Promise<Boolean}
   */
  async deleteMany(...filters) {
    if (this.closed) throw new AkivaDBError("Collection is closed!", 10);

    if (!this.ready)
      await new Promise(async (resolve) => {
        this._waitForReady.push(resolve);

        setImmediate(() => {
          if (this.ready) resolve();
        });

        if (this.ready) resolve();
      });

    if (this.ttlChecking)
      await new Promise(async (resolve) => {
        this._waitForTTL.push(resolve);

        setImmediate(() => {
          if (!this.ttlChecking) resolve();
        });

        if (!this.ttlChecking) resolve();
      });

    const keys = [];
    const deleted = [];
    const indexed = [];
    const length = filters.length;

    filters = [...filters];

    let c = 0;

    while (c < length) {
      if (!this._isObject(filters[c]))
        throw new AkivaDBError("Data must be instanceof Object!", 9);

      await this._check(filters[c]);

      if (filters[c]._index !== undefined) {
        const index = this.indexes[filters[c]._index];

        indexed.push(c);

        if (isNaN(index)) {
          c++;

          continue;
        }

        deleted.push(this.db.cache.get(this.displayName)[index]);
      } else {
        keys.push(Object.keys(filters[c]));
      }

      c++;
    }

    const indexsLength = indexed.length;

    let ind = 0;

    while (ind < indexsLength) {
      filters.splice(indexed[ind], 1);

      ind++;
    }

    const datas = this.db.cache.get(this.displayName);

    if (deleted.length !== length && filters.length) {
      const isDeleted = {};

      if (datas.length >= filters.length) {
        let i = 0;

        while (i < datas.length) {
          let a = 0;

          while (a < filters.length) {
            if (isDeleted[a]) {
              a++;

              continue;
            }

            const b = await Util.isEqual(filters[a], keys[a], datas[i]);

            a++;

            if (!b) continue;

            isDeleted[a] = true;

            deleted.push(datas[i]);

            break;
          }

          i++;
        }
      } else {
        let i = 0;

        while (i < filters.length) {
          if (deleted.length === length) break;

          let a = 0;

          while (a < datas.length) {
            if (isDeleted[a]) {
              a++;

              continue;
            }

            const b = await Util.isEqual(filters[i], keys[i], datas[a]);

            a++;

            if (!b) continue;

            isDeleted[a] = true;

            deleted.push(datas[a]);

            break;
          }

          i++;
        }
      }
    }

    if (!deleted.length) return false;

    if (
      deleted.length === 1 &&
      datas[this.indexes[deleted[0]._index]] === datas.length - 1
    ) {
      this.db.cache.get(this.displayName).pop();

      delete this.indexes[deleted[0]._index];
      delete this.ttls[deleted[0]._index];

      await new Promise((res, rej) => {
        this.writer.promises.push([res, rej]);
        this.writer.emit("exec");
      });

      this.emit("manyDeleted", {...filter});
      return true;
    }

    const indexes = [];
    const ids = [];

    let id = 0;

    while (id < deleted.length) {
      ids.push(deleted[id]._index);
      indexes.push(this.indexes[deleted[id]._index]);

      id++;
    }

    const indexs = Object.entries(this.indexes);
    const newIndexes = {};
    const re = [];

    let i = 0;

    while (i < indexs.length) {
      const index = ids.indexOf(indexs[i][0]);

      if (index >= 0) {
        let idx;

        const reid = re.findIndex((ind) => ind <= indexs[i][1]);

        if (reid < 0) idx = indexs[i][1];
        else idx = indexs[i][1] - (re.length - reid);

        re.push(idx);

        delete this.ttls[indexs[i][0]];

        this.db.cache.get(this.displayName).splice(idx, 1);

        re.sort((a, b) => a - b);

        i++;

        continue;
      }

      const reid = re.findIndex((ind) => ind <= indexs[i][1]);

      if (reid < 0) {
        newIndexes[indexs[i][0]] = indexs[i][1];

        i++;

        continue;
      }

      newIndexes[indexs[i][0]] = indexs[i][1] - (re.length - reid);

      i++;
    }

    this.indexes = newIndexes;

    await new Promise((res, rej) => {
      this.writer.promises.push([res, rej]);
      this.writer.emit("exec");
    });

    return true;
  }

  /**
   * Check the data if it contains function
   * @param {!object} data The data to check
   */
  _check(data) {
    const keys = Object.keys(data);

    let i = 0;

    while (i < keys.length) {
      if (data[keys[i]] instanceof Object) {
        this._check(data[keys[i]]);
      }

      if (typeof data[keys[i]] === "function") {
        throw new AkivaDBError("Function is not allowed!", 7);
      }

      i++;
    }
  }

  _isObject(data) {
    return (
      data instanceof Object &&
      !Buffer.isBuffer(data) &&
      !Array.isArray(data) &&
      !(data instanceof RegExp)
    );
  }
}

module.exports = Collection;
