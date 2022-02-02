const AkivaDB = require("../lib");
const { generateUIDWithCollisionChecking } = require("../lib/utils/idGenerator");
const db = AkivaDB("database");
const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

console.log(`${ram}MB`);

console.log(AkivaDB.version);

db.once("ready", async () => {
  console.log("Session Ready!");

  const col = db.collection({
    name: "test",
  });
  const now = Date.now();

  if (!col.ready)
    await new Promise((res) => {
      col._waitForReady.push(res);

      if (col.ready) res();

      setImmediate(() => {
        if (col.ready) res();
      });
    });

  const read = Date.now();

  console.log(`${read - now}ms`);

  console.log(`Database Connected: ${col.displayName}`);

  console.log(col.size);

  let i = 0;

  col.on("dataInserted", (data) => {
    console.log(data);
  })

  while (i < 10) {
    col.insert(
      {
        variable: "aabbccddeeffgghhii",
        varID: generateUIDWithCollisionChecking(),
      }
    );

    ++i;
  }

  col.find({}).then((x) => {
    console.log(x);
  }).catch((err) => {
    console.log(err);
  })

  col.findOne({ _id: '9ea95u' }).then((x) => {
    console.log(x);
  }).catch((err) => {
    console.log(err);
  })

  const done = Date.now();

  console.log(`${done - read}ms`);

  console.log(`${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)}MB`);

  console.log(
    `${(
      100 *
      ((process.cpuUsage().user + process.cpuUsage().system) /
        (process.uptime() * 1000 * 1000))
    ).toFixed(2)}%`
  );

  process.once("beforeExit", () => {
    const writeTime = Date.now() - done;

    console.log(`${writeTime}ms`);
    console.log(`${read - now + done - read + writeTime}ms`);
  });
});
