import { describe, it, expect } from 'vitest';
import { parseAmount, parseInput } from './parser';

describe('parseAmount', () => {
  describe('ribu/rb/k formats (thousands)', () => {
    it('parses "15rb" as 15000', () => {
      expect(parseAmount('15rb')).toBe(15000);
    });

    it('parses "15ribu" as 15000', () => {
      expect(parseAmount('15ribu')).toBe(15000);
    });

    it('parses "15k" as 15000', () => {
      expect(parseAmount('15k')).toBe(15000);
    });

    it('parses "100rb" as 100000', () => {
      expect(parseAmount('100rb')).toBe(100000);
    });

    it('parses "5ribu" as 5000', () => {
      expect(parseAmount('5ribu')).toBe(5000);
    });

    it('parses with decimal "1.5rb" as 1500', () => {
      expect(parseAmount('1.5rb')).toBe(1500);
    });

    it('parses with comma decimal "1,5rb" as 1500', () => {
      expect(parseAmount('1,5rb')).toBe(1500);
    });

    it('handles case insensitivity "15RB"', () => {
      expect(parseAmount('15RB')).toBe(15000);
    });

    it('handles case insensitivity "15Ribu"', () => {
      expect(parseAmount('15Ribu')).toBe(15000);
    });
  });

  describe('juta/jt formats (millions)', () => {
    it('parses "1jt" as 1000000', () => {
      expect(parseAmount('1jt')).toBe(1000000);
    });

    it('parses "1juta" as 1000000', () => {
      expect(parseAmount('1juta')).toBe(1000000);
    });

    it('parses "1.5jt" as 1500000', () => {
      expect(parseAmount('1.5jt')).toBe(1500000);
    });

    it('parses "1,5juta" as 1500000', () => {
      expect(parseAmount('1,5juta')).toBe(1500000);
    });

    it('parses "2jt" as 2000000', () => {
      expect(parseAmount('2jt')).toBe(2000000);
    });

    it('parses "2.5juta" as 2500000', () => {
      expect(parseAmount('2.5juta')).toBe(2500000);
    });

    it('handles case insensitivity "1JT"', () => {
      expect(parseAmount('1JT')).toBe(1000000);
    });

    it('handles case insensitivity "1.5Juta"', () => {
      expect(parseAmount('1.5Juta')).toBe(1500000);
    });
  });

  describe('thousand separator formats', () => {
    it('parses "15.000" as 15000', () => {
      expect(parseAmount('15.000')).toBe(15000);
    });

    it('parses "15,000" as 15000', () => {
      expect(parseAmount('15,000')).toBe(15000);
    });

    it('parses "1.500.000" as 1500000', () => {
      expect(parseAmount('1.500.000')).toBe(1500000);
    });

    it('parses "1,500,000" as 1500000', () => {
      expect(parseAmount('1,500,000')).toBe(1500000);
    });

    it('parses "100.000" as 100000', () => {
      expect(parseAmount('100.000')).toBe(100000);
    });
  });

  describe('plain numbers', () => {
    it('parses "15000" as 15000', () => {
      expect(parseAmount('15000')).toBe(15000);
    });

    it('parses "100" as 100', () => {
      expect(parseAmount('100')).toBe(100);
    });

    it('parses "5" as 5', () => {
      expect(parseAmount('5')).toBe(5);
    });
  });

  describe('edge cases', () => {
    it('returns null for empty string', () => {
      expect(parseAmount('')).toBe(null);
    });

    it('returns null for null input', () => {
      expect(parseAmount(null as unknown as string)).toBe(null);
    });

    it('returns null for undefined input', () => {
      expect(parseAmount(undefined as unknown as string)).toBe(null);
    });

    it('returns null for non-numeric string', () => {
      expect(parseAmount('hello')).toBe(null);
    });

    it('handles whitespace', () => {
      expect(parseAmount('  15rb  ')).toBe(15000);
    });
  });
});

describe('parseInput', () => {
  describe('basic parsing', () => {
    it('parses "bakso 15rb" correctly', () => {
      const result = parseInput('bakso 15rb');
      expect(result).toEqual({
        description: 'bakso',
        amount: 15000
      });
    });

    it('parses "mie ayam 10rb" correctly', () => {
      const result = parseInput('mie ayam 10rb');
      expect(result).toEqual({
        description: 'mie ayam',
        amount: 10000
      });
    });

    it('parses "gojek 25ribu" correctly', () => {
      const result = parseInput('gojek 25ribu');
      expect(result).toEqual({
        description: 'gojek',
        amount: 25000
      });
    });

    it('parses "grab 20k" correctly', () => {
      const result = parseInput('grab 20k');
      expect(result).toEqual({
        description: 'grab',
        amount: 20000
      });
    });
  });

  describe('juta format', () => {
    it('parses "sewa 1.5jt" correctly', () => {
      const result = parseInput('sewa 1.5jt');
      expect(result).toEqual({
        description: 'sewa',
        amount: 1500000
      });
    });

    it('parses "gaji 5juta" correctly', () => {
      const result = parseInput('gaji 5juta');
      expect(result).toEqual({
        description: 'gaji',
        amount: 5000000
      });
    });
  });

  describe('thousand separator format', () => {
    it('parses "bakso 15.000" correctly', () => {
      const result = parseInput('bakso 15.000');
      expect(result).toEqual({
        description: 'bakso',
        amount: 15000
      });
    });

    it('parses "shopping 100,000" correctly', () => {
      const result = parseInput('shopping 100,000');
      expect(result).toEqual({
        description: 'shopping',
        amount: 100000
      });
    });
  });

  describe('amount at different positions', () => {
    it('parses amount at beginning "15rb bakso"', () => {
      const result = parseInput('15rb bakso');
      expect(result).toEqual({
        description: 'bakso',
        amount: 15000
      });
    });

    it('parses amount at end "bakso 15rb"', () => {
      const result = parseInput('bakso 15rb');
      expect(result).toEqual({
        description: 'bakso',
        amount: 15000
      });
    });

    it('parses amount in middle "beli bakso 15rb porsi"', () => {
      const result = parseInput('beli bakso 15rb porsi');
      expect(result).not.toBe(null);
      expect(result!.amount).toBe(15000);
      // Description may vary based on implementation
    });
  });

  describe('edge cases', () => {
    it('returns null for empty string', () => {
      expect(parseInput('')).toBe(null);
    });

    it('returns null for null input', () => {
      expect(parseInput(null as unknown as string)).toBe(null);
    });

    it('returns null for undefined input', () => {
      expect(parseInput(undefined as unknown as string)).toBe(null);
    });

    it('returns null for string without amount', () => {
      expect(parseInput('bakso enak')).toBe(null);
    });

    it('returns null for amount only without description', () => {
      expect(parseInput('15rb')).toBe(null);
    });

    it('handles extra whitespace', () => {
      const result = parseInput('  bakso   15rb  ');
      expect(result).toEqual({
        description: 'bakso',
        amount: 15000
      });
    });
  });

  describe('complex descriptions', () => {
    it('parses "kopi susu gula aren 25rb"', () => {
      const result = parseInput('kopi susu gula aren 25rb');
      expect(result).toEqual({
        description: 'kopi susu gula aren',
        amount: 25000
      });
    });

    it('parses "nasi goreng spesial 30.000"', () => {
      const result = parseInput('nasi goreng spesial 30.000');
      expect(result).toEqual({
        description: 'nasi goreng spesial',
        amount: 30000
      });
    });
  });
});
