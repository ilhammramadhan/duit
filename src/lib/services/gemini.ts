import { setCategoryMapping, type Category } from '$lib/db';

// Valid categories for validation
const VALID_CATEGORIES: Category[] = [
  'food',
  'transport',
  'bills',
  'shopping',
  'entertainment',
  'income',
  'other'
];

/**
 * Get the Gemini API key from environment variables
 * Uses VITE_ prefix for client-side access in SvelteKit
 */
function getApiKey(): string | undefined {
  // In SvelteKit, VITE_ prefixed env vars are available via import.meta.env
  return import.meta.env.VITE_GEMINI_API_KEY;
}

/**
 * Parse the API response to extract a valid category
 * Returns 'other' if parsing fails or category is invalid
 */
function parseCategory(response: string): Category {
  const trimmed = response.toLowerCase().trim();

  // Try to find a valid category in the response
  for (const category of VALID_CATEGORIES) {
    if (trimmed === category || trimmed.includes(category)) {
      return category;
    }
  }

  return 'other';
}

/**
 * Categorize a description using Gemini API
 * Falls back to 'other' if API is unavailable or returns an error
 *
 * @param description - The expense/income description to categorize
 * @param saveToMappings - Whether to save successful categorization to database (default: true)
 * @returns The category determined by Gemini, or 'other' as fallback
 */
export async function categorizeWithGemini(
  description: string,
  saveToMappings: boolean = true
): Promise<Category> {
  const apiKey = getApiKey();

  // If no API key, fallback to 'other'
  if (!apiKey) {
    console.warn('Gemini API key not configured. Falling back to "other" category.');
    return 'other';
  }

  const prompt = `You are a financial transaction categorizer. Given the following expense or income description in Indonesian or English, categorize it into exactly ONE of these categories: food, transport, bills, shopping, entertainment, income, other.

Description: "${description}"

Reply with ONLY the category name, nothing else. For example: "food" or "transport".`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 20
          }
        })
      }
    );

    if (!response.ok) {
      console.warn(`Gemini API error: ${response.status} ${response.statusText}`);
      return 'other';
    }

    const data = await response.json();

    // Extract text from Gemini response
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn('Gemini API returned empty response');
      return 'other';
    }

    const category = parseCategory(text);

    // Save successful AI categorization to categoryMappings table for future use
    if (saveToMappings && category !== 'other') {
      // Extract the main keyword from description (first word that's not a number)
      const words = description.toLowerCase().trim().split(/\s+/);
      const keyword = words.find(word => !/^\d/.test(word) && word.length >= 2);

      if (keyword) {
        try {
          await setCategoryMapping(keyword, category);
        } catch (dbError) {
          // Don't fail if database save fails - just log it
          console.warn('Failed to save category mapping to database:', dbError);
        }
      }
    }

    return category;
  } catch (error) {
    // Handle network errors gracefully
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error calling Gemini API (possibly offline)');
    } else {
      console.warn('Error calling Gemini API:', error);
    }
    return 'other';
  }
}

/**
 * Check if Gemini API is available (has API key configured)
 */
export function isGeminiAvailable(): boolean {
  return !!getApiKey();
}

/**
 * Spending data for generating insights
 */
export interface SpendingData {
  totalIncome: number;
  totalExpenses: number;
  byCategory: { category: string; amount: number; percentage: number }[];
  budgetStatus: { category: string; spent: number; limit: number; percentage: number }[];
}

/**
 * Generate AI-powered savings tip based on monthly spending data
 * Returns a 1-2 sentence actionable tip in Bahasa Indonesia
 *
 * @param spendingData - Object containing month's spending summary
 * @returns Actionable tip string or fallback message if API unavailable
 */
export async function generateInsight(spendingData: SpendingData): Promise<string> {
  const apiKey = getApiKey();

  // If no API key, return fallback message
  if (!apiKey) {
    return 'Tips tidak tersedia saat ini';
  }

  // Build context from spending data
  const categoryBreakdown = spendingData.byCategory
    .map(c => `${c.category}: Rp ${c.amount.toLocaleString('id-ID')} (${c.percentage}%)`)
    .join(', ');

  const budgetInfo = spendingData.budgetStatus
    .map(b => `${b.category}: ${b.percentage}% dari budget`)
    .join(', ');

  const netAmount = spendingData.totalIncome - spendingData.totalExpenses;
  const savingsRate = spendingData.totalIncome > 0
    ? Math.round((netAmount / spendingData.totalIncome) * 100)
    : 0;

  const prompt = `Kamu adalah asisten keuangan pribadi. Berikan 1-2 kalimat tips finansial yang spesifik dan actionable dalam Bahasa Indonesia berdasarkan data pengeluaran bulan ini:

Total Pemasukan: Rp ${spendingData.totalIncome.toLocaleString('id-ID')}
Total Pengeluaran: Rp ${spendingData.totalExpenses.toLocaleString('id-ID')}
Sisa/Tabungan: Rp ${netAmount.toLocaleString('id-ID')} (${savingsRate}% dari pemasukan)

Pengeluaran per kategori: ${categoryBreakdown || 'Tidak ada data'}

Status budget: ${budgetInfo || 'Tidak ada budget yang diatur'}

Berikan tips yang relevan dengan pola pengeluaran ini. Fokus pada satu area yang bisa diperbaiki atau apresiasi jika sudah bagus. Jangan menyebutkan angka-angka detail, cukup berikan saran umum yang actionable.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 150
          }
        })
      }
    );

    if (!response.ok) {
      console.warn(`Gemini API error: ${response.status} ${response.statusText}`);
      return 'Tips tidak tersedia saat ini';
    }

    const data = await response.json();

    // Extract text from Gemini response
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn('Gemini API returned empty response for insight');
      return 'Tips tidak tersedia saat ini';
    }

    // Clean up the response (remove quotes, trim whitespace)
    return text.trim().replace(/^["']|["']$/g, '');
  } catch (error) {
    // Handle network errors gracefully
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error calling Gemini API for insight (possibly offline)');
    } else {
      console.warn('Error calling Gemini API for insight:', error);
    }
    return 'Tips tidak tersedia saat ini';
  }
}

// Export for testing
export { VALID_CATEGORIES, parseCategory, getApiKey };
