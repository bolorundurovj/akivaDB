const { getCollection, saveCollection, setCollection } = require('../database')
const { buildWhere } = require('../utils/whereBuilder')

let deletedRows = 0

const executeDelete = function (params) {
  const { collection, where } = params

  try {
    fDelete(collection, where)

    return `Successfully deleted ${deletedRows} elements`
  } catch (error) {}
}

const fDelete = function (collection, where) {
  const collectionRows = getCollection(collection)

  const updatedCollectionRows = getCollectionRowsAfterDeletion(collectionRows, where)

  saveUpdatedCollectionsToDisk(collection, updatedCollectionRows)
}

const saveUpdatedCollectionsToDisk = function (collection, updatedCollectionRows) {
  setCollection(collection, updatedCollectionRows)
  saveCollection(collection, updatedCollectionRows)
}

const getCollectionRowsAfterDeletion = function (collectionRows, where) {
  const lengthBefore = collectionRows.length.toString()

  if (where !== undefined && Array.isArray(where)) {
    where.forEach((whereObj) => {
      const whereFunction = buildWhere(whereObj)

      collectionRows = collectionRows.filter((e) => !whereFunction(e))
    })
  }

  deletedRows = Number(lengthBefore) - collectionRows.length

  return collectionRows
}

module.exports = {
  name: 'DELETE',
  execute: executeDelete
}