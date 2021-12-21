const repl = require('repl')
const { evalString, evalObject } = require('./evaluator')

if (process.argv[2] === 'repl') {
  repl.start({
    prompt: 'AkivaDB $ ',
    eval: evalString
  })
}

module.exports = { evalObject }
