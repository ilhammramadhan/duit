import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { categorizeWithGemini, isGeminiAvailable, parseCategory, VALID_CATEGORIES } from './gemini';

// Mock the database module
vi.mock('$lib/db', () => ({
  setCategoryMapping: vi.fn().mockResolvedValue(undefined)
}));

// Store original fetch
const originalFetch = globalThis.fetch;

describe('gemini service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  describe('VALID_CATEGORIES', () => {
    it('should include all required categories', () => {
      expect(VALID_CATEGORIES).toContain('food');
      expect(VALID_CATEGORIES).toContain('transport');
      expect(VALID_CATEGORIES).toContain('bills');
      expect(VALID_CATEGORIES).toContain('shopping');
      expect(VALID_CATEGORIES).toContain('entertainment');
      expect(VALID_CATEGORIES).toContain('income');
      expect(VALID_CATEGORIES).toContain('other');
      expect(VALID_CATEGORIES).toHaveLength(7);
    });
  });

  describe('parseCategory', () => {
    it('should parse exact category match', () => {
      expect(parseCategory('food')).toBe('food');
      expect(parseCategory('transport')).toBe('transport');
      expect(parseCategory('bills')).toBe('bills');
      expect(parseCategory('shopping')).toBe('shopping');
      expect(parseCategory('entertainment')).toBe('entertainment');
      expect(parseCategory('income')).toBe('income');
      expect(parseCategory('other')).toBe('other');
    });

    it('should handle uppercase input', () => {
      expect(parseCategory('FOOD')).toBe('food');
      expect(parseCategory('Transport')).toBe('transport');
    });

    it('should handle whitespace', () => {
      expect(parseCategory('  food  ')).toBe('food');
      expect(parseCategory('\ntransport\n')).toBe('transport');
    });

    it('should extract category from longer response', () => {
      expect(parseCategory('The category is food.')).toBe('food');
      expect(parseCategory('transport expenses')).toBe('transport');
    });

    it('should return other for invalid categories', () => {
      expect(parseCategory('unknown')).toBe('other');
      expect(parseCategory('')).toBe('other');
      expect(parseCategory('invalid category')).toBe('other');
    });
  });

  describe('isGeminiAvailable', () => {
    it('should return false when API key is not set', () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', '');
      expect(isGeminiAvailable()).toBe(false);
    });

    it('should return true when API key is set', () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');
      expect(isGeminiAvailable()).toBe(true);
    });
  });

  describe('categorizeWithGemini', () => {
    it('should return "other" when API key is not set', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', '');
      const result = await categorizeWithGemini('test description');
      expect(result).toBe('other');
    });

    it('should call Gemini API with correct parameters', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'food' }]
            }
          }]
        })
      });
      globalThis.fetch = mockFetch;

      await categorizeWithGemini('bakso', false);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('generativelanguage.googleapis.com');
      expect(callArgs[0]).toContain('test-api-key');
      expect(callArgs[1].method).toBe('POST');
      expect(callArgs[1].headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(callArgs[1].body);
      expect(body.contents[0].parts[0].text).toContain('bakso');
    });

    it('should return category from successful API response', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'transport' }]
            }
          }]
        })
      });

      const result = await categorizeWithGemini('grab ke kantor', false);
      expect(result).toBe('transport');
    });

    it('should return "other" on API error response', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const result = await categorizeWithGemini('test description', false);
      expect(result).toBe('other');
    });

    it('should return "other" on empty API response', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: []
        })
      });

      const result = await categorizeWithGemini('test description', false);
      expect(result).toBe('other');
    });

    it('should return "other" on network error', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

      const result = await categorizeWithGemini('test description', false);
      expect(result).toBe('other');
    });

    it('should save successful categorization to database when saveToMappings is true', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'food' }]
            }
          }]
        })
      });

      const { setCategoryMapping } = await import('$lib/db');

      await categorizeWithGemini('martabak 25rb', true);

      expect(setCategoryMapping).toHaveBeenCalledWith('martabak', 'food');
    });

    it('should not save to database when saveToMappings is false', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'food' }]
            }
          }]
        })
      });

      const { setCategoryMapping } = await import('$lib/db');
      vi.mocked(setCategoryMapping).mockClear();

      await categorizeWithGemini('martabak 25rb', false);

      expect(setCategoryMapping).not.toHaveBeenCalled();
    });

    it('should not save to database when category is "other"', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'other' }]
            }
          }]
        })
      });

      const { setCategoryMapping } = await import('$lib/db');
      vi.mocked(setCategoryMapping).mockClear();

      await categorizeWithGemini('random thing', true);

      expect(setCategoryMapping).not.toHaveBeenCalled();
    });

    it('should handle database save errors gracefully', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{ text: 'food' }]
            }
          }]
        })
      });

      const { setCategoryMapping } = await import('$lib/db');
      vi.mocked(setCategoryMapping).mockRejectedValue(new Error('Database error'));

      // Should not throw, just return the category
      const result = await categorizeWithGemini('martabak 25rb', true);
      expect(result).toBe('food');
    });
  });
});
