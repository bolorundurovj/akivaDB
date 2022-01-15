const WorkerPool = require('workerpool')

WorkerPool.worker({
	parse: JSON.parse,
	stringify: JSON.stringify
})