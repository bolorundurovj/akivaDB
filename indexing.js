const {
	getCollection,
	getDatabaseName,
	getCollectionMetadata,
	setCollectionMetadata,
} = require("./database");

const { DatabaseFileToIndexBTree, IndexJsonToBTree } = require("./btree");

const fs = require("fs");

indexes = {};

const getIndex = function (collectionName, indexName) {
	if (indexes[`${collectionName}_${indexName}`] !== undefined) {
		return indexes[`${collectionName}_${indexName}`];
	}

	indexPath = `./${getDatabaseName()}_${collectionName}_${indexName}.akvdbi`;

	if (fs.existsSync(indexPath)) {
		const rawIndex = fs.readFileSync(indexPath);

		const indexJson = JSON.parse(rawIndex);

		indexes[`${collectionName}_${indexName}`] = IndexJsonToBTree(indexJson);

		return IndexJsonToBTree(indexJson);
	} else {
		throw `ERROR: could not find an index with name ${indexName}`;
	}
};

const createIndex = function (indexOptions) {
	let { columns, collection, name } = indexOptions;

	let rows = getCollection(collection);

	let btreeIndex;

	if (columns.length > 1) {
		btreeIndex = DatabaseFileToIndexBTree(rows, columns[0], columns[1]);
	} else {
		btreeIndex = DatabaseFileToIndexBTree(rows, columns[0], null);
	}

	saveIndex(btreeIndex, collection, name);

	let collectionMetadata = getCollectionMetadata(collection);

	collectionMetadata.indexes = [
		...collectionMetadata.indexes,
		{ name: name, columns: columns },
	];

	setCollectionMetadata(collection, collectionMetadata);
};

const saveIndex = function (btreeIndex, collection, name) {
	if (collection === undefined || collection === null) {
		throw "ERROR: collection cannot be undefined";
	}

	if (name === undefined || name === null) {
		throw "ERROR: index name cannot be undefined";
	}

	const serializedBtree = btreeIndex.toIndexJson();

	const indexPath = `./${getDatabaseName()}_${collection}_${name}.akvdbi`;

	fs.writeFileSync(indexPath, JSON.stringify(serializedBtree));
};

module.exports = { createIndex, getIndex, saveIndex };
