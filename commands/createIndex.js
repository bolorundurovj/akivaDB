const { createIndex } = require("../indexing");

const executeCreateIndex = (params) => {
  try {
    createIndex(params);

    return `Index ${params.name} created sucessfully`;
  } catch (error) {
    return error;
  }
};

module.exports = {
  name: "CREATE INDEX",
  execute: executeCreateIndex,
};
