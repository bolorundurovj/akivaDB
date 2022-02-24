const AkivaDB = require('./dist/main').default;

const db = new AkivaDB({ name: 'test', root: 'akivadb', inMemory: false });
const db2 = new AkivaDB({ name: 'test2', root: 'akivadb', inMemory: false });

db.on("insert", (x) => {
    console.log(x._id, 1);
})

db2.on("insert", (x) => {
    console.log(x._id, 2);
    db2.findOne({ name: x.name }, { projection: ['name', '_id'] }).then(c => {
        console.log(c, 111);
    })
})

let x = 1;
while (x > 0) {
    db.insert({ name: 'Jane Doe', count: x, date: new Date(), obj: { a: 4, b: 8 } }).then((a) => {
        console.log(a);
    })
    db2.insertMany({ name: 'Jane Doe', count: x, date: new Date(), obj: { a: 4, b: 8 } }).then((a) => {
        console.log(a);
    })

    x--;
}