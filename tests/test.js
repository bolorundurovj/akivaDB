const ls = require("../lib");
const db = ls("database");
const {EventEmitter} = require("events")
const ee = new EventEmitter();
const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

console.log(`${ram}MB`);

console.log(ls.version);

db.once("ready", async () => {
  console.log("Session Ready!");

  const col = db.collection({
    name: "azwu",
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

  while (i < 5e3) {
    col.set(
      {
        variable: "aabbccddeeffgghhii",
        varID: `${Math.floor(Math.random() * 259153813599)}`,
      },
      { _index: i }
    );

    ++i;
  }

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
