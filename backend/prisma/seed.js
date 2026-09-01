import { PrismaClient, RecurrenceFrequency, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

const categoryNames = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Salary', 'Other'];
const date = (value) => new Date(`${value}T00:00:00.000Z`);

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo.user@example.test' },
    update: { name: 'Demo User' },
    create: {
      name: 'Demo User',
      email: 'demo.user@example.test',
      // Deliberately non-production bcrypt hash for local seeded data only.
      passwordHash: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    },
  });

  const categories = {};
  for (const name of categoryNames) {
    categories[name] = await prisma.category.upsert({
      where: { userId_name: { userId: demoUser.id, name } },
      update: {},
      create: { userId: demoUser.id, name },
    });
  }

  const transactionCount = await prisma.transaction.count({ where: { userId: demoUser.id } });
  if (transactionCount === 0) {
    await prisma.transaction.createMany({
      data: [
        { userId: demoUser.id, categoryId: categories.Salary.id, amount: '52000.00', type: TransactionType.INCOME, description: 'Demo monthly salary', transactionDate: date('2026-08-01') },
        { userId: demoUser.id, categoryId: categories.Food.id, amount: '680.50', type: TransactionType.EXPENSE, description: 'Demo grocery purchase', transactionDate: date('2026-08-03') },
        { userId: demoUser.id, categoryId: categories.Transport.id, amount: '140.00', type: TransactionType.EXPENSE, description: 'Demo metro ride', transactionDate: date('2026-08-04') },
      ],
    });
  }

  await prisma.budget.upsert({
    where: { userId_categoryId_month_year: { userId: demoUser.id, categoryId: categories.Food.id, month: 8, year: 2026 } },
    update: { amount: '4000.00' },
    create: { userId: demoUser.id, categoryId: categories.Food.id, amount: '4000.00', month: 8, year: 2026 },
  });

  const recurringExists = await prisma.recurringTransaction.findFirst({ where: { userId: demoUser.id, description: 'Demo music service' } });
  if (!recurringExists) {
    await prisma.recurringTransaction.create({
      data: { userId: demoUser.id, categoryId: categories.Entertainment.id, amount: '199.00', type: TransactionType.EXPENSE, description: 'Demo music service', frequency: RecurrenceFrequency.MONTHLY, startDate: date('2026-01-05'), nextExecutionDate: date('2026-09-05'), active: true },
    });
  }
}

main()
  .then(() => console.log('Seed data created.'))
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
