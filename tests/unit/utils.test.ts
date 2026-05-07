import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('joins truthy strings with space', () => {
      const result = cn('foo', 'bar');
      expect(result).toBe('foo bar');
    });

    it('filters out falsy values', () => {
      const result = cn('foo', undefined, 'bar', null, false, 'baz');
      expect(result).toBe('foo bar baz');
    });

    it('returns empty string when all inputs are falsy', () => {
      const result = cn(undefined, null, false);
      expect(result).toBe('');
    });

    it('handles single argument', () => {
      const result = cn('single');
      expect(result).toBe('single');
    });

    it('handles empty arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });
  });
});