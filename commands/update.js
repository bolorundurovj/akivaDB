const { getCollection, setCollection, saveCollection } = require("../database");
const { buildWhere } = require("../utils/whereBuilder");

let updatedValues = 0;

const executeUpdate = (params) => {
  const { collection, where, set } = params;

  try {
    updatedValues = 0;
    update(collection, where, set);
    return `Successfully updated ${updatedValues} elements`;
  } catch (error) {
    return error;
  }
};

const update = (collection, where, set) => {
  const collectionRows = getCollection(collection);
  const whereFunctions = createWhereFunctions(where);
  const updatedCollectionRows = getUpdatedRows(
    collectionRows,
    whereFunctions,
    set
  );

  updateDatabase(collection, updatedCollectionRows);
};

const updateDatabase = (collection, updatedCollectionRows) => {
  setCollection(collection, updatedCollectionRows);
  saveCollection(collection, updatedCollectionRows);
};

const getUpdatedRows = (collectionRows, whereFunctions, set) => {
  collectionRows = collectionRows.map((dbObj) => {
    for (let index = 0; index < whereFunctions.length; index++) {
      const whereFunction = whereFunctions[index];

      if (!whereFunction(dbObj)) {
        return dbObj;
      }
    }

    for (let index = 0; index < set.length; index++) {
      dbObj[set[index].key] = set[index].value;
    }

    updatedValues++;

    return dbObj;
  });

  return collectionRows;
};

const createWhereFunctions = (where) => {
  if (!Array.isArray(where)) {
    where = [where];
  }

  return where.map((w) => buildWhere(w));
};

module.exports = {
  name: "UPDATE",
  execute: executeUpdate,
};
