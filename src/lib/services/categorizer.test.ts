import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  categorize,
  categorizeFromDefaults,
  DEFAULT_KEYWORDS,
  levenshteinDistance,
  stringSimilarity,
  findFuzzyMatch,
} from './categorizer';

// Mock the database module
vi.mock('$lib/db', () => ({
  getCategoryMapping: vi.fn(),
}));

import { getCategoryMapping } from '$lib/db';

describe('Levenshtein Distance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('returns length of string for empty comparison', () => {
    expect(levenshteinDistance('hello', '')).toBe(5);
    expect(levenshteinDistance('', 'hello')).toBe(5);
  });

  it('returns correct distance for single character difference', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
    expect(levenshteinDistance('cat', 'cats')).toBe(1);
  });

  it('returns correct distance for multiple differences', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('bakso', 'bkso')).toBe(1);
  });
});

describe('String Similarity', () => {
  it('returns 1 for identical strings', () => {
    expect(stringSimilarity('hello', 'hello')).toBe(1);
  });

  it('returns 0 for completely different strings', () => {
    expect(stringSimilarity('abc', 'xyz')).toBe(0);
  });

  it('returns high similarity for minor typos', () => {
    const similarity = stringSimilarity('bakso', 'bkso');
    expect(similarity).toBeGreaterThan(0.7);
  });

  it('returns low similarity for very different strings', () => {
    const similarity = stringSimilarity('bakso', 'netflix');
    expect(similarity).toBeLessThan(0.5);
  });
});

describe('Find Fuzzy Match', () => {
  const keywords = ['bakso', 'mie', 'nasi', 'kopi', 'grab'];

  it('finds exact match', () => {
    const result = findFuzzyMatch('bakso', keywords);
    expect(result?.keyword).toBe('bakso');
    expect(result?.similarity).toBe(1);
  });

  it('finds fuzzy match for typo', () => {
    const result = findFuzzyMatch('bkso', keywords);
    expect(result?.keyword).toBe('bakso');
    expect(result?.similarity).toBeGreaterThan(0.7);
  });

  it('finds fuzzy match for another typo', () => {
    const result = findFuzzyMatch('baksi', keywords);
    expect(result?.keyword).toBe('bakso');
  });

  it('returns null when no match above threshold', () => {
    const result = findFuzzyMatch('netflix', keywords);
    expect(result).toBeNull();
  });

  it('respects custom threshold', () => {
    // With high threshold, minor typo might not match
    const result = findFuzzyMatch('bkso', keywords, 0.95);
    expect(result).toBeNull();
  });
});

describe('Default Keywords', () => {
  it('includes food keywords', () => {
    expect(DEFAULT_KEYWORDS['bakso']).toBe('food');
    expect(DEFAULT_KEYWORDS['mie']).toBe('food');
    expect(DEFAULT_KEYWORDS['nasi']).toBe('food');
    expect(DEFAULT_KEYWORDS['kopi']).toBe('food');
    expect(DEFAULT_KEYWORDS['gofood']).toBe('food');
    expect(DEFAULT_KEYWORDS['grabfood']).toBe('food');
  });

  it('includes transport keywords', () => {
    expect(DEFAULT_KEYWORDS['grab']).toBe('transport');
    expect(DEFAULT_KEYWORDS['gojek']).toBe('transport');
    expect(DEFAULT_KEYWORDS['bensin']).toBe('transport');
    expect(DEFAULT_KEYWORDS['parkir']).toBe('transport');
    expect(DEFAULT_KEYWORDS['tol']).toBe('transport');
  });

  it('includes bills keywords', () => {
    expect(DEFAULT_KEYWORDS['listrik']).toBe('bills');
    expect(DEFAULT_KEYWORDS['pln']).toBe('bills');
    expect(DEFAULT_KEYWORDS['wifi']).toBe('bills');
    expect(DEFAULT_KEYWORDS['pulsa']).toBe('bills');
    expect(DEFAULT_KEYWORDS['sewa']).toBe('bills');
  });

  it('includes shopping keywords', () => {
    expect(DEFAULT_KEYWORDS['shopee']).toBe('shopping');
    expect(DEFAULT_KEYWORDS['tokopedia']).toBe('shopping');
    expect(DEFAULT_KEYWORDS['baju']).toBe('shopping');
    expect(DEFAULT_KEYWORDS['indomaret']).toBe('shopping');
  });

  it('includes entertainment keywords', () => {
    expect(DEFAULT_KEYWORDS['netflix']).toBe('entertainment');
    expect(DEFAULT_KEYWORDS['spotify']).toBe('entertainment');
    expect(DEFAULT_KEYWORDS['bioskop']).toBe('entertainment');
    expect(DEFAULT_KEYWORDS['game']).toBe('entertainment');
  });

  it('includes income keywords', () => {
    expect(DEFAULT_KEYWORDS['gaji']).toBe('income');
    expect(DEFAULT_KEYWORDS['salary']).toBe('income');
    expect(DEFAULT_KEYWORDS['freelance']).toBe('income');
    expect(DEFAULT_KEYWORDS['bonus']).toBe('income');
  });
});

