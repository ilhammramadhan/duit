import Dexie, { type EntityTable } from 'dexie';

// Category type definition
export type Category = 'food' | 'transport' | 'bills' | 'shopping' | 'entertainment' | 'income' | 'other';

// Transaction type: expense or income
export type TransactionType = 'expense' | 'income';

// Transaction interface
export interface Transaction {
  id?: number;
  amount: number;
  description: string;
  category: Category;
  type: TransactionType;
  date: Date;
  createdAt: Date;
}

// Budget interface
export interface Budget {
  category: Category;
  limit: number;
}

// CategoryMapping interface for keyword-based categorization
export interface CategoryMapping {
  keyword: string;
  category: Category;
  count: number;
}

// Database class extending Dexie
class DuitDatabase extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>;
  budgets!: EntityTable<Budget, 'category'>;
  categoryMappings!: EntityTable<CategoryMapping, 'keyword'>;

  constructor() {
    super('DuitDB');

    this.version(1).stores({
      transactions: '++id, amount, description, category, type, date, createdAt',
      budgets: 'category, limit',
      categoryMappings: 'keyword, category, count'
    });
  }
}

// Create database instance
export const db = new DuitDatabase();

// ============ Transaction CRUD Operations ============

/**
 * Add a new transaction
 */
export async function addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<number> {
  const now = new Date();
  const id = await db.transactions.add({
    ...transaction,
    createdAt: now
  });
  return id as number;
}

/**
 * Get a transaction by ID
 */
export async function getTransaction(id: number): Promise<Transaction | undefined> {
  return await db.transactions.get(id);
}

/**
 * Get all transactions
 */
export async function getAllTransactions(): Promise<Transaction[]> {
  return await db.transactions.toArray();
}

/**
 * Get transactions sorted by createdAt descending (newest first)
 */
export async function getRecentTransactions(limit?: number): Promise<Transaction[]> {
  let query = db.transactions.orderBy('createdAt').reverse();
  if (limit) {
    query = query.limit(limit);
  }
  return await query.toArray();
}

/**
 * Get transactions for a specific date range
 */
export async function getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
  return await db.transactions
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

/**
 * Update a transaction
 */
export async function updateTransaction(id: number, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Promise<number> {
  return await db.transactions.update(id, updates);
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: number): Promise<void> {
  return await db.transactions.delete(id);
}

// ============ Budget CRUD Operations ============

/**
 * Set or update a budget for a category
 */
export async function setBudget(category: Category, limit: number): Promise<void> {
  await db.budgets.put({ category, limit });
}

/**
 * Get budget for a category
 */
export async function getBudget(category: Category): Promise<Budget | undefined> {
  return await db.budgets.get(category);
}

/**
 * Get all budgets
 */
export async function getAllBudgets(): Promise<Budget[]> {
  return await db.budgets.toArray();
}

/**
 * Delete a budget
 */
export async function deleteBudget(category: Category): Promise<void> {
  return await db.budgets.delete(category);
}

// ============ CategoryMapping CRUD Operations ============

/**
 * Add or update a category mapping
 */
export async function setCategoryMapping(keyword: string, category: Category): Promise<void> {
  const existing = await db.categoryMappings.get(keyword.toLowerCase());
  if (existing) {
    await db.categoryMappings.update(keyword.toLowerCase(), {
      category,
      count: existing.count + 1
    });
  } else {
    await db.categoryMappings.put({
      keyword: keyword.toLowerCase(),
      category,
      count: 1
    });
  }
}

/**
 * Get category mapping for a keyword
 */
export async function getCategoryMapping(keyword: string): Promise<CategoryMapping | undefined> {
  return await db.categoryMappings.get(keyword.toLowerCase());
}

/**
 * Get all category mappings
 */
export async function getAllCategoryMappings(): Promise<CategoryMapping[]> {
  return await db.categoryMappings.toArray();
}

/**
 * Get category mappings sorted by usage count (most used first)
 */
export async function getCategoryMappingsByUsage(): Promise<CategoryMapping[]> {
  return await db.categoryMappings.orderBy('count').reverse().toArray();
}

/**
 * Delete a category mapping
 */
export async function deleteCategoryMapping(keyword: string): Promise<void> {
  return await db.categoryMappings.delete(keyword.toLowerCase());
}

/**
 * Update category for a mapping
 */
export async function updateCategoryMapping(keyword: string, category: Category): Promise<number> {
  return await db.categoryMappings.update(keyword.toLowerCase(), { category });
}

// ============ Budget Warning Utilities ============

/**
 * Budget warning result
 */
export interface BudgetWarning {
  type: 'exceeded' | 'approaching' | null;
  category: Category;
  percentage: number;
  exceededBy?: number;  // Amount exceeded by (only for 'exceeded' type)
}

/**
 * Check budget status for a category and return warning if applicable
 * @param category - The category to check
 * @returns BudgetWarning with warning type, or null if no warning needed
 */
export async function checkBudgetWarning(category: Category): Promise<BudgetWarning | null> {
  // Only expense categories have budget limits
  if (category === 'income') return null;

  // Get budget for category
  const budget = await db.budgets.get(category);
  if (!budget || budget.limit <= 0) return null;

  // Calculate current month's spending for this category
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const transactions = await db.transactions
    .where('date')
    .between(startOfMonth, endOfMonth, true, true)
    .toArray();

  // Sum expenses for this category
  const spent = transactions
    .filter(t => t.type === 'expense' && t.category === category)
    .reduce((sum, t) => sum + t.amount, 0);

  const percentage = Math.round((spent / budget.limit) * 100);

  // Check thresholds
  if (percentage >= 100) {
    return {
      type: 'exceeded',
      category,
      percentage,
      exceededBy: spent - budget.limit
    };
  } else if (percentage >= 80) {
    return {
      type: 'approaching',
      category,
      percentage
    };
  }

  return null;
}

// ============ Data Export/Import Operations ============

/**
 * Current backup version for compatibility
 */
export const BACKUP_VERSION = 1;

/**
 * Backup data structure
 */
export interface BackupData {
  version: number;
  exportedAt: string;
  data: {
    transactions: Transaction[];
    budgets: Budget[];
    categoryMappings: CategoryMapping[];
  };
}

/**
 * Export all data from IndexedDB as a backup object
 */
export async function exportAllData(): Promise<BackupData> {
  const transactions = await db.transactions.toArray();
  const budgets = await db.budgets.toArray();
  const categoryMappings = await db.categoryMappings.toArray();

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      transactions,
      budgets,
      categoryMappings
    }
  };
}
