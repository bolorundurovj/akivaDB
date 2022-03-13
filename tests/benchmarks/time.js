// Check the processing time for each of the DB operations
const AkivaDB = require("../../lib/main").default;
const saved = new AkivaDB({ name: "saved", root: "akivadb", inMemory: false });
const inmemory = new AkivaDB({
  name: "inmemory",
  root: "akivadb",
  inMemory: true,
});

// delete all records
(async () => {
  await saved.drop();
  await inmemory.deleteMany();
})();

console.log(
  ` DB Name: ${saved.dbName} \n`,
  `InMemory: ${saved.inMemory}\n`,
  `Memory Mode: ${saved.memoryMode} \n`,
  `DB Version: ${saved.version}\n`
);

/**
 * 1,000 default
 */
let x = 1e3;

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
  (async () => {
    await saved.insert({
      title: "AkivaDB rocks " + i,
      published: "today " + i,
      rating: "5 stars " + i,
      _id: `${i}`,
    });
  })();
}
console.timeEnd(x + " : Insert(s)");

console.time(x + " : Delete");
saved.deleteMany().then((x) => {
  console.log(x);
});
console.timeEnd(x + " : Delete");

console.time(x + " : Insert Many");
let arr = Array.from({ length: x }, (a, i) => ({
  title: `Class Arr ${x}`,
  rating: i + 1,
  published: new Date(),
  _id: `arr${i}`,
}));
(async () => {
  await saved.insertMany(arr);
})();
console.timeEnd(x + " : Insert Many");

console.time(x + " : Find without query");
(async () => {
  await saved.find({});
})();
console.timeEnd(x + " : Find without query");

console.time(x + " : Find with query");
(async () => {
  await saved.find({ title: "AkivaDB rocks 1" });
})();
console.timeEnd(x + " : Find with query");

console.time(x + " : Find One without query");
(async () => {
  await saved.findOne({});
})();
console.timeEnd(x + " : Find One without query");

console.time(x + " : Find One with query");
(async () => {
  await saved.findOne({ title: "AkivaDB rocks 50" });
})();
console.timeEnd(x + " : Find One with query");

console.time(x + " : Find One by ID");
(async () => {
  await saved.findOneById(x / 2);
})();
console.timeEnd(x + " : Find One by ID");

console.time(x + " : Find Many by ID");
(async () => {
  await saved.findById([1, x / 2, x]);
})();
console.timeEnd(x + " : Find Many by ID");

console.time(x + " : Update One");
(async () => {
  await saved.updateOne({ _id: "1" }, { rating: "AkivaDB is awesome" });
})();
console.timeEnd(x + " : Update One");

console.time(x + " : Update Many");
(async () => {
  await saved.updateMany(
    { title: "AkivaDB rocks 10" },
    { rating: "AkivaDB is awesome" }
  );
})();
console.timeEnd(x + " : Update Many");

console.log("File size at end : ", saved.size, saved.fileSize);

console.log(
  "/****************** Test for " +
    x +
    " documents(s) persisted *************/\n\n"
);

console.log(
  ` DB Name: ${inmemory.dbName} \n`,
  `InMemory: ${inmemory.inMemory}\n`,
  `Memory Mode: ${inmemory.memoryMode} \n`,
  `DB Version: ${inmemory.version}\n`
);

console.log(
  "/****************** Test for " + x + " documents(s) inmemory *************/"
);

console.log("File size at beginning : ", inmemory.size, inmemory.fileSize);

console.time(x + " : Insert(s)");
for (var i = 0; i < x; i++) {
  (async () => {
    await inmemory.insert({
      title: "AkivaDB rocks " + i,
      published: "today " + i,
      rating: "5 stars " + i,
      _id: `${i}`,
    });
  })();
}
console.timeEnd(x + " : Insert(s)");

console.time(x + " : Insert Many");
(async () => {
  await inmemory.insertMany(arr);
})();
console.timeEnd(x + " : Insert Many");

console.time(x + " : Find without query");
(async () => {
  await inmemory.find({});
})();
console.timeEnd(x + " : Find without query");

console.time(x + " : Find with query");
(async () => {
  await inmemory.find({ title: "AkivaDB rocks 1" });
})();
console.timeEnd(x + " : Find with query");

console.time(x + " : Find One without query");
(async () => {
  await inmemory.findOne({});
})();
console.timeEnd(x + " : Find One without query");

console.time(x + " : Find One with query");
(async () => {
  await inmemory.findOne({ title: "AkivaDB rocks 1" });
})();
console.timeEnd(x + " : Find One with query");

console.time(x + " : Find One by ID");
(async () => {
  await inmemory.findOneById(x / 2);
})();
console.timeEnd(x + " : Find One by ID");

console.time(x + " : Find Many by ID");
(async () => {
  await inmemory.findById([1, x / 2, x]);
})();
console.timeEnd(x + " : Find Many by ID");

console.time(x + " : Update One");
(async () => {
  await inmemory.updateOne(
    { title: "AkivaDB rocks 1" },
    { _id: "1", rating: "AkivaDB is awesome" }
  );
})();
console.timeEnd(x + " : Update One");

console.log("File size at end : ", inmemory.size, inmemory.fileSize);

console.log(
  "/****************** Test for " +
    x +
    " documents(s) inmemory *************/\n\n"
);

process.exit();
