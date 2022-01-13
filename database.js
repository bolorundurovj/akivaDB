const fs = require("fs");
const path = require("path");

let database = {};
const collections = {};

/**
 * Sets the database
 * @author Valiant-Joshua Bolorunduro <bolorundurovb@gmail.com>
 * @param {any} database - The database object.
 * @return {void} - void
 */
const setDatabase = (_database) => {
  database = _database;
};

/**
 * Retrieves the database
 * @author Valiant-Joshua Bolorunduro <bolorundurovb@gmail.com>
 * @return {any} - The database object
 */
const getDatabase = () => {
  return database;
};

/**
 * Retrieves the database name
 * @author Valiant-Joshua Bolorunduro <bolorundurovb@gmail.com>
 * @return {string} - The database name
 */
const getDatabaseName = () => {
  return database.name;
};

const saveDatabase = (_database) => {
  if (_database.name === undefined || _database.name === null) {
    throw new Error("ERROR: database is not initialized");
  }

  if (!fs.existsSync("./akivadb")) {
    fs.mkdir(path.join(__dirname, "akivadb"), (err) => {
      if (err) {
        throw "ERROR: could not create database directory";
      }
    });
  }

  const databasePath = `./akivadb/${_database.name}.akvdb`;

  fs.writeFileSync(databasePath, JSON.stringify(_database));
};

const setCollection = (collectionName, collectionData) => {
  collections[collectionName] = collectionData;
};

const getCollection = (collectionName) => {
  if (collections[collectionName] !== undefined) {
    return collections[collectionName];
  }

  const collectionPath = `./akivadb/${database.name}_${collectionName}.akvdbc`;

  if (fs.existsSync(collectionPath)) {
    const rawCollection = fs.readFileSync(collectionPath);

    const collectionJson = JSON.parse(rawCollection);

    setCollection(collectionName, collectionJson);

    return collectionJson;
  } else {
    throw new Error(
      `ERROR: could not find a collection with name ${collectionName}`
    );
  }
};

const saveCollection = (collectionName, collectionData) => {
  if (collectionName === undefined || collectionName === null) {
    throw new Error("ERROR: collection name cannot be undefined");
  }

  if (collectionData === undefined || collectionData === null) {
    throw new Error("ERROR: collection data cannot be undefined");
  }

  if (database.name === undefined || database.name === null) {
    throw new Error("ERROR: database is not initialized");
  }

  const collectionPath = `./akivadb/${database.name}_${collectionName}.akvdbc`;

  fs.writeFileSync(collectionPath, JSON.stringify(collectionData));
};

const getCollectionMetadata = (collectionName) => {
  const metadata = database.collections.find(
    (collection) =>
      collection.name.toLowerCase() === collectionName.toLowerCase()
  );

  if (metadata === undefined) {
    throw new Error(
      `ERROR: could not find collection with name ${collectionName}`
    );
  }

  return metadata;
};

const setCollectionMetadata = (collectionName, collectionMetadata) => {
  database.collections = database.collections.filter(
    (collection) =>
      collection.name.toLowerCase() !== collectionName.toLowerCase()
  );

  database.collections = [...database.collections, collectionMetadata];

  setDatabase(database);
  saveDatabase(database);
};

module.exports = {
  getDatabase,
  setDatabase,
  saveDatabase,
  getDatabaseName,
  saveCollection,
  getCollection,
  setCollection,
  getCollectionMetadata,
  setCollectionMetadata,
};
