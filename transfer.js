const now = Date.now()

require('./lib').deprecated('database', 'Variables').then(() => console.log(`${Date.now()-now}ms`))

process.once('beforeExit', () => console.log(`${Date.now()-now}ms`))