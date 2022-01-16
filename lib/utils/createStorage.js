const fs = require("fs");

function createStorage(name) {
  return new Promise(async (resolve, reject) => {
    try {
      const stat = await fs.promises.stat(name);
      if (!stat.isDirectory()) throw new Error("Not a dir!");
    } catch {
      await fs.promises.mkdir(name).catch(reject);
    }

    resolve(name);
  });
}

module.exports = createStorage;
