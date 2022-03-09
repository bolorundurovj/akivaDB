const { Suite } = require("benchmark");

const AkivaDB = require("../lib/main").default;

const suite = new Suite();
const db = new AkivaDB();

console.group("\nBenchmark");
suite
  .add("insert()", async () => {
    await db.insert({ r: Math.random().toFixed(3) });
  })
  .add("find()", async () => {
    await db.find({ r: Math.random().toFixed(3) });
  })
  .add("update()", async () => {
    await db.updateOne({ r: Math.random().toFixed(3) });
  })
  .add("delete()", async () => {
    await db.deleteOne({ r: Math.random().toFixed(3) });
  })
  .on("cycle", (event) => console.log(String(event.target)))
  .on("complete", function () {
    console.log("Fastest is " + this.filter("fastest").map("name"));
    console.log("Slowest is " + this.filter("slowest").map("name"));
  })
  .run();
