const fs = require("fs");
const AkivaDBError = require("../utils/ErrorHandler");
const Fns = require("../fns");
const { EventEmitter } = require("events");
const { Readable } = require("stream");

const MAX_SIZE = 1018220;
const WINDOWS = ["win32", "win64"];

class Writer extends EventEmitter {
  constructor(db, collection) {
    super();

    this._waitForReady = [];

    this.run = false;
    this.queue = false;
    this.db = db;
    this.collection = collection;

    this.path = `${this.db.name}/${this.collection.displayName}`;
    this.promises = [];

    super.on("ready", () => {
      this.run = false;

      let i = 0;

      while (i < this._waitForReady.length) {
        const resolve = this._waitForReady.shift();

        resolve();

        i++;
      }
    });

    super.on("exec", async () => {
      if (this.queue) return;

      if (this.run) {
        if (this.queue) return;

        this.queue = true;

        await new Promise((resolve) => {
          this._waitForReady.push(resolve);

          if (!this.run) resolve();

          setImmediate(() => {
            if (!this.run) resolve();
          });
        });
      }

      if (this.collection.closed) return;

      this.run = true;
      this.queue = false;

      const promises = this.promises;

      this.promises = [];

      const data = await this.stringify(
        this.db.cache.get(this.collection.displayName)
      );
      const byteSize = Buffer.byteLength(data[0], "utf8");

      const size = `${byteSize} ${data[1]}`;

      let dir;

      if (!WINDOWS.includes(process.platform)) {
        dir = await fs.promises.open(this.db.name, "r");

        await dir.sync();
      }

      const dbm = await fs.promises
        .open(`${this.path}.akvdb`, "r+")
        .catch((err) => {});

      if (dbm) {
        await dbm.sync();
        await dbm.close();
      }

      const fh = await fs.promises.open(`${this.path}.tmp`, "w");

      const sz = fs.promises.writeFile(`${this.path}.sz`, size);

      const stream = fs.createWriteStream(null, {
        fd: fh.fd,
        autoClose: false,
        encoding: "utf8",
      });

      stream.once("finish", async () => {
        await fh.sync();

        if (dir) {
          await dir.sync();
        }

        await fh.close();

        await sz;

        await fs.promises.rename(`${this.path}.tmp`, `${this.path}.akvdb`);

        if (dir) {
          await dir.sync();
          await dir.close();
        }

        for (const promise of promises) {
          promise[0]();
        }

        this.emit("ready");
      });

      const readable = new Readable({ read: () => {}, encoding: "utf8" });

      readable.pipe(stream);

      readable.push(data[0]);
      readable.push(null);
    });
  }

  /**
   * @param {!Array} data The data
   * @param {!Writable} readable The writable stream
   * @param {!Boolean} isData Wether or not the data is collection data
   * @returns {String}
   */
  async stringify(data) {
    if (!(data instanceof Object))
      throw new AkivaDBError("Data must be an object!", 6);

    const json = await this.jsonStringify(data);

    json[0] = json[0].substring(1, json[0].length - 1);

    return [Fns.encode(json[0]), json[1]];
  }

  approximateSize(obj) {
    let size = 0;

    calc(obj);

    return size;

    function type(d) {
      if (d === null) return 0;

      if ("boolean" === typeof d) return 1;

      if ("number" === typeof d) return 2;

      if ("string" === typeof d) return 3;

      if (d instanceof Date) return 4;

      if (Array.isArray(d)) return 5;

      if ("object" === typeof d) return 6;

      return -1;
    }

    function calc(d, t) {
      if (isNaN(t)) t = type(d);

      if (!isSafe()) return;

      let bytes;

      switch (t) {
        case 0:
          size += 4;

          break;
        case 1:
          size += d ? 4 : 5;

          break;
        case 2:
          if (isNaN(d)) {
            size += 4;

            break;
          }

          bytes = `${d}`.length;

          size += bytes;

          break;
        case 3:
          size += 2;

          bytes = Buffer.byteLength(d);

          size += bytes;

          break;
        case 4:
          size += 2;

          const str = d.toISOString();

          bytes = Buffer.byteLength(str);

          size += bytes;

          break;
        case 5:
          calcArray(d);

          break;
        case 6:
          calcObject(d);

          break;
        default:
      }
    }

    function calcArray(a) {
      size += 2;

      if (!isSafe()) return;

      for (let i = 0; i < a.length; ++i) {
        const t = type(a[i]);

        if (t > -1) {
          calc(a[i], t);

          if (i !== 0 && i < a.length - i) ++size;
        }

        if (!isSafe()) return;
      }
    }

    function calcObject(o) {
      const k = Object.keys(o);

      size += 2;

      if (!isSafe()) return;

      for (let i = 0; i < k.length; ++i) {
        const tk = type(k[i]);
        const tv = type(o[k[i]]);

        if (tk > -1 && tv > -1) {
          calc(k[i], tk);

          ++size;

          calc(o[k[i]], tv);

          if (i !== 0 && i < k.length - i) ++size;
        }

        if (!isSafe()) return;
      }
    }

    function isSafe() {
      return size <= MAX_SIZE;
    }
  }

  async jsonStringify(obj) {
    const size = this.approximateSize(obj);

    if (size > MAX_SIZE) {
      return [await this.db.json.stringify(obj), size];
    } else {
      return [JSON.stringify(obj), size];
    }
  }
}

module.exports = Writer;
