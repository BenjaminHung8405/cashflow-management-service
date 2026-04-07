import { PrismaPg } from '@prisma/adapter-pg';
import {
    FrequencyType,
    PrismaClient,
    TransactionType,
    WalletType,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import 'dotenv/config';
import { Pool } from 'pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  ),
});

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateInRange(start: Date, end: Date): Date {
  const timestamp = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(timestamp);
}

function pickRandom<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('123456', 10);

  // 1) Cleanup old data to keep seed idempotent across runs.
  await prisma.transaction.deleteMany();
  await prisma.recurringTransaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2) Create users.
  const testUser = await prisma.user.create({
    data: {
      username: 'testuser',
      email: 'testuser@example.com',
      passwordHash,
    },
  });

  const otherUser = await prisma.user.create({
    data: {
      username: 'otheruser',
      email: 'otheruser@example.com',
      passwordHash,
    },
  });

  // 3) Create system-default categories (userId = null).
  const systemCategories = await Promise.all([
    prisma.category.create({ data: { name: 'Salary', type: TransactionType.INCOME, icon: 'ic_salary' } }),
    prisma.category.create({ data: { name: 'Bonus', type: TransactionType.INCOME, icon: 'ic_bonus' } }),
    prisma.category.create({ data: { name: 'Freelance', type: TransactionType.INCOME, icon: 'ic_freelance' } }),
    prisma.category.create({ data: { name: 'Investment', type: TransactionType.INCOME, icon: 'ic_investment' } }),
    prisma.category.create({ data: { name: 'Food', type: TransactionType.EXPENSE, icon: 'ic_food' } }),
    prisma.category.create({ data: { name: 'Transport', type: TransactionType.EXPENSE, icon: 'ic_transport' } }),
    prisma.category.create({ data: { name: 'Bills', type: TransactionType.EXPENSE, icon: 'ic_bills' } }),
    prisma.category.create({ data: { name: 'Shopping', type: TransactionType.EXPENSE, icon: 'ic_shopping' } }),
    prisma.category.create({ data: { name: 'Entertainment', type: TransactionType.EXPENSE, icon: 'ic_entertainment' } }),
    prisma.category.create({ data: { name: 'Healthcare', type: TransactionType.EXPENSE, icon: 'ic_healthcare' } }),
  ]);

  // 4) Create custom categories for testuser.
  const customCategories = await Promise.all([
    prisma.category.create({
      data: {
        userId: testUser.id,
        name: 'Pet Care',
        type: TransactionType.EXPENSE,
        icon: 'ic_pet',
      },
    }),
    prisma.category.create({
      data: {
        userId: testUser.id,
        name: 'Side Project',
        type: TransactionType.INCOME,
        icon: 'ic_side_project',
      },
    }),
  ]);

  const incomeCategories = [...systemCategories, ...customCategories].filter(
    (category) => category.type === TransactionType.INCOME
  );
  const expenseCategories = [...systemCategories, ...customCategories].filter(
    (category) => category.type === TransactionType.EXPENSE
  );

  // 5) Create wallets.
  const testUserWallets = await Promise.all([
    prisma.wallet.create({
      data: {
        userId: testUser.id,
        name: 'Cash Wallet',
        walletType: WalletType.CASH,
        icon: 'ic_wallet_cash',
        balance: 3500000,
      },
    }),
    prisma.wallet.create({
      data: {
        userId: testUser.id,
        name: 'VCB Bank',
        walletType: WalletType.BANK,
        icon: 'ic_wallet_bank',
        balance: 25000000,
      },
    }),
    prisma.wallet.create({
      data: {
        userId: testUser.id,
        name: 'Visa Credit',
        walletType: WalletType.CREDIT,
        icon: 'ic_wallet_credit',
        balance: -1200000,
        creditLimit: 30000000,
      },
    }),
  ]);

  await prisma.wallet.create({
    data: {
      userId: otherUser.id,
      name: 'Other Main Wallet',
      walletType: WalletType.BANK,
      icon: 'ic_wallet_other',
      balance: 12000000,
    },
  });

  // 6) Create transactions for testuser in last 3 months.
  const now = new Date();
  const currentMonthStart = getMonthStart(now);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
  const dateRangeStart = twoMonthsAgo;
  const dateRangeEnd = getMonthEnd(now);

  // Keep final total in [50, 60] after adding 3 anchor tx + 2 transfer tx.
  const transactionCount = randomInt(45, 55);
  const transactionsData: Array<{
    userId: string;
    walletId: string;
    categoryId: string;
    amount: number;
    type: TransactionType;
    note: string;
    transactionDate: Date;
    transferGroupId: string | null;
    isDeleted: boolean;
  }> = [];

  for (let index = 0; index < transactionCount; index += 1) {
    const isIncome = Math.random() < 0.25;
    const type = isIncome ? TransactionType.INCOME : TransactionType.EXPENSE;
    const category = pickRandom(isIncome ? incomeCategories : expenseCategories);
    const wallet = pickRandom(testUserWallets);

    const amount = isIncome
      ? randomInt(800000, 15000000)
      : randomInt(30000, wallet.walletType === WalletType.CREDIT ? 3000000 : 2500000);

    transactionsData.push({
      userId: testUser.id,
      walletId: wallet.id,
      categoryId: category.id,
      amount,
      type,
      note: `${type === TransactionType.INCOME ? 'Income' : 'Expense'} seed tx #${index + 1}`,
      transactionDate: randomDateInRange(dateRangeStart, dateRangeEnd),
      transferGroupId: null,
      isDeleted: false,
    });
  }

  // Force at least one transaction in each of the 3 target months for filter/chart testing.
  const monthAnchors = [0, 1, 2].map(
    (offset) => new Date(now.getFullYear(), now.getMonth() - offset, randomInt(1, 28), 12, 0, 0, 0)
  );

  for (const anchorDate of monthAnchors) {
    const category = pickRandom(expenseCategories);
    const wallet = pickRandom(testUserWallets);

    transactionsData.push({
      userId: testUser.id,
      walletId: wallet.id,
      categoryId: category.id,
      amount: randomInt(120000, 900000),
      type: TransactionType.EXPENSE,
      note: 'Anchor transaction for monthly statistics',
      transactionDate: anchorDate,
      transferGroupId: null,
      isDeleted: false,
    });
  }

  await prisma.transaction.createMany({ data: transactionsData });

  // Add 2 internal transfer transactions sharing one transferGroupId.
  const transferGroupId = randomUUID();
  const transferOutWallet = testUserWallets.find((wallet) => wallet.walletType === WalletType.BANK) || testUserWallets[0];
  const transferInWallet = testUserWallets.find((wallet) => wallet.walletType === WalletType.CASH) || testUserWallets[1];
  const transferCategoryOut = expenseCategories[0];
  const transferCategoryIn = incomeCategories[0];
  const transferAmount = 2000000;

  await prisma.transaction.createMany({
    data: [
      {
        userId: testUser.id,
        walletId: transferOutWallet.id,
        categoryId: transferCategoryOut.id,
        amount: transferAmount,
        type: TransactionType.EXPENSE,
        note: 'Internal transfer out',
        transactionDate: randomDateInRange(currentMonthStart, dateRangeEnd),
        transferGroupId,
        isDeleted: false,
      },
      {
        userId: testUser.id,
        walletId: transferInWallet.id,
        categoryId: transferCategoryIn.id,
        amount: transferAmount,
        type: TransactionType.INCOME,
        note: 'Internal transfer in',
        transactionDate: randomDateInRange(currentMonthStart, dateRangeEnd),
        transferGroupId,
        isDeleted: false,
      },
    ],
  });

  // 7) Create 2 budgets for current month.
  const budgetStart = getMonthStart(now);
  const budgetEnd = getMonthEnd(now);

  await prisma.budget.createMany({
    data: [
      {
        userId: testUser.id,
        categoryId: expenseCategories.find((category) => category.name === 'Food')?.id || expenseCategories[0].id,
        amountLimit: 4500000,
        startDate: budgetStart,
        endDate: budgetEnd,
      },
      {
        userId: testUser.id,
        categoryId:
          expenseCategories.find((category) => category.name === 'Transport')?.id || expenseCategories[1].id,
        amountLimit: 2000000,
        startDate: budgetStart,
        endDate: budgetEnd,
      },
    ],
  });

  // 8) Create 2 active monthly recurring transactions.
  await prisma.recurringTransaction.createMany({
    data: [
      {
        userId: testUser.id,
        walletId: testUserWallets.find((wallet) => wallet.walletType === WalletType.BANK)?.id || testUserWallets[0].id,
        categoryId: incomeCategories.find((category) => category.name === 'Salary')?.id || incomeCategories[0].id,
        amount: 18000000,
        type: TransactionType.INCOME,
        note: 'Monthly salary',
        frequency: FrequencyType.MONTHLY,
        nextRun: new Date(now.getFullYear(), now.getMonth() + 1, 1, 8, 0, 0, 0),
        isActive: true,
      },
      {
        userId: testUser.id,
        walletId: testUserWallets.find((wallet) => wallet.walletType === WalletType.BANK)?.id || testUserWallets[0].id,
        categoryId: expenseCategories.find((category) => category.name === 'Bills')?.id || expenseCategories[0].id,
        amount: 1500000,
        type: TransactionType.EXPENSE,
        note: 'Monthly utilities bill',
        frequency: FrequencyType.MONTHLY,
        nextRun: new Date(now.getFullYear(), now.getMonth() + 1, 5, 8, 0, 0, 0),
        isActive: true,
      },
    ],
  });

  const totalTransactions = await prisma.transaction.count({ where: { userId: testUser.id } });
  console.log('Seed completed successfully.');
  console.log(`Users: 2 (testuser, otheruser)`);
  console.log(`System categories: ${systemCategories.length}`);
  console.log(`Custom categories: ${customCategories.length} (for testuser)`);
  console.log(`Wallets: 4 total (3 for testuser, 1 for otheruser)`);
  console.log(`Transactions for testuser: ${totalTransactions}`);
  console.log('Budgets: 2 (current month for testuser)');
  console.log('Recurring transactions: 2 active (monthly income + expense)');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
