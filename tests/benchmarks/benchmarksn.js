const benchmark = require("nodemark");
const { async } = require("nodemark/lib/benchmark");

const AkivaDB = require("../../lib/main").default;
const db = new AkivaDB({ name: "aaa", root: process.cwd(), inMemory: true });

console.log("Memory Mode: ", db.memoryMode);

const insert = async () => {
  await db.insert({ name: Math.random().toFixed(3) });
};

const insertMany = async () => {
  await db.insertMany(
    Array.from({ length: 2 }, (x, i) => ({
      name: `Class ${i}`,
    }))
  );
};

console.log(`insert() ${benchmark(insert)}`);
console.log(`insertMany() ${benchmark(insertMany)}`);

process.exit();
