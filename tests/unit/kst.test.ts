import { describe, it, expect } from 'vitest';
import { formatKST } from '@/lib/time/kst';

describe('KST Time', () => {
  describe('formatKST', () => {
    it('formats date as YYYY-MM-DD HH:MM:SS', () => {
      const date = new Date('2024-06-15T12:30:45Z');
      const formatted = formatKST(date);
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('formats and pads correctly', () => {
      const date = new Date('2024-01-05T08:05:03Z');
      const formatted = formatKST(date);
      // Verify format pattern YYYY-MM-DD HH:MM:SS and zero-padding
      expect(formatted).toMatch(/^\d{4}-01-0[56] \d{2}:05:03$/);
    });
  });
});