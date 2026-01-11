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

/**
 * Import validation result
 */
export interface ImportValidationResult {
  valid: boolean;
  error?: string;
  data?: BackupData;
  stats?: {
    transactions: number;
    budgets: number;
    mappings: number;
  };
}

/**
 * Valid categories for validation
 */
const VALID_CATEGORIES: Category[] = ['food', 'transport', 'bills', 'shopping', 'entertainment', 'income', 'other'];

/**
 * Validate backup data structure before importing
 */
export function validateBackupData(data: unknown): ImportValidationResult {
  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid file format: expected JSON object' };
  }

  const backup = data as Record<string, unknown>;

  // Check version field
  if (typeof backup.version !== 'number') {
    return { valid: false, error: 'Invalid file format: missing or invalid version field' };
  }

  // Check data field exists
  if (!backup.data || typeof backup.data !== 'object') {
    return { valid: false, error: 'Invalid file format: missing data field' };
  }

  const backupData = backup.data as Record<string, unknown>;

  // Check transactions array
  if (!Array.isArray(backupData.transactions)) {
    return { valid: false, error: 'Invalid file format: transactions must be an array' };
  }

  // Validate each transaction
  for (const t of backupData.transactions) {
    if (typeof t !== 'object' || t === null) {
      return { valid: false, error: 'Invalid transaction format' };
    }
    const tx = t as Record<string, unknown>;

    if (typeof tx.amount !== 'number' || tx.amount < 0) {
      return { valid: false, error: 'Invalid transaction: amount must be a positive number' };
    }
    if (typeof tx.description !== 'string') {
      return { valid: false, error: 'Invalid transaction: description must be a string' };
    }
    if (!VALID_CATEGORIES.includes(tx.category as Category)) {
      return { valid: false, error: `Invalid transaction: unknown category "${tx.category}"` };
    }
    if (tx.type !== 'expense' && tx.type !== 'income') {
      return { valid: false, error: 'Invalid transaction: type must be "expense" or "income"' };
    }
  }

  // Check budgets array
  if (!Array.isArray(backupData.budgets)) {
    return { valid: false, error: 'Invalid file format: budgets must be an array' };
  }

  // Validate each budget
  for (const b of backupData.budgets) {
    if (typeof b !== 'object' || b === null) {
      return { valid: false, error: 'Invalid budget format' };
    }
    const budget = b as Record<string, unknown>;

    if (!VALID_CATEGORIES.includes(budget.category as Category)) {
      return { valid: false, error: `Invalid budget: unknown category "${budget.category}"` };
    }
    if (typeof budget.limit !== 'number' || budget.limit < 0) {
      return { valid: false, error: 'Invalid budget: limit must be a positive number' };
    }
  }

  // Check categoryMappings array
  if (!Array.isArray(backupData.categoryMappings)) {
    return { valid: false, error: 'Invalid file format: categoryMappings must be an array' };
  }

  // Validate each category mapping
  for (const m of backupData.categoryMappings) {
    if (typeof m !== 'object' || m === null) {
      return { valid: false, error: 'Invalid category mapping format' };
    }
    const mapping = m as Record<string, unknown>;

    if (typeof mapping.keyword !== 'string' || mapping.keyword.trim() === '') {
      return { valid: false, error: 'Invalid category mapping: keyword must be a non-empty string' };
    }
    if (!VALID_CATEGORIES.includes(mapping.category as Category)) {
      return { valid: false, error: `Invalid category mapping: unknown category "${mapping.category}"` };
    }
    if (typeof mapping.count !== 'number' || mapping.count < 0) {
      return { valid: false, error: 'Invalid category mapping: count must be a positive number' };
    }
  }

  // All validations passed
  const validBackup: BackupData = {
    version: backup.version as number,
    exportedAt: backup.exportedAt as string || new Date().toISOString(),
    data: {
      transactions: backupData.transactions as Transaction[],
      budgets: backupData.budgets as Budget[],
      categoryMappings: backupData.categoryMappings as CategoryMapping[]
    }
  };

  return {
    valid: true,
    data: validBackup,
    stats: {
      transactions: validBackup.data.transactions.length,
      budgets: validBackup.data.budgets.length,
      mappings: validBackup.data.categoryMappings.length
    }
  };
}

/**
 * Import all data from backup, replacing existing data
 */
export async function importAllData(backupData: BackupData): Promise<void> {
  // Clear existing data
  await db.transactions.clear();
  await db.budgets.clear();
  await db.categoryMappings.clear();

  // Import transactions (need to convert date strings back to Date objects)
  const transactionsToImport = backupData.data.transactions.map(t => ({
    ...t,
    date: new Date(t.date),
    createdAt: new Date(t.createdAt)
  }));

  if (transactionsToImport.length > 0) {
    await db.transactions.bulkAdd(transactionsToImport);
  }

  // Import budgets
  if (backupData.data.budgets.length > 0) {
    await db.budgets.bulkPut(backupData.data.budgets);
  }

  // Import category mappings
  if (backupData.data.categoryMappings.length > 0) {
    await db.categoryMappings.bulkPut(backupData.data.categoryMappings);
  }
}
