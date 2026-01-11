import { getCategoryMapping, type Category } from '$lib/db';
import { categorizeWithGemini, isGeminiAvailable } from './gemini';

// Default keyword mappings for common Indonesian expenses
export const DEFAULT_KEYWORDS: Record<string, Category> = {
  // Food
  bakso: 'food',
  mie: 'food',
  nasi: 'food',
  kopi: 'food',
  gofood: 'food',
  grabfood: 'food',
  makan: 'food',
  ayam: 'food',
  sate: 'food',
  soto: 'food',
  warung: 'food',
  resto: 'food',
  restaurant: 'food',
  cafe: 'food',
  starbucks: 'food',
  mcdonalds: 'food',
  kfc: 'food',
  pizza: 'food',
  burger: 'food',
  indomie: 'food',
  snack: 'food',

  // Transport
  grab: 'transport',
  gojek: 'transport',
  bensin: 'transport',
  parkir: 'transport',
  tol: 'transport',
  ojol: 'transport',
  ojek: 'transport',
  taxi: 'transport',
  taksi: 'transport',
  bus: 'transport',
  kereta: 'transport',
  mrt: 'transport',
  lrt: 'transport',
  transjakarta: 'transport',
  angkot: 'transport',
  bbm: 'transport',
  pertamina: 'transport',
  shell: 'transport',

  // Bills
  listrik: 'bills',
  pln: 'bills',
  wifi: 'bills',
  pulsa: 'bills',
  sewa: 'bills',
  kos: 'bills',
  kontrakan: 'bills',
  pdam: 'bills',
  air: 'bills',
  internet: 'bills',
  indihome: 'bills',
  biznet: 'bills',
  telkomsel: 'bills',
  xl: 'bills',
  indosat: 'bills',
  three: 'bills',
  tri: 'bills',

  // Shopping
  shopee: 'shopping',
  tokopedia: 'shopping',
  baju: 'shopping',
  indomaret: 'shopping',
  alfamart: 'shopping',
  lazada: 'shopping',
  bukalapak: 'shopping',
  blibli: 'shopping',
  zalora: 'shopping',
  uniqlo: 'shopping',
  hm: 'shopping',
  zara: 'shopping',
  sepatu: 'shopping',
  celana: 'shopping',
  kaos: 'shopping',
  supermarket: 'shopping',
  mall: 'shopping',

  // Entertainment
  netflix: 'entertainment',
  spotify: 'entertainment',
  bioskop: 'entertainment',
  game: 'entertainment',
  cinema: 'entertainment',
  xxi: 'entertainment',
  cgv: 'entertainment',
  youtube: 'entertainment',
  disney: 'entertainment',
  steam: 'entertainment',
  playstation: 'entertainment',
  xbox: 'entertainment',
  nintendo: 'entertainment',
  konser: 'entertainment',
  tiket: 'entertainment',

  // Income
  gaji: 'income',
  salary: 'income',
  freelance: 'income',
  bonus: 'income',
  thr: 'income',
  dividen: 'income',
  bunga: 'income',
  cashback: 'income',
  refund: 'income',
  transfer: 'income',
};

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching to handle typos
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create a 2D array to store distances
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize base cases
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Fill the dp table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate string similarity based on Levenshtein distance
 * Returns a value between 0 and 1, where 1 is a perfect match
 */
function stringSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLength;
}

/**
 * Find the best fuzzy match from a list of keywords
 * Returns the keyword and its similarity score if above threshold
 */
function findFuzzyMatch(
  input: string,
  keywords: string[],
  threshold: number = 0.7
): { keyword: string; similarity: number } | null {
  let bestMatch: { keyword: string; similarity: number } | null = null;

  for (const keyword of keywords) {
    const similarity = stringSimilarity(input, keyword);

    if (similarity >= threshold) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { keyword, similarity };
      }
    }
  }

  return bestMatch;
}

/**
 * Categorize a description string
 *
 * Priority:
 * 1. Exact match in categoryMappings table (user-learned mappings)
 * 2. Exact match in default keywords
 * 3. Fuzzy match in default keywords (for typos)
 *
 * @param description - The description to categorize
 * @returns The category or null if no match found
 */
