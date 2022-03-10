const AkivaDB = require("../../lib/main").default;
const Benchmarkify = require("benchmarkify");

const benchmark = new Benchmarkify("Benchmarks").printHeader();

const suite = benchmark.createSuite("Benchmark OPS");
const db = new AkivaDB({
  name: "benchmark",
  root: "testdbs",
});

console.group("\nBenchmark");
suite
  .add("insert()", async (done) => {
    await db.insert({ name: Math.random().toFixed(3) });
    done();
  })
  .add("deleteOne()", async (done) => {
    await db.deleteOne({ name: Math.random().toFixed(3) });
    done();
  })
  .add("deleteMany()", async (done) => {
    await db.deleteMany({});
    done();
  })
  .add("insertMany()", async (done) => {
    await db.insertMany(
      Array.from({ length: 2 }, (x, i) => ({
        name: `Class ${i}`,
      }))
    );
    done();
  })
  .add("findOneById()", async (done) => {
    await db.findOneById("2");
    done();
  })
  .add("findById()", async (done) => {
    await db.findById(Array.from({ length: 10 }, (_, i) => `${i + 1}`));
    done();
  })
  .add("findOne()", async (done) => {
    await db.findOne({ name: Math.random().toFixed(3) });
    done();
  })
  .add("find()", async (done) => {
    await db.find({ name: Math.random().toFixed(3) });
    done();
  })
  .add("updateOneById()", async (done) => {
    await db.updateOneById("1", { name: Math.random().toFixed(3) });
    done();
  })
  .add("updateById()", async (done) => {
    await db.updateById(
      Array.from({ length: 10 }, (_, i) => `${i + 1}`),
      { name: Math.random().toFixed(3) }
    );
    done();
  })
  .add("updateOne()", async (done) => {
    await db.updateOne({ name: Math.random().toFixed(3) }, { name: 111 });
    done();
  })
  .add("updateMany()", async (done) => {
    await db.updateMany({ name: Math.random().toFixed(3) }, { name: 111 });
    done();
  })
  .add("deleteOneById()", async (done) => {
    await db.deleteOneById("2");
    done();
  })
  .add("deleteById()", async (done) => {
    await db.deleteById(Array.from({ length: 10 }, (_, i) => `${i + 1}`));
    done();
  })
  .run();
