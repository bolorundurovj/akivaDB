const {
  getCollection,
  getCollectionMetadata,
  setCollection,
  saveCollection,
} = require("../database");

const executeBulkInsert = (params) => {
  const { documents, collection } = params;

  try {
    bulkInsert(documents, collection);
    return "Objects inserted successfully";
  } catch (error) {
    return error;
  }
};

const bulkInsert = (documents, collection) => {
  const collectionMetadata = getCollectionMetadata(collection);

  const collectionRows = getCollection(collection);

  const insertDocuments = createInsertDocuments(
    collectionMetadata.keys,
    documents
  );

  const newCollectionRows = [...collectionRows, ...insertDocuments];

  saveCollectionToDisk(collection, newCollectionRows);
};

const saveCollectionToDisk = (collection, collectionRows) => {
  setCollection(collection, collectionRows);
  saveCollection(collection, collectionRows);
};

const createInsertDocuments = (keys, documents) => {
  const insertDocuments = [];
  console.log(keys);

  documents.forEach((document) => {
    console.log(document);
    const insertObj = {};

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (
        !key.nullable &&
        (document[i] === undefined || document[i] === null) &&
        (document[key] === undefined || document[key] === null)
      ) {
        throw new Error(`ERROR: ${key} can not be empty`);
      }

      insertObj[key] = document[i] || document[key];
      console.log(insertObj);
    }

    insertDocuments.push(insertObj);
  });

  return insertDocuments;
};

module.exports = {
  name: "BULK INSERT",
  execute: executeBulkInsert,
};