export async function categorize(description: string): Promise<Category | null> {
  if (!description || description.trim().length === 0) {
    return null;
  }

  const normalizedDescription = description.toLowerCase().trim();

  // Split description into words for matching
  const words = normalizedDescription.split(/\s+/);

  // 1. Check each word against categoryMappings table (exact match)
  for (const word of words) {
    const mapping = await getCategoryMapping(word);
    if (mapping) {
      return mapping.category;
    }
  }

  // 2. Check each word against default keywords (exact match)
  for (const word of words) {
    if (word in DEFAULT_KEYWORDS) {
      return DEFAULT_KEYWORDS[word];
    }
  }

  // 3. Check for partial matches in default keywords (word contains keyword or vice versa)
  for (const word of words) {
    for (const [keyword, category] of Object.entries(DEFAULT_KEYWORDS)) {
      if (word.includes(keyword) || keyword.includes(word)) {
        // Only match if the overlap is significant (at least 3 characters)
        if (word.length >= 3 && keyword.length >= 3) {
          return category;
        }
      }
    }
  }

  // 4. Fuzzy match each word against default keywords (handle typos)
  const defaultKeywordsList = Object.keys(DEFAULT_KEYWORDS);

  for (const word of words) {
    // Only try fuzzy matching for words with at least 3 characters
    if (word.length >= 3) {
      const match = findFuzzyMatch(word, defaultKeywordsList, 0.7);
      if (match) {
        return DEFAULT_KEYWORDS[match.keyword];
      }
    }
  }

  return null;
}

/**
 * Categorize a description string, using Gemini API as fallback for unknown categories
 *
 * Priority:
 * 1. Exact match in categoryMappings table (user-learned mappings)
 * 2. Exact match in default keywords
 * 3. Fuzzy match in default keywords (for typos)
 * 4. Gemini API for unknown categories (if available)
 * 5. Returns 'other' if all else fails
 *
 * @param description - The description to categorize
 * @param useGemini - Whether to use Gemini API for unknown categories (default: true)
 * @returns The category (never null - falls back to 'other')
 */
export async function categorizeWithFallback(
  description: string,
  useGemini: boolean = true
): Promise<Category> {
  // First try local categorization
  const localCategory = await categorize(description);

  if (localCategory) {
    return localCategory;
  }

  // If local categorization failed and Gemini is enabled, try Gemini API
  if (useGemini && isGeminiAvailable()) {
    return await categorizeWithGemini(description, true);
  }

  // Fallback to 'other'
  return 'other';
}

/**
 * Get category from default keywords only (synchronous)
 * Useful for quick lookups without database access
 */
export function categorizeFromDefaults(description: string): Category | null {
  if (!description || description.trim().length === 0) {
    return null;
  }

  const normalizedDescription = description.toLowerCase().trim();
  const words = normalizedDescription.split(/\s+/);

  // Exact match
  for (const word of words) {
    if (word in DEFAULT_KEYWORDS) {
      return DEFAULT_KEYWORDS[word];
    }
  }

  // Partial match
  for (const word of words) {
    for (const [keyword, category] of Object.entries(DEFAULT_KEYWORDS)) {
      if (word.includes(keyword) || keyword.includes(word)) {
        if (word.length >= 3 && keyword.length >= 3) {
          return category;
        }
      }
    }
  }

  // Fuzzy match
  const defaultKeywordsList = Object.keys(DEFAULT_KEYWORDS);

  for (const word of words) {
    if (word.length >= 3) {
      const match = findFuzzyMatch(word, defaultKeywordsList, 0.7);
      if (match) {
        return DEFAULT_KEYWORDS[match.keyword];
      }
    }
  }

  return null;
}

// Export utility functions for testing
export { levenshteinDistance, stringSimilarity, findFuzzyMatch };

// Re-export Gemini functions for convenience
export { categorizeWithGemini, isGeminiAvailable } from './gemini';
