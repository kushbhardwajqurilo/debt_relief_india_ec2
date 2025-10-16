const mongoose = require("mongoose");

async function backupDatabase(mainDbUri, backupDbUri) {
  let mainConnection;
  let backupConnection;

  try {
    mainConnection = await mongoose.createConnection(mainDbUri).asPromise();
    backupConnection = await mongoose.createConnection(backupDbUri).asPromise();

    if (!mainConnection.db || !backupConnection.db) {
      throw new Error("Database connection not established");
    }

    const collections = await mainConnection.db.listCollections().toArray();

    for (const { name } of collections) {
      const mainCol = mainConnection.db.collection(name);
      const backupCol = backupConnection.db.collection(name);

      const docs = await mainCol.find({}).toArray();

      for (const doc of docs) {
        await backupCol.updateOne(
          { _id: doc._id },
          { $set: doc },
          { upsert: true }
        );
      }

      console.log(`Synced collection: ${name}`);
    }
    console.log("Backup completed");
    return { success: true, message: "Backup completed successfully" };
  } catch (err) {
    console.error("❌ Backup failed:", err.message);
  } finally {
    if (mainConnection) await mainConnection.close();
    if (backupConnection) await backupConnection.close();
  }
}
module.exports = backupDatabase;
