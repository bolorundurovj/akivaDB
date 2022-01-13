const { setDatabase, saveDatabase } = require("../database");

const fs = require("fs");

const executeUsing = (params) => {
  const databaseName = params;
  try {
    return using(databaseName);
  } catch (error) {
    return error;
  }
};

const using = (databaseName) => {
  const databasePath = `./akivadb/${databaseName}.akvdb`;

  if (fs.existsSync(databasePath)) {
    loadDatabaseFromDisk(databasePath);

    return `Database ${databaseName} loaded.`;
  } else {
    createNewDatabase(databaseName);
    return `new database, with name ${databaseName}, created.`;
  }
};

const loadDatabaseFromDisk = (databasePath) => {
  const rawDatabase = fs.readFileSync(databasePath);

  const databaseJSON = JSON.parse(rawDatabase);

  setDatabase(databaseJSON);
};

const createNewDatabase = (databaseName) => {
  const newDatabase = { name: databaseName, collections: [] };
  setDatabase(newDatabase);
  saveDatabase(newDatabase);
};

module.exports = {
  name: "USING",
  execute: executeUsing,
};
