import { getMongoDatabase } from '../db/mongo.js';

export const ActivityEvent = Object.freeze({
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  TRANSACTION_CREATED: 'TRANSACTION_CREATED',
  TRANSACTION_UPDATED: 'TRANSACTION_UPDATED',
  TRANSACTION_DELETED: 'TRANSACTION_DELETED',
  BUDGET_CREATED: 'BUDGET_CREATED',
  PREFERENCE_UPDATED: 'PREFERENCE_UPDATED',
  CSV_IMPORTED: 'CSV_IMPORTED',
});

// Logs intentionally contain identifiers and event context only—never passwords, descriptions, or amounts.
export async function recordActivity(userId, event, metadata = {}) {
  try {
    const db = await getMongoDatabase();
    await db.collection('activity_logs').insertOne({ userId, event, metadata, occurredAt: new Date() });
  } catch (error) {
    console.error(`Unable to record ${event} activity.`, error.message);
  }
}
