const { commands } = require("./commandExecutor");
const parser = require("akivaparser");

const parseStatements = (str) => {
  const statements = parser.parseInput(str);

  return objStatementToCommand(statements);
};

const objStatementToCommand = (statements) => {
  if (!Array.isArray(statements)) {
    statements = [statements];
  }

  statements = statements.map((st) => {
    return {
      command: commands.find(
        (cm) => cm.name.toLowerCase() === st.type.toLowerCase()
      ),
      params: st.params,
    };
  });

  return statements;
};

module.exports = {
  parseStatements,
  objStatementToCommand,
};
