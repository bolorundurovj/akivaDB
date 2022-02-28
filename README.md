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
		- [Creating a DB](#creating-a-db)
		- [Interacting with the DB](#interacting-with-the-db)
	- [Methods](#methods)
		- [Database Properties](#database-properties)
		- [Database Events](#database-events)
		- [Database Methods](#database-methods)

## About

This is a Lightweight Schema-Free Object-Oriented LocalDatabase for Development and Educational Purposes.

An Object Oriented and Index Based Database. <br>
Fast, Secure, and Easy to use. </br>

## Examples

### Setup

```js
const AkivaDB = require("akivadb");
const users = new AkivaDB({ name: "users", root: "akivadb", inMemory: false });

(async () => {
  await users.insert({
    fullName: "John Doe",
    email: "john.doe@test.com",
  });

  console.log(
    await users.find({
      fullName: "John Doe",
    })
  ); //returns [{ fullName: "John Doe", email: "john.doe@test.com",  _id: "random1234"}]
})();
```

### Creating a DB

```js
const users = new AkivaDB({
  name: "users", //name
  root: "akivadb", //path
  inMemory: false, //memory mode
});
```

### Interacting with the DB

```js
await users.insert({ name: "Joshua" });

const data = await users.findOne({ name: "Joshua" });

console.log(data); //returns { name:"Joshua" }
```

## Methods

### Database Properties

- Database(options) - The constructor of Database
- Database.version - Return current version of akivadb
- Database.name - The name of the Database
- Database.size - The size of the Database
- Database.fileSize - The file size of the Database
- Database.inMemory - The memory mode of the Database

### Database Events

- Database.on('insert', () => void) - Emitted whenever data is inserted.
- Database.on('update', () => void) - Emitted whenever data is updated.
- Database.on('delete', () => void) - Emitted whenever data is deleted.

### Database Methods

- Database.find(query, options) - Finds the data in the Database
- Database.findOne(query, options) - Find one data in the Database
- Database.insert(document, options) - Creates a data in the Database
- Database.deleteOne(query) - Delete a data in the Database
- Database.updateOne(query, update, options) - Update a data in the Database
- Database.deleteMany(query) - Delete some datas in the Database
