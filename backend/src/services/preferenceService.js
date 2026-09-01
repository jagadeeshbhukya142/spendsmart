import { getMongoDatabase } from '../db/mongo.js';

const defaults = {
  theme: 'dark',
  currency: 'INR',
  dashboardPreferences: { showBalances: true, compactDashboard: false },
  notificationPreferences: { budgetAlerts: true, weeklySummary: false },
};

function serialize(document) {
  return {
    userId: document.userId,
    theme: document.theme,
    currency: document.currency,
    dashboardPreferences: { ...defaults.dashboardPreferences, ...document.dashboardPreferences },
    notificationPreferences: { ...defaults.notificationPreferences, ...document.notificationPreferences },
    updatedAt: document.updatedAt,
  };
}

export async function getPreferences(userId) {
  const db = await getMongoDatabase();
  const preferences = await db.collection('user_preferences').findOne({ userId });
  return preferences ? serialize(preferences) : { userId, ...defaults, updatedAt: null };
}

export async function updatePreferences(userId, update) {
  const db = await getMongoDatabase();
  await db.collection('user_preferences').updateOne(
    { userId },
    {
      $set: { ...update, updatedAt: new Date() },
      $setOnInsert: { userId },
    },
    { upsert: true },
  );
  return serialize(await db.collection('user_preferences').findOne({ userId }));
}
