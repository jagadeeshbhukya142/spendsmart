ALTER TABLE "Transaction" ADD COLUMN "recurringTransactionId" TEXT;
CREATE UNIQUE INDEX "Transaction_recurringTransactionId_transactionDate_key" ON "Transaction"("recurringTransactionId", "transactionDate");
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_recurringTransactionId_fkey" FOREIGN KEY ("recurringTransactionId") REFERENCES "RecurringTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
