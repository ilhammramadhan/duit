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

// Export for testing
export { VALID_CATEGORIES, parseCategory, getApiKey };
