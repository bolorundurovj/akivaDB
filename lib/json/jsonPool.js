const WorkerPool = require("workerpool");

class JsonPool {
  constructor() {
    this.pool = WorkerPool.pool(__dirname + "/jsonWorker.js", {
      maxWorkers: process.env.MAX_WORKER_THREADS || 3,
      workerType: "thread",
    });

    this.terminating = false;
  }

  parse(data) {
    return this.pool
      .exec("parse", [data])
      .then((res) => {
        if (!this.pool.tasks.length && !this.terminating) {
          this.terminating = true;

          this.pool
            .terminate()
            .then(() => (this.terminating = false))
            .catch(() => (this.terminating = false));
        }

        return res;
      })
      .catch((err) => {
        if (!this.pool.tasks.length && !this.terminating) {
          this.terminating = true;

          this.pool
            .terminate()
            .then(() => (this.terminating = false))
            .catch(() => (this.terminating = false));
        }

        throw err;
      });
  }

  stringify(data) {
    return this.pool
      .exec("stringify", [data])
      .then((res) => {
        if (!this.pool.tasks.length && !this.terminating) {
          this.terminating = true;

          this.pool
            .terminate()
            .then(() => (this.terminating = false))
            .catch(() => (this.terminating = false));
        }

        return res;
      })
      .catch((err) => {
        if (!this.pool.tasks.length && !this.terminating) {
          this.terminating = true;

          this.pool
            .terminate()
            .then(() => (this.terminating = false))
            .catch(() => (this.terminating = false));
        }

        throw err;
      });
  }
}

module.exports = JsonPool;
