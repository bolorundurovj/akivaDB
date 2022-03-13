const { Suite } = require("benchmark");

const AkivaDB = require("../../lib/main").default;

const suite = new Suite();
const db = new AkivaDB();

console.log("Memory Mode: ", db.memoryMode);

console.group("\nBenchmark");
suite
  .add("insert()", async () => {
    await db.insert({ name: Math.random().toFixed(3) });
  })
  .add("deleteOne()", async () => {
    await db.deleteOne({ name: Math.random().toFixed(3) });
  })
  .add("deleteMany()", async () => {
    await db.deleteMany({});
  })
  .add("insertMany()", async () => {
    await db.insertMany(
      Array.from({ length: 2 }, (x, i) => ({
        name: `Class ${i}`,
      }))
    );
  })
  .add("findOneById()", async () => {
    await db.findOneById("2");
  })
  .add("findById()", async () => {
    await db.findById(Array.from({ length: 10 }, (_, i) => `${i + 1}`));
  })
  .add("findOne()", async () => {
    await db.findOne({ name: Math.random().toFixed(3) });
  })
  .add("find()", async () => {
    await db.find({ name: Math.random().toFixed(3) });
  })
  .add("updateOneById()", async () => {
    await db.updateOneById("1", { name: Math.random().toFixed(3) });
  })
  .add("updateById()", async () => {
    await db.updateById(
      Array.from({ length: 10 }, (_, i) => `${i + 1}`),
      { name: Math.random().toFixed(3) }
    );
  })
  .add("updateOne()", async () => {
    await db.updateOne({ name: Math.random().toFixed(3) }, { name: 111 });
  })
  .add("updateMany()", async () => {
    await db.updateMany({ name: Math.random().toFixed(3) }, { name: 111 });
  })
  .add("deleteOneById()", async () => {
    await db.deleteOneById("2");
  })
  .add("deleteById()", async () => {
    await db.deleteById(Array.from({ length: 10 }, (_, i) => `${i + 1}`));
  })
  .on("cycle", (event) => console.log(String(event.target)))
  .on("complete", function () {
    console.log("Fastest is " + this.filter("fastest").map("name"));
    console.log("Slowest is " + this.filter("slowest").map("name"));
  })
  .run();

process.exit();
