const {
  getCollection,
  getCollectionMetadata,
  setCollection,
  saveCollection
} = require('../database')

const { getIndex, saveIndex } = require('../indexing')

const { BTreeNode } = require('../btree')

const executeInsertion = function (params) {
  const { document, collection } = params
  console.log(params);

  try {
    insert(document, collection)

    return 'Object inserted with success'
  } catch (error) {
    return error
  }
}

const insert = function (document, collection) {
  // console.log(document, collection);
  const collectionMetadata = getCollectionMetadata(collection)
  console.log(collectionMetadata);

  const insertObj = createInsertObject(collectionMetadata.keys, document)

  insertObjectOnCollection(insertObj, collectionMetadata.name)

  updateCollectionIndexes(insertObj, collectionMetadata)
}

const createInsertObject = function (keys, document) {
  const insertObj = {}
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]

    if (!key.nullable && (document[i] === undefined || document[i] === null) && (document[key.name] === undefined || document[key.name] === null)) {
      throw new Error(`ERROR: ${key.name} can not be empty`)
    }

    insertObj[key] = document[i] || document[key.name]
  }

  return insertObj
}

const insertObjectOnCollection = function (insertObj, collectionName) {
  let collectionRows = getCollection(collectionName)

  collectionRows = [...collectionRows, insertObj]

  setCollection(collectionName, collectionRows)
  saveCollection(collectionName, collectionRows)
}

const updateCollectionIndexes = function (insertObj, collectionMetadata) {
  collectionMetadata.indexes.forEach((indexMetadata) => {
    const indexObj = getIndex(collectionMetadata.name, indexMetadata.name)

    const { columns } = indexMetadata

    const value = insertObj[columns[0]]
    const add = columns.length > 1 ? insertObj[columns[1]] : null

    indexObj.insert(BTreeNode(value, add))

    saveIndex(indexObj, collectionMetadata.name, indexMetadata.name)
  })
}

module.exports = {
  name: 'INSERT',
  execute: executeInsertion
}
