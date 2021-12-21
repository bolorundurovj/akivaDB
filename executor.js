const results = []

/**
 * Executes command statements
 * @author Valiant-Joshua Bolorunduro <bolorundurovb@gmail.com>
 * @param {any[]} statements - An array of command statements
 * @return {any} - The results from the processed commands
 */
const executeCommand = (statements) => {
  if (statements.length === 1) {
    return statements[0].command.execute(statements[0].params)
  } else {
    for (let i = 0; i < statements.length; i++) {
      const { command, params } = statements[i]

      const result = command.execute(params)

      results.push(result)
    }

    return results
  }
}

module.exports = { executeCommand }
