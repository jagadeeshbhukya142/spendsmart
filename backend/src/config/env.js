import 'dotenv/config';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  authSecret: process.env.AUTH_SECRET || 'development-only-change-this-auth-secret',
  mongoUri: process.env.MONGODB_URI,
  mongoDatabaseName: process.env.MONGODB_DB_NAME || 'spendsmart',
  recurrenceIntervalMinutes: Math.max(1, Number(process.env.RECURRENCE_INTERVAL_MINUTES || 60)),
};

if (env.nodeEnv === 'production' && (!process.env.AUTH_SECRET || env.authSecret.length < 32)) {
  throw new Error('AUTH_SECRET must be at least 32 characters in production.');
}

if (env.nodeEnv === 'production' && !env.mongoUri) {
  throw new Error('MONGODB_URI is required in production.');
}
