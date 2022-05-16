// Check the processing time for each of the DB operations
const AkivaDB = require("./lib/main").default;
const saved = new AkivaDB({ name: "time", root: "akivadb", inMemory: true });

console.log(
  ` DB Name: ${saved.dbName} \n`,
  `InMemory: ${saved.inMemory}\n`,
  `Memory Mode: ${saved.memoryMode} \n`,
  `DB Version: ${saved.version}\n`
);

// delete all records
(async () => {
  await saved.deleteMany();
})();

/**
 * 1,000 default
 */
let x = 1e3;

let arg = parseInt(process.argv[2]);

if (process.argv[2] && typeof arg === "number") {
  x = arg;
}

console.log(
  "/****************** Test for " + x + " documents(s) inmemory *************/"
);

console.log("File size at beginning : ", saved.size, saved.fileSize);

const arr = Array.from({ length: x }, (a, i) => ({
  title: `Class Arr ${i}`,
  rating: i + 1,
  published: new Date(),
  _id: `${i}`,
}));
let startTime = Date.now();
let hrTime = process.hrtime();
const count = 1;

saved
  .insertMany(arr)
  .then((a) => {
    const diff = process.hrtime(hrTime);
    const duration = diff[0] + diff[1] / 1e9;
    console.log(
      `Time Taken to execute INSERT MANY = ${
        (Date.now() - startTime) / 1000
      } seconds at ${parseInt(count / duration)} ops/sec`
    );
    startTime = Date.now();
    saved
      .find()
      .then((b) => {
        console.log(
          `Time Taken to execute FIND WITHOUT QUERY = ${
            (Date.now() - startTime) / 1000
          } seconds`
        );
        startTime = Date.now();
        saved
          .find({ title: `Class Arr ${x - 1}` })
          .then((c) => {
            console.log(
              `Time Taken to execute FIND WITH QUERY = ${
                (Date.now() - startTime) / 1000
              } seconds`
            );
            startTime = Date.now();
            saved
              .findOne({})
              .then((d) => {
                console.log(
                  `Time Taken to execute FIND ONE WITHOUT QUERY = ${
                    (Date.now() - startTime) / 1000
                  } seconds`
                );
                startTime = Date.now();
                saved
                  .findOne({ title: `Class Arr ${x - 1}` })
                  .then((e) => {
                    console.log(
                      `Time Taken to execute FIND ONE WITH QUERY = ${
                        (Date.now() - startTime) / 1000
                      } seconds`
                    );
                    startTime = Date.now();
                    saved
                      .findOneById(Math.round(x / 2).toString())
                      .then((f) => {
                        console.log(
                          `Time Taken to execute FIND ONE BY ID = ${
                            (Date.now() - startTime) / 1000
                          } seconds`
                        );
                        startTime = Date.now();
                        saved
                          .findById([
                            `1`,
                            Math.round(x / 2).toString(),
                            (x - 1).toString(),
                          ])
                          .then((g) => {
                            console.log(
                              `Time Taken to execute FIND MANY BY ID = ${
                                (Date.now() - startTime) / 1000
                              } seconds`
                            );
                            startTime = Date.now();
                            saved
                              .updateOne(
                                { _id: "1" },
                                { rating: "AkivaDB is awesome" }
                              )
                              .then((h) => {
                                console.log(
                                  `Time Taken to execute UPDATE ONE = ${
                                    (Date.now() - startTime) / 1000
                                  } seconds`
                                );
                                startTime = Date.now();
                                saved
                                  .updateMany(
                                    { _id: "1" },
                                    { rating: "AkivaDB is awesome" }
                                  )
                                  .then((i) => {
                                    console.log(
                                      `Time Taken to execute UPDATE MANY = ${
                                        (Date.now() - startTime) / 1000
                                      } seconds`
                                    );
                                    startTime = Date.now();
                                    saved
                                      .updateOneById("1", {
                                        rating: "AkivaDB is awesome",
                                      })
                                      .then((j) => {
                                        console.log(
                                          `Time Taken to execute UPDATE ONE BY ID = ${
                                            (Date.now() - startTime) / 1000
                                          } seconds`
                                        );
                                        startTime = Date.now();
                                        saved
                                          .updateById(
                                            [
                                              "1",
                                              Math.round(x / 2).toString(),
                                              (x - 1).toString(),
                                            ],
                                            {
                                              rating: "AkivaDB is awesome",
                                            }
                                          )
                                          .then((k) => {
                                            console.log(
                                              `Time Taken to execute UPDATE MANY BY ID = ${
                                                (Date.now() - startTime) / 1000
                                              } seconds`
                                            );
                                            startTime = Date.now();
                                          })
                                          .then(() => {
                                            console.log(
                                              "File size at end : ",
                                              saved.size,
                                              saved.fileSize
                                            );

                                            console.log(
                                              "/****************** Test for " +
                                                x +
                                                " documents(s) inmemory *************/\n\n"
                                            );
                                          })
                                          .catch((err) => {
                                            console.error(err);
                                          });
                                      })
                                      .catch((err) => {
                                        console.error(err);
                                      });
                                  })
                                  .catch((err) => {
                                    console.error(err);
                                  });
                              })
                              .catch((err) => {
                                console.error(err);
                              });
                          })
                          .catch((err) => {
                            console.error(err);
                          });
                      })
                      .catch((err) => {
                        console.error(err);
                      });
                  })
                  .catch((err) => {
                    console.error(err);
                  });
              })
              .catch((err) => {
                console.error(err);
              });
          })
          .catch((err) => {
            console.error(err);
          });
      })
      .catch((err) => {
        console.error(err);
      });
  })
  .catch((err) => {
    console.error(err);
  });

// process.exit();