describe('categorizeFromDefaults (synchronous)', () => {
  it('returns null for empty input', () => {
    expect(categorizeFromDefaults('')).toBeNull();
    expect(categorizeFromDefaults('   ')).toBeNull();
  });

  it('categorizes exact keyword matches', () => {
    expect(categorizeFromDefaults('bakso')).toBe('food');
    expect(categorizeFromDefaults('grab')).toBe('transport');
    expect(categorizeFromDefaults('netflix')).toBe('entertainment');
    expect(categorizeFromDefaults('gaji')).toBe('income');
  });

  it('categorizes with case insensitivity', () => {
    expect(categorizeFromDefaults('BAKSO')).toBe('food');
    expect(categorizeFromDefaults('Bakso')).toBe('food');
    expect(categorizeFromDefaults('BaKsO')).toBe('food');
  });

  it('categorizes when keyword is part of description', () => {
    expect(categorizeFromDefaults('makan bakso')).toBe('food');
    expect(categorizeFromDefaults('bayar grab')).toBe('transport');
    expect(categorizeFromDefaults('langganan netflix')).toBe('entertainment');
  });

  it('categorizes typos using fuzzy matching', () => {
    expect(categorizeFromDefaults('bkso')).toBe('food'); // bakso
    expect(categorizeFromDefaults('baksi')).toBe('food'); // bakso
    expect(categorizeFromDefaults('netflik')).toBe('entertainment'); // netflix
    expect(categorizeFromDefaults('shopie')).toBe('shopping'); // shopee
  });

  it('returns null for unknown keywords', () => {
    expect(categorizeFromDefaults('xyz123')).toBeNull();
    expect(categorizeFromDefaults('random stuff')).toBeNull();
  });

  it('handles partial matches within words', () => {
    // Word contains keyword
    expect(categorizeFromDefaults('gofooddelivery')).toBe('food');
    expect(categorizeFromDefaults('netflixpremium')).toBe('entertainment');
  });
});

