import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';

let client;
let database;
let setupPromise;

async function ensureDatabase() {
  if (!env.mongoUri) throw new Error('MongoDB is not configured. Set MONGODB_URI.');
  if (!database) {
    client = new MongoClient(env.mongoUri);
    await client.connect();
    database = client.db(env.mongoDatabaseName);
  }
  if (!setupPromise) {
    setupPromise = Promise.all([
      database.collection('user_preferences').createIndex({ userId: 1 }, { unique: true }),
      database.collection('activity_logs').createIndex({ userId: 1, occurredAt: -1 }),
      database.collection('activity_logs').createIndex({ event: 1, occurredAt: -1 }),
    ]);
  }
  await setupPromise;
  return database;
}

export async function getMongoDatabase() {
  return ensureDatabase();
}

export async function disconnectMongo() {
  if (client) await client.close();
  client = undefined;
  database = undefined;
  setupPromise = undefined;
}
