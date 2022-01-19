# AkivaDB

[![NPM Info](https://nodei.co/npm/akivadb.png?downloads=true&stars=true)](https://nodei.co/npm/akivadb)
[![NPM Version](https://img.shields.io/npm/v/akivadb.svg?maxAge=3600)](https://www.npmjs.com/package/akivadb)
[![NPM Downloads](https://img.shields.io/npm/dt/akivadb.svg?maxAge=3600)](https://www.npmjs.com/package/akivadb)


## Table Of Contents
- [AkivaDB](#akivadb)
	- [Table Of Contents](#table-of-contents)
	- [About](#about)
	- [Examples](#examples)
		- [Setup](#setup)
		- [Creating a Collection](#creating-a-collection)
		- [Interacting with the Collection](#interacting-with-the-collection)
	- [Methods](#methods)
		- [Core](#core)
		- [Database](#database)
		- [Collection](#collection)
		- [Collection Data Events](#collection-data-events)


## About
This is a Lightweight Schema-Free Object-Oriented LocalDatabase for Development and Educational Purposes.

An Object Oriented and Index Based Database. <br>
Fast, Secure, and Easy to use. </br>

## Examples

### Setup
```js
const AkivaDB = require('akivadb')
const DB = AkivaDB('database')
const Collection = DB.collection({
	name: "Collection",
	ttl: 15 //optional
})

;(async () => {
	await Collection.insert({
		fullName: "John Doe",
		email: "john.doe@test.com"
	}, {
		_id: "random1234"
	})

	console.log(await Collection.find({
		fullName: "John Doe"
	})) //returns [{ fullName: "John Doe", email: "john.doe@test.com",  _id: "random1234"}]
})()
```

### Creating a Collection
```js
const Collection = DB.collection({
	name: "Collection",
	ttl: 60 //ttl (Time to Live) in seconds
})
```

### Interacting with the Collection
```js
await Collection.insert({ name:"Joshua" })

const data = await Collection.findOne({ name:"Joshua" })

console.log(data) //returns { name:"Joshua" }
```

## Methods

### Core
- Core(name) - The constructor of Database
- Core.version - Return current version of akivadb

### Database
- Database.collection({ name:"string", ttl:15 }) - Method to create a Collection
- Database.isReady - Condition if database is ready to use
- Database.displayName - The name of the Database
- Database.on('ready', () => void) - Emitted whenever the database is ready to use

### Collection
- Collection.db - The main database of the collection
- Collection.displayName - The name of the Collection
- Collection.size - The size of the Collection
- Collection.isOpen - Condition if the Collection is Useable (ready and not closed), Returns Boolean
- Collection.find(filter, limit) - Finds the data in the Collection
- Collection.findOne(filter) - Find one data in the Collection
- Collection.insert(data, filter) - Creates a data in the Collection
- Collection.delete(filter, limit) - Delete a data in the collection
- Collection.update(filter, property, value, object?) - Update a data in the collection
- Collection.deleteMany(...filters) - Delete some datas in the collection
- Collection.close() - Close the collection, the data remains in file
- Collection.destroy() - Destroy the connection between the Collection and delete the data in the Collection
- Collection.on('ready', () => void) - Emitted whenever the collection is ready to use
- Collection.on('ttl', (started: Boolean) => void) - Emitted whenever the ttl checking process is started or ended
- Collection.on('expired', (data: Object) => void) - Emitted whenever a data is expired if ttl is active

### Collection Data Events
- Collection.on('dataInserted', (data) => {void}) - Emitted whenever a data is inserted into the collection
- Collection.on('dataDeleted', (data) => {void}) - Emitted whenever a data is deleted from the collection
- Collection.on('manyDeleted', (data) => {void}) - Emitted whenever batch data is deleted from the collection
- Collection.on('dataUpdated', (data) => {void}) - Emitted whenever a record is updated in the collection