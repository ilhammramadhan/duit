/**
 * Parser service for Indonesian amount format parsing
 * Handles natural language expense entry like "bakso 15rb" or "gojek 1.5jt"
 */

export interface ParsedInput {
  description: string;
  amount: number;
}

/**
 * Parse Indonesian amount formats to numbers
 * Handles: 15rb, 15ribu, 15k -> 15000
 *          15.000, 15,000 -> 15000
 *          1.5jt, 1,5juta -> 1500000
 */
export function parseAmount(input: string): number | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Clean the input
  let cleaned = input.trim().toLowerCase();

  if (cleaned === '') {
    return null;
  }

  // Handle "juta" / "jt" suffix (millions)
  // Match patterns like: 1.5jt, 1,5jt, 1.5juta, 1,5juta, 2jt, 2juta
  const jutaMatch = cleaned.match(/^(\d+)([.,](\d+))?\s*(jt|juta)$/);
  if (jutaMatch) {
    const wholePart = parseInt(jutaMatch[1], 10);
    const decimalPart = jutaMatch[3] ? parseInt(jutaMatch[3], 10) : 0;
    // Calculate the decimal value properly
    const decimalMultiplier = jutaMatch[3] ? Math.pow(10, jutaMatch[3].length) : 1;
    const amount = (wholePart + decimalPart / decimalMultiplier) * 1_000_000;
    return Math.round(amount);
  }

  // Handle "ribu" / "rb" / "k" suffix (thousands)
  // Match patterns like: 15rb, 15ribu, 15k, 1.5rb, 1,5ribu
  const ribuMatch = cleaned.match(/^(\d+)([.,](\d+))?\s*(rb|ribu|k)$/);
  if (ribuMatch) {
    const wholePart = parseInt(ribuMatch[1], 10);
    const decimalPart = ribuMatch[3] ? parseInt(ribuMatch[3], 10) : 0;
    const decimalMultiplier = ribuMatch[3] ? Math.pow(10, ribuMatch[3].length) : 1;
    const amount = (wholePart + decimalPart / decimalMultiplier) * 1_000;
    return Math.round(amount);
  }

  // Handle thousand separators: 15.000 or 15,000
  // Only match if it looks like a thousand separator (groups of 3 digits after the separator)
  const thousandSepMatch = cleaned.match(/^(\d{1,3})([.,]\d{3})+$/);
  if (thousandSepMatch) {
    // Remove all separators and parse as integer
    const numStr = cleaned.replace(/[.,]/g, '');
    return parseInt(numStr, 10);
  }

  // Handle plain numbers
  const plainMatch = cleaned.match(/^(\d+)$/);
  if (plainMatch) {
    return parseInt(plainMatch[1], 10);
  }

  // Handle decimal numbers (standard format like 15.5 or 15,5)
  const decimalMatch = cleaned.match(/^(\d+)[.,](\d+)$/);
  if (decimalMatch) {
    // This could be ambiguous - 15.5 could mean 15.5 or 15500
    // For Indonesian context, we'll treat this as decimal if less than 3 digits after separator
    const afterSep = decimalMatch[2];
    if (afterSep.length < 3) {
      // Treat as decimal
      return parseFloat(cleaned.replace(',', '.'));
    }
    // Otherwise it might be a malformed thousand separator - try to parse anyway
    return parseInt(cleaned.replace(/[.,]/g, ''), 10);
  }

  return null;
}

/**
 * Parse a full input string to extract description and amount
 * Example: "bakso 15rb" -> { description: "bakso", amount: 15000 }
 */
export function parseInput(input: string): ParsedInput | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (trimmed === '') {
    return null;
  }

  // Try to find an amount pattern in the input
  // The amount could be at the beginning, end, or middle of the string

  // Patterns to look for amounts (order matters - more specific first)
  const amountPatterns = [
    // juta/jt patterns
    /(\d+[.,]?\d*)\s*(jt|juta)/gi,
    // ribu/rb/k patterns
    /(\d+[.,]?\d*)\s*(rb|ribu|k)/gi,
    // thousand separator patterns (e.g., 15.000 or 15,000)
    /(\d{1,3}(?:[.,]\d{3})+)/g,
    // plain numbers (at least 2 digits to avoid matching single digits in descriptions)
    /\b(\d{2,})\b/g,
  ];

  let amountStr: string | null = null;
  let amountMatch: RegExpMatchArray | null = null;

  // Find the first amount pattern that matches
  for (const pattern of amountPatterns) {
    const matches = trimmed.match(pattern);
    if (matches && matches.length > 0) {
      amountStr = matches[0];
      amountMatch = matches;
      break;
    }
  }

  if (!amountStr) {
    return null;
  }

  // Parse the amount
  const amount = parseAmount(amountStr);
  if (amount === null || amount <= 0) {
    return null;
  }

  // Extract description by removing the amount from the input
  let description = trimmed
    .replace(amountStr, '')
    .trim()
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    // Remove leading/trailing punctuation
    .replace(/^[,.\-:]+|[,.\-:]+$/g, '')
    .trim();

  // If no description found, return null
  if (description === '') {
    return null;
  }

  return {
    description,
    amount
  };
}
