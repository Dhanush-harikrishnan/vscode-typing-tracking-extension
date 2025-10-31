import { countLines, extractSnippet, calculateRatio } from '../utils';

describe('Utils', () => {
  describe('countLines', () => {
    it('should count lines correctly', () => {
      expect(countLines('line1\nline2\nline3')).toBe(3);
      expect(countLines('single line')).toBe(1);
      expect(countLines('')).toBe(0);
    });

    it('should handle different line endings', () => {
      expect(countLines('line1\r\nline2\r\nline3')).toBe(3);
      expect(countLines('line1\rline2')).toBe(1);
    });
  });

  describe('extractSnippet', () => {
    it('should extract snippet within max length', () => {
      const text = 'const x = 10;';
      expect(extractSnippet(text, 50)).toBe('const x = 10;');
    });

    it('should truncate long text', () => {
      const text = 'a'.repeat(200);
      const snippet = extractSnippet(text, 100);
      expect(snippet.length).toBe(103); // 100 + '...'
      expect(snippet.endsWith('...')).toBe(true);
    });

    it('should handle empty text', () => {
      expect(extractSnippet('', 100)).toBe('');
    });
  });

  describe('calculateRatio', () => {
    it('should calculate ratio correctly', () => {
      expect(calculateRatio(100, 50)).toBe(2);
      expect(calculateRatio(150, 50)).toBe(3);
    });

    it('should handle zero pasted lines', () => {
      expect(calculateRatio(100, 0)).toBe(Infinity);
      expect(calculateRatio(0, 0)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      expect(calculateRatio(10, 3)).toBe(3.33);
    });
  });
});
