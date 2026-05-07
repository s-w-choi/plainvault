import { describe, it, expect } from 'vitest';
import { renderMarkdown, sanitizeMarkdown } from '@/lib/markdown/markdown';

describe('Markdown', () => {
  describe('renderMarkdown', () => {
    it('renders heading', () => {
      const result = renderMarkdown('# Hello World');
      expect(result).toContain('<h1>');
      expect(result).toContain('Hello World');
    });

    it('renders bold text', () => {
      const result = renderMarkdown('**bold text**');
      expect(result).toContain('<strong>');
      expect(result).toContain('bold text');
    });

    it('renders code block', () => {
      const result = renderMarkdown('```\nconst x = 1;\n```');
      expect(result).toContain('<pre>');
      expect(result).toContain('<code');
    });

    it('renders link with target="_blank"', () => {
      const result = renderMarkdown('[Google](https://google.com)');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('escapes potentially dangerous content', () => {
      const result = renderMarkdown('<script>alert("xss")</script>');
      // sanitize-html should remove script tags
      expect(result).not.toContain('<script>');
    });
  });

  describe('sanitizeMarkdown', () => {
    it('allows safe HTML tags', () => {
      const result = sanitizeMarkdown('<p>Paragraph</p>');
      expect(result).toContain('<p>');
    });

    it('removes script tags', () => {
      const result = sanitizeMarkdown('<script>evil()</script>');
      expect(result).not.toContain('<script>');
    });

    it('removes onclick attributes', () => {
      const result = sanitizeMarkdown('<div onclick="alert()">Click me</div>');
      expect(result).not.toContain('onclick');
    });

    it('allows table elements', () => {
      const result = sanitizeMarkdown('<table><tr><td>Cell</td></tr></table>');
      expect(result).toContain('<table>');
      expect(result).toContain('<td>');
    });
  });
});