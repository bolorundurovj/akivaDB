const { getCollection, getCollectionMetadata } = require('../database')
const { getIndex } = require('../indexing')
const { buildWhere } = require('../utils/whereBuilder')
const {
  buildIndexComparingFunction,
  buildIndexBlockingFunction
} = require('../utils/indexingFunctionsBuilder')

const executeSelect = function (params) {
  const { columns, collection, where } = params

  try {
    return select(columns, collection, where || [])
  } catch (error) {
    return error
  }
}

const select = function (columns, collection, where) {
  const keys = buildKeysArray(columns)

  if (keys.length === 0 || where.length > 1) {
    return fullCollectionSearch(collection, keys, where)
  }

  const index = getAppropriateIndex(collection, keys, where)

  if (index !== undefined && where.length === 1) {
    return indexSearch(collection, where, index)
  }

  return fullCollectionSearch(collection, keys, where)
}

const fullCollectionSearch = function (collection, keys, where) {
  const collectionRows = getCollection(collection)

  if (keys.length === 0 && where.length === 0) {
    return collectionRows
  }

  let whereFiltered = [...collectionRows]

  if (where !== undefined && Array.isArray(where)) {
    where.forEach((whereObj) => {
      const whereFunction = buildWhere(whereObj)

      whereFiltered = whereFiltered.filter(whereFunction)
    })
  }

  if (keys.length === 0) {
    return whereFiltered
  }

  const result = whereFiltered.map((data) => {
    const row = {}

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      row[key] = data[key]
    }

    return row
  })

  return result
}

const buildKeysArray = function (columns) {
  if (columns === 'star') {
    return []
  }

  if (Array.isArray(columns)) {
    return columns
  } else {
    return [columns]
  }
}

const getAppropriateIndex = function (collection, keys, where) {
  const metadata = getCollectionMetadata(collection)

  for (let j = 0; j < metadata.indexes.length; j++) {
    const index = metadata.indexes[j]

    if (index.columns.length < keys.length) {
      continue
    }

    let useIndex = true

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]

      if (index.columns.find((column) => column.toLowerCase() === key) === undefined) {
        useIndex = false

        continue
      }
    }

    for (let i = 0; i < where.length; i++) {
      const whereObj = where[i]

      const key = whereObj.key

      if (
        index.columns.find((column) => column.toLowerCase() === key) ===
        undefined
      ) {
        useIndex = false
        continue
      }
    }

    if (useIndex) {
      return index
    }
  }

  return undefined
}

const indexSearch = function (collection, where, index) {
  const indexBtree = getIndex(collection, index.name)

  const comparingFunction = buildIndexComparingFunction(where[0])
  const blockingFunction = buildIndexBlockingFunction(where[0])

  const values = indexBtree.search(comparingFunction, blockingFunction)

  return values
}

module.exports = {
  name: 'SELECT',
  execute: executeSelect
}
