// Check the processing time for each of the DB operations with load
const AkivaDB = require('../../lib');
let db = AkivaDB("database");

(async () => {
    db = await db.getDB();
    console.log(db.name, db.isReady, collection.name, collection.ready);
})()

const collection = db.collection({
    name: "test"
});

// delete all records
(async () => {
    await collection.deleteMany({});
})()

let x = 1e6;

let arg = parseInt(process.argv[2]);

if (process.argv[2] && typeof (arg) === "number") {
    x = arg;
}


console.log('/****************** Test for ' + x + ' documents(s) *************/');

console.time(x + ' : Insert(s)');
for (var i = 0; i < x; i++) {
    (async () => {
        await collection.insert({
            title: 'AkivaDB rocks ' + i,
            published: 'today ' + i,
            rating: '5 stars ' + i
        }, { _id: i })
    })()
};
console.timeEnd(x + ' : Insert(s)');

console.time(x + ' : Find without query');
(async () => {
    let resp = await collection.find({});
    console.log(resp);
})()
console.timeEnd(x + ' : Find without query');

console.time(x + ' : Find with query');
(async () => {
    let resp = await collection.find({ _id: '10' });
    console.log(resp);
})()
console.timeEnd(x + ' : Find with query');

console.time(x + ' : Find One without query');
(async () => {
    await collection.findOne({});
})()
console.timeEnd(x + ' : Find One without query');

console.time(x + ' : Find One with query');
(async () => {
    await collection.findOne({ _id: '10' });
})()
console.timeEnd(x + ' : Find One with query');

console.time(x + ' : Update');
(async () => {
    await collection.update({ _id: '10' }, 'title', 'AkivaDB is awesome');
})()
console.timeEnd(x + ' : Update');

// console.log("File size : ", collection.size);


console.log('/****************** Test for ' + x + ' documents(s) *************/\n\n');

process.exit();

