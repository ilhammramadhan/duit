import type { Category } from '$lib/db';

// Storage key for localStorage
const STORAGE_KEY = 'duit-category-names';

// Default category display names
export const DEFAULT_CATEGORY_NAMES: Record<Category, string> = {
  food: 'Food',
  transport: 'Transport',
  bills: 'Bills',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  income: 'Income',
  other: 'Other'
};

// Type for custom category names (partial since not all need to be overridden)
export type CategoryNames = Partial<Record<Category, string>>;

/**
 * Get custom category names from localStorage
 */
export function getCustomCategoryNames(): CategoryNames {
  if (typeof localStorage === 'undefined') return {};

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    return JSON.parse(stored) as CategoryNames;
  } catch {
    return {};
  }
}

/**
 * Save custom category names to localStorage
 */
export function saveCustomCategoryNames(names: CategoryNames): void {
  if (typeof localStorage === 'undefined') return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
}

/**
 * Get display name for a category (custom name if set, otherwise default)
 */
export function getCategoryDisplayName(category: Category): string {
  const customNames = getCustomCategoryNames();
  return customNames[category] || DEFAULT_CATEGORY_NAMES[category];
}

/**
 * Set a custom display name for a category
 */
export function setCategoryDisplayName(category: Category, name: string): void {
  const customNames = getCustomCategoryNames();

  // If the name matches the default, remove the custom override
  if (name.trim() === DEFAULT_CATEGORY_NAMES[category]) {
    delete customNames[category];
  } else {
    customNames[category] = name.trim();
  }

  saveCustomCategoryNames(customNames);
}

/**
 * Reset a category name to its default
 */
export function resetCategoryName(category: Category): void {
  const customNames = getCustomCategoryNames();
  delete customNames[category];
  saveCustomCategoryNames(customNames);
}

/**
 * Get all category display names (custom + defaults merged)
 */
export function getAllCategoryDisplayNames(): Record<Category, string> {
  const customNames = getCustomCategoryNames();
  return {
    ...DEFAULT_CATEGORY_NAMES,
    ...customNames
  };
}
