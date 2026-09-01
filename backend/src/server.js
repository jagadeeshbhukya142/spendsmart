import app from './app.js';
import { env } from './config/env.js';
import prisma from './db/prisma.js';
import { disconnectMongo } from './db/mongo.js';
import { executeAllDueRecurringTransactions } from './services/recurringTransactionService.js';

const server = app.listen(env.port, () => console.log(`SpendSmart API listening on port ${env.port}`));
executeAllDueRecurringTransactions().catch((error) => console.error('Recurring transaction job failed.', error.message));
const recurrenceTimer = setInterval(() => executeAllDueRecurringTransactions().catch((error) => console.error('Recurring transaction job failed.', error.message)), env.recurrenceIntervalMinutes * 60_000);
recurrenceTimer.unref();
async function shutdown() { clearInterval(recurrenceTimer); server.close(async () => { await Promise.all([prisma.$disconnect(), disconnectMongo()]); process.exit(0); }); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
