const parser = require("./parser");
const { executeCommand } = require("./executor");

const evalString = (cmd, context, filename, callback) => {
  cmd = cmd.replace("\n", "");

  if (cmd === "") {
    return callback(null, undefined);
  } else {
    const eachStatement = parser.parseStatements(cmd);
    console.time("command time");
    console.log(eachStatement);
    const commandResult = executeCommand(eachStatement);
    console.timeEnd("command time");
    console.log(commandResult);
    callback(null, "Done.");
  }
};

const evalObject = (cmdObject) => {
  const eachStatement = parser.objStatementToCommand(cmdObject);
  const commandResult = executeCommand(eachStatement);
  return commandResult;
};

module.exports = { evalString, evalObject };
