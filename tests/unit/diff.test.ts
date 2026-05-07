import { describe, it, expect } from 'vitest';
import { computeLineDiff } from '@/lib/diff/diff';

describe('Diff', () => {
  it('detects added lines', () => {
    const oldContent = 'line1\nline2';
    const newContent = 'line1\nline2\nline3';
    const result = computeLineDiff(oldContent, newContent);
    expect(result.hasChanges).toBe(true);
    expect(result.lines.some(l => l.type === 'added' && l.content === 'line3')).toBe(true);
  });

  it('detects removed lines', () => {
    const oldContent = 'line1\nline2\nline3';
    const newContent = 'line1\nline2';
    const result = computeLineDiff(oldContent, newContent);
    expect(result.hasChanges).toBe(true);
    expect(result.lines.some(l => l.type === 'removed' && l.content === 'line3')).toBe(true);
  });

  it('detects changed lines', () => {
    const oldContent = 'line1\nline2\nline3';
    const newContent = 'line1\nmodified\nline3';
    const result = computeLineDiff(oldContent, newContent);
    expect(result.hasChanges).toBe(true);
    expect(result.lines.filter(l => l.type === 'removed').some(l => l.content === 'line2')).toBe(true);
    expect(result.lines.filter(l => l.type === 'added').some(l => l.content === 'modified')).toBe(true);
  });

  it('returns no changes for identical content', () => {
    const content = 'line1\nline2';
    const result = computeLineDiff(content, content);
    expect(result.hasChanges).toBe(false);
  });
});
