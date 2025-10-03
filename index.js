require("dotenv").config({});
const cluster = require("cluster");
const os = require("os");
const http = require("http");
const app = require("./app");
const cronJob = require("./src/config/cron-job/nodeCron");
const connectDB = require("./src/database/DB");
const dateCron = require("./src/config/cron-job/dateUpdteCron");
const PORT = process.env.PORT || 5000;
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // If cron jobs need DB, connect here once
  connectDB()
    .then(() => {
      console.log("Master connected to DB ✅");
      cronJob.start();
      dateCron.start();

      // Fork workers after DB is ready
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
      }
    })
    .catch((err) => {
      console.error("Master DB connection failed ❌:", err);
      process.exit(1);
    });
} else {
  // Worker: connect DB before starting server
  connectDB()
    .then(() => {
      console.log(`Worker ${process.pid} connected to DB ✅`);

      const server = http.createServer(app);
      server.listen(PORT, "0.0.0.0", () => {
        console.log(`Worker ${process.pid} running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error(`Worker ${process.pid} DB connection failed ❌:`, err);
      process.exit(1);
    });
}
