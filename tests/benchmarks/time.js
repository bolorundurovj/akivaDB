// Check the processing time for each of the DB operations
const AkivaDB = require("../../lib/main").default;
const saved = new AkivaDB({ name: "saved", root: "akivadb", inMemory: false });
const inmemory = new AkivaDB({
  name: "inmemory",
  root: "akivadb",
  inMemory: true,
});

let ID = "inmemory";
let IDS = [];

// delete all records
(async () => {
  await saved.drop();
  await inmemory.deleteMany();
})();

let dumpData = (value) => {
    console.log(value)
}

console.log(saved.dbName, saved.inMemory, saved.memoryMode, saved.version);

/**
 * 1,000,000 default
 */
let x = 1e6;

let arg = parseInt(process.argv[2]);

if (process.argv[2] && typeof arg === "number") {
  x = arg;
}

console.log(
  "/****************** Test for " + x + " documents(s) persisted *************/"
);

console.log("File size at beginning : ", saved.size, saved.fileSize);

console.time(x + " : Insert(s)");
for (var i = 0; i < x; i++) {
  // (async () => {
  //     await saved.insert({
  //         title: "AkivaDB rocks " + i,
  //         published: "today " + i,
  //         rating: "5 stars " + i,
  //     });
  // })();
  saved
    .insert({
      title: "AkivaDB rocks " + i,
      published: "today " + i,
      rating: "5 stars " + i,
    })
    .then((x) => {
      console.log(1);
      ID = x._id;
      IDS.push(x._id);
    })
    .catch((err) => {
      console.error(err);
    });
}
console.timeEnd(x + " : Insert(s)");

console.time(x + " : Insert Many");
let arr = Array.from({ length: x }, (a, i) => ({
  name: `Class ${x}`,
  students: i + 1,
  createdAt: new Date(),
}));
// saved.insertMany(arr).then((s) => {
//     console.log(s);
// })
async () => {
  await saved.insertMany(arr);
};
console.timeEnd(x + " : Insert Many");

console.time(x + " : Find without query");
(async () => {
  let resp = await saved.find({});
  console.log(resp);
})();
console.timeEnd(x + " : Find without query");

console.time(x + " : Find with query");
(async () => {
  let resp = await saved.find({ title: "AkivaDB rocks 1" });
  console.log(resp);
})();
console.timeEnd(x + " : Find with query");

console.time(x + " : Find One without query");
(async () => {
  await saved.findOne({});
})();
console.timeEnd(x + " : Find One without query");

console.time(x + " : Find One with query");
(async () => {
  await saved.findOne({ title: "AkivaDB rocks 1" });
})();
console.timeEnd(x + " : Find One with query");

console.time(x + " : Find One by ID");
(async () => {
  let a = await saved.findOneById(ID);
  console.log(a);
})();
console.timeEnd(x + " : Find One by ID");

console.time(x + " : Find Many by ID");
(async () => {
  let a = await saved.findById([...IDS]);
  console.log(a);
})();
console.timeEnd(x + " : Find Many by ID");

console.time(x + " : Update");
(async () => {
  await saved.update(
    { title: "AkivaDB rocks 1" },
    "title",
    "AkivaDB is awesome"
  );
})();
console.timeEnd(x + " : Update");

console.log("File size at end : ", saved.size, saved.fileSize);

console.log(
  "/****************** Test for " + x + " documents(s) *************/\n\n"
);

process.exit();
