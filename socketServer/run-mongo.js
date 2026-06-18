import { MongoMemoryServer } from 'mongodb-memory-server';

async function start() {
  console.log("Starting MongoDB Memory Server...");
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'rydex',
    }
  });

  const uri = mongod.getUri();
  console.log(`MongoDB Memory Server started successfully at: ${uri}`);
  console.log(`Connection string: mongodb://127.0.0.1:27017/rydex`);

  // Handle termination signals
  process.on('SIGINT', async () => {
    console.log("Stopping MongoDB Memory Server...");
    await mongod.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log("Stopping MongoDB Memory Server...");
    await mongod.stop();
    process.exit(0);
  });
}

start().catch(err => {
  console.error('Failed to start MongoDB Memory Server:', err);
  process.exit(1);
});
