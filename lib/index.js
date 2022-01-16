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

/**
 * A function to transfer chson file into new encrypted file
 * @param {!string} dbName The database name
 * @param {!string} colName The collection name
 * @returns {Promise<Boolean>}
 */
async function deprecated(dbName, colName) {
  const dbExist = await FS.promises.stat(dbName).catch((err) => {});

  if (!dbExist || !dbExist.isDirectory()) return false;

  const db = {
    name: dbName,
    cache: new Map(),
    json: Json,
  };

  const collection = {
    name: `${colName}.akvdb`,
    displayName: colName,
    indexes: {},
    ttls: {},
  };

  const writer = new BaseWriter(db, collection);

  const exist = {};

  const dataExist = await FS.promises
    .stat(`${db.name}/${collection.displayName}.chson`)
    .catch((err) => {});

  if (!dataExist || !dataExist.isFile()) return false;

  exist["data"] = true;

  const metaExist = await FS.promises
    .stat(`${db.name}/${collection.displayName}.chmeta`)
    .catch((err) => {});

  if (metaExist && metaExist.isFile()) exist["meta"] = true;

  const ttlExist = await FS.promises
    .stat(`${db.name}/${collection.displayName}.chttl`)
    .catch((err) => {});

  if (ttlExist && ttlExist.isFile()) {
    exist["ttl"] = true;
    collection["ttl"] = 15;
  }

  const length = Object.keys(exist).length - 1;

  await new Promise(async (resolve, reject) => {
    const parallel = new EventEmitter();

    parallel.on("finish", async (data) => {
      if (data === length) {
        parallel.removeAllListeners();

        resolve();
      }
    });

    let finished = 0;

    const dataStream = FS.createReadStream(
      `${db.name}/${collection.displayName}.chson`,
      "utf8"
    );

    let data = "";

    dataStream.on("data", (chunk) => {
      data += chunk;
    });

    dataStream.once("end", async () => {
      if (!data.length) {
        db.cache.set(collection.displayName, []);

        return parallel.emit("finish", finished++);
      }

      data = await Bison.splitArray(data.split(" "), 16384);

      let i = 0;
      let newString = "";

      while (i < data.length) {
        newString += String.fromCharCode(...data[i]);

        i++;
      }

      const json = await new Promise(async (resolveJSON) => {
        try {
          resolveJSON(await Json.parse(`[${newString}]`));
        } catch {
          reject(
            new AkivaDBError(
              `Error while parsing json: ${collection.displayName}.chson`,
              3
            )
          );
        }
      });

      db.cache.set(collection.displayName, json);

      parallel.emit("finish", finished++);
    });

    if (exist["meta"]) {
      const metaStream = FS.createReadStream(
        `${db.name}/${collection.displayName}.chmeta`,
        "utf8"
      );

      let meta = "";

      metaStream.on("data", (chunk) => {
        meta += chunk;
      });

      metaStream.once("end", async () => {
        if (!meta.length) return parallel.emit("finish", finished++);

        meta = await Bison.splitArray(meta.split(" "), 16384);

        let i = 0;
        let newMeta = "";

        while (i < meta.length) {
          newMeta += String.fromCharCode(...meta[i]);

          i++;
        }

        const metaJSON = await new Promise(async (resolveJSON) => {
          try {
            resolveJSON(await Json.parse(`{${newMeta}}`));
          } catch {
            reject(
              new AkivaDBError(
                `Error while parsing json: ${collection.displayName}.chmeta`,
                3
              )
            );
          }
        });

        collection.indexes = metaJSON;

        parallel.emit("finish", finished++);
      });
    }

    if (exist["ttl"]) {
      const ttlStream = FS.createReadStream(
        `${db.name}/${collection.displayName}.chttl`,
        "utf8"
      );

      let ttl = "";

      ttlStream.on("data", (chunk) => {
        ttl += chunk;
      });

      ttlStream.once("end", async () => {
        if (!ttl.length) return parallel.emit("finish", finished++);

        ttl = await Bison.splitArray(ttl.split(" "), 16384);

        let i = 0;
        let newTTL = "";

        while (i < ttl.length) {
          newTTL += String.fromCharCode(...ttl[i]);

          i++;
        }

        const ttlJSON = await new Promise(async (resolveJSON) => {
          try {
            resolveJSON(await Json.parse(`{${newTTL}}`));
          } catch {
            reject(
              new AkivaDBError(
                `Error while parsing json: ${collection.displayName}.chttl`,
                3
              )
            );
          }
        });

        collection.ttls = ttlJSON;

        parallel.emit("finish", finished++);
      });
    }
  });

  await new Promise((res, rej) => {
    writer.promises.push([res, rej]);
    writer.emit("exec");
  });

  return true;
}

module.exports = database;
module.exports.deprecated = deprecated;
module.exports.version = require("../package.json").version;
