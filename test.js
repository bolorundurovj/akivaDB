const AkivaDB = require('./dist/main').default;

const users = new AkivaDB({ name: 'users', root: 'akivadb', inMemory: false });
const classes = new AkivaDB({ name: 'classes', root: 'akivadb', inMemory: false });

console.log('users db', users.name, users.size, users.memoryMode, users.fileSize);
console.log('classes db', classes.name, classes.size, classes.memoryMode, classes.fileSize);

users.on("insert", (x) => {
    console.log(x._id, "users db");
})

classes.on("insert", (x) => {
    console.log(x._id, "classes db");
})

let x = 1;
let y = 10;
while (x > 0) {
    users.insert({ name: `Jane Doe - ${x}`, date: new Date(), obj: { a: x, b: Math.random() } }).then((a) => {
        // console.log(a);
    })
    // users.insert(`Jane Doe - ${x}`).then((a) => {
    //     // console.log(a);
    // })

    x--;
}

let arr = Array.from({ length: y }, (x, i) => ({ name: `Class ${y}`, students: i + 1, createdAt: new Date() }))
classes.insertMany(arr).then((a) => {
    // console.log(a);
})

// classes.findById(["17f2b1123fd9c1fae09ff63", "17f2b11272c43d62ce7b716"]).then(x => {
//     console.log(x);
// })


// users.findOne({ $string: { name: "Jane" } }, { projection: ['name', '_id'] }).then(c => {
//     console.log(c);
// })

// classes.find().then(c => {
//     console.log(c);
// })

classes.deleteOneById("17f37d00d29117e5d0ce35").then((x) => {
    console.log(x);
})

// classes.drop()