describe('categorize (async with database)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null for empty input', async () => {
    expect(await categorize('')).toBeNull();
    expect(await categorize('   ')).toBeNull();
  });

  it('prioritizes database mappings over defaults', async () => {
    // Mock database to return a different category for 'bakso'
    vi.mocked(getCategoryMapping).mockResolvedValueOnce({
      keyword: 'bakso',
      category: 'entertainment', // Override default 'food'
      count: 5,
    });

    const result = await categorize('bakso');
    expect(result).toBe('entertainment');
    expect(getCategoryMapping).toHaveBeenCalledWith('bakso');
  });

  it('falls back to defaults when database has no match', async () => {
    vi.mocked(getCategoryMapping).mockResolvedValue(undefined);

    const result = await categorize('bakso');
    expect(result).toBe('food');
  });

  it('checks each word in description', async () => {
    vi.mocked(getCategoryMapping).mockResolvedValue(undefined);

    const result = await categorize('makan bakso di warung');
    expect(result).toBe('food');
    expect(getCategoryMapping).toHaveBeenCalledTimes(4); // makan, bakso, di, warung
  });

  it('returns database match for custom mappings', async () => {
    vi.mocked(getCategoryMapping).mockImplementation(async (keyword) => {
      if (keyword === 'customword') {
        return { keyword: 'customword', category: 'shopping', count: 3 };
      }
      return undefined;
    });

    const result = await categorize('customword something');
    expect(result).toBe('shopping');
  });

  it('handles fuzzy matching when no exact match found', async () => {
    vi.mocked(getCategoryMapping).mockResolvedValue(undefined);

    // 'bkso' should fuzzy match to 'bakso' -> 'food'
    const result = await categorize('bkso');
    expect(result).toBe('food');
  });

  it('returns null when nothing matches', async () => {
    vi.mocked(getCategoryMapping).mockResolvedValue(undefined);

    const result = await categorize('xyz123 abc456');
    expect(result).toBeNull();
  });
});

describe('Real-world categorization scenarios', () => {
  beforeEach(() => {
    vi.mocked(getCategoryMapping).mockResolvedValue(undefined);
  });

  it('categorizes Indonesian food orders', async () => {
    expect(await categorize('bakso malang')).toBe('food');
    expect(await categorize('nasi goreng')).toBe('food');
    expect(await categorize('mie ayam')).toBe('food');
    expect(await categorize('kopi susu')).toBe('food');
    expect(await categorize('sate padang')).toBe('food');
  });

  it('categorizes ride services', async () => {
    expect(await categorize('grab ke kantor')).toBe('transport');
    expect(await categorize('gojek pulang')).toBe('transport');
    expect(await categorize('parkir mall')).toBe('transport');
    expect(await categorize('isi bensin')).toBe('transport');
    expect(await categorize('bayar tol')).toBe('transport');
  });

  it('categorizes bills and utilities', async () => {
    expect(await categorize('bayar listrik')).toBe('bills');
    expect(await categorize('token pln')).toBe('bills');
    expect(await categorize('wifi bulanan')).toBe('bills');
    expect(await categorize('pulsa telkomsel')).toBe('bills');
    expect(await categorize('bayar kos')).toBe('bills');
  });

  it('categorizes online shopping', async () => {
    expect(await categorize('belanja shopee')).toBe('shopping');
    expect(await categorize('beli di tokopedia')).toBe('shopping');
    expect(await categorize('baju baru')).toBe('shopping');
    expect(await categorize('belanja indomaret')).toBe('shopping');
  });

  it('categorizes entertainment subscriptions', async () => {
    expect(await categorize('langganan netflix')).toBe('entertainment');
    expect(await categorize('spotify premium')).toBe('entertainment');
    expect(await categorize('nonton bioskop')).toBe('entertainment');
    expect(await categorize('beli game steam')).toBe('entertainment');
  });

  it('categorizes income sources', async () => {
    expect(await categorize('terima gaji')).toBe('income');
    expect(await categorize('salary januari')).toBe('income');
    expect(await categorize('bayaran freelance')).toBe('income');
    expect(await categorize('bonus tahunan')).toBe('income');
  });

  it('handles common typos', async () => {
    expect(await categorize('baksi')).toBe('food'); // bakso
    expect(await categorize('bkso')).toBe('food'); // bakso
    expect(await categorize('gojeek')).toBe('transport'); // gojek
    expect(await categorize('shopie')).toBe('shopping'); // shopee
    expect(await categorize('netflik')).toBe('entertainment'); // netflix
  });
});
