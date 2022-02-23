const AkivaDB = require('./dist/main').default;

const db = new AkivaDB({ name: 'test', root: 'akivadb', inMemory: false });
const db2 = new AkivaDB({ name: 'test2', root: 'akivadb', inMemory: false });

db.on("insert", (x) => {
    console.log(x._id, 1);
})

db2.on("insert", (x) => {
    console.log(x._id, 2);
})

let x = 1;
while (x > 0) {
    db.insertOne({ name: 'Jane Doe', count: x, date: new Date(), obj: { a: 4, b: 8 } }).then((a) => {
        console.log(a);
    })
    db2.insertOne({ name: 'Jane Doe', count: x, date: new Date(), obj: { a: 4, b: 8 } }).then((a) => {
        console.log(a);
    })

    x--;
}