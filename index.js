require("dotenv").config();
const cluster = require("cluster");
const os = require("os");
const http = require("http");
const app = require("./app");
const cronJob = require("./src/config/cron-job/nodeCron");

const PORT = process.env.PORT || 5000;
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  cronJob.start();

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  require("./src/database/DB");

  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} running on port ${PORT}`);
  });
}
