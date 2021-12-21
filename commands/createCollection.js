const {
  getDatabase,
  setDatabase,
  saveDatabase,
  saveCollection,
  setCollection
} = require('../database')

const executeCreateCollection = function (params) {
  const { columns, collection } = params

  try {
    createCollection(columns, collection)

    return `Collection ${collection} created`
  } catch (error) {
    return error
  }
}

const createCollection = function (columns, collection) {
  const database = getDatabase()

  if (collection === 'name') {
    throw new Error("ERROR: you can't create a collection with name 'name', its a reserved word.")
  }

  const columnsArray = createColumnsArray(columns)

  saveCollectionToDisk(collection)

  saveDatabaseToDisk(database, collection, columnsArray)
}

const saveDatabaseToDisk = function (database, collection, columns) {
  database.collections = [
    ...database.collections,
    {
      name: collection,
      keys: columns,
      indexes: []
    }
  ]

  setDatabase(database)
  saveDatabase(database)
}

const saveCollectionToDisk = function (collection) {
  setCollection(collection, [])
  saveCollection(collection, [])
}

const createColumnsArray = function (columns) {
  if (Array.isArray(columns[0])) {
    columns = columns[0]
  }

  columns.map((key) => {
    if (typeof key === 'string') {
      return {
        name: key,
        nullable: false
      }
    }

    return key
  })

  return columns
}

module.exports = {
  name: 'CREATE COLLECTION',
  execute: executeCreateCollection
}
