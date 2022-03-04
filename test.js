const AkivaDB = require("./lib/main").default;

const classes = new AkivaDB({
  name: "classes",
  root: "akivadb",
  inMemory: false,
});
console.log(
  "classes db",
  classes.name,
  classes.size,
  classes.memoryMode,
  classes.fileSize,
  classes.version
);

let updateObj = { _id: "classes" };

classes.on("insert", (x) => {
  updateObj = x;
  console.log(x._id, "insert");
});
classes.on("delete", (x) => {
  console.log(x._id, "delete");
});
classes.on("update", (x) => {
  console.log(x._id, "update");
});

let y,
  x = 10;
while (x > 0) {
  classes
    .insert({
      name: `Class ${x}`,
      students: x + Math.round(Math.random() * 1e15),
      createdAt: new Date(),
    })
    .then((a) => {
      // console.log(a);
    });
  x--;
}

let arr = Array.from({ length: y }, (x, i) => ({
  name: `Class ${y}`,
  students: i + 1,
  createdAt: new Date(),
}));

(async () => {
  await classes.insertMany(arr);
})();

classes.findById([updateObj._id, "17f2b11272c43d62ce7b716"]).then((x) => {
  console.log(x);
});

classes
  .findOne({ $string: { name: "class" } }, { projection: ["name", "_id"] })
  .then((c) => {
    console.log(c);
  });

// classes.find().then(c => {
//     console.log(c);
// })

updateObj.name = `Jane Doe - new`;
classes.updateById(updateObj._id, updateObj).then((a) => {
  // console.log(a);
});

classes.deleteOneById("17f37d00d29117e5d0ce35").then((x) => {
  console.log(x);
});

classes
  .deleteById(["17f37d00d29117e5d0ce35", "17f37c694052c36340add59"])
  .then((x) => {
    console.log(x);
  });

classes
  .deleteById(["17f37d00d29117e5d0ce35", "17f37c694052c36340add59"])
  .then((x) => {
    // console.log(x);
  });

classes.deleteOne({ name: "Class 10" }).then((x) => {
  console.log(x);
});

// classes.deleteMany().then(x => {
//     // console.log(x);
// })

// classes.drop()
