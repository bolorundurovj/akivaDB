const select = require("./commands/select");
const insert = require("./commands/insert");
const createCollection = require("./commands/createCollection");
const using = require("./commands/using");
const deleteCommand = require("./commands/delete");
const update = require("./commands/update");
const bulkInsert = require("./commands/bulkInsert");
const createIndex = require("./commands/createIndex");

const commands = [
  select,
  insert,
  createCollection,
  using,
  deleteCommand,
  update,
  bulkInsert,
  createIndex,
];

module.exports = { commands };
