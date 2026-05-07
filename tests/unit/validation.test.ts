import { describe, it, expect } from 'vitest';
import {
  validateTitle,
  validateActualFileName,
  validateChangeSummary,
  validateContentSize,
  validateContentType,
} from '@/lib/validation/validation';

describe('Validation', () => {
  describe('validateTitle', () => {
    it('accepts valid title', () => {
      const result = validateTitle('My Secret File');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects empty title', () => {
      const result = validateTitle('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('rejects whitespace-only title', () => {
      const result = validateTitle('   ');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('rejects title exceeding 255 characters', () => {
      const longTitle = 'a'.repeat(256);
      const result = validateTitle(longTitle);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title must be 255 characters or less');
    });

    it('accepts title at max length', () => {
      const maxTitle = 'a'.repeat(255);
      const result = validateTitle(maxTitle);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateActualFileName', () => {
    it('accepts valid filename', () => {
      const result = validateActualFileName('.env.production');
      expect(result.valid).toBe(true);
    });

    it('accepts filename with path-like structure', () => {
      const result = validateActualFileName('config/database.json');
      expect(result.valid).toBe(true);
    });

    it('rejects empty filename', () => {
      const result = validateActualFileName('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File name is required');
    });

    it('rejects null bytes', () => {
      const result = validateActualFileName('file\x00name');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File name contains forbidden characters');
    });

    it('rejects path traversal patterns', () => {
      const result = validateActualFileName('../../../etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File name contains path traversal patterns');
    });

    it('rejects absolute path', () => {
      const result = validateActualFileName('/etc/passwd');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateChangeSummary', () => {
    it('accepts valid summary', () => {
      const result = validateChangeSummary('Updated database credentials');
      expect(result.valid).toBe(true);
    });

    it('rejects empty summary', () => {
      const result = validateChangeSummary('');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Change summary is required');
    });

    it('rejects summary exceeding 500 characters', () => {
      const longSummary = 'a'.repeat(501);
      const result = validateChangeSummary(longSummary);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Change summary must be 500 characters or less');
    });
  });

  describe('validateContentSize', () => {
    it('accepts empty content', () => {
      const result = validateContentSize('');
      expect(result.valid).toBe(true);
    });

    it('accepts content within limit (1MB default)', () => {
      const content = 'a'.repeat(1024 * 1024); // 1MB
      const result = validateContentSize(content);
      expect(result.valid).toBe(true);
    });

    it('rejects content exceeding 1MB', () => {
      const content = 'a'.repeat(1024 * 1024 + 1); // 1MB + 1 byte
      const result = validateContentSize(content);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('exceeds maximum');
    });
  });

  describe('validateContentType', () => {
    it('accepts env type', () => {
      const result = validateContentType('env');
      expect(result.valid).toBe(true);
    });

    it('accepts text type', () => {
      const result = validateContentType('text');
      expect(result.valid).toBe(true);
    });

    it('accepts markdown type', () => {
      const result = validateContentType('markdown');
      expect(result.valid).toBe(true);
    });

    it('rejects invalid type', () => {
      const result = validateContentType('binary');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Content type must be one of');
    });

    it('rejects empty type', () => {
      const result = validateContentType('');
      expect(result.valid).toBe(false);
    });
  });
});