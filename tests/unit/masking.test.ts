import { describe, it, expect } from 'vitest';
import { maskContent } from '@/lib/masking/masking';

describe('Masking', () => {
  it('masks env KEY=value patterns', () => {
    const content = 'OPENAI_API_KEY=sk-test-123\nDATABASE_URL=postgresql://user:pass@localhost';
    const masked = maskContent(content, 'env');
    expect(masked).toContain('OPENAI_API_KEY=********');
    expect(masked).toContain('DATABASE_URL=********');
    expect(masked).not.toContain('sk-test-123');
    expect(masked).not.toContain('pass');
  });

  it('masks common secret patterns', () => {
    const content = 'API_KEY=secret123\nTOKEN=abc\nSECRET=xyz';
    const masked = maskContent(content, 'env');
    expect(masked).toContain('API_KEY=********');
    expect(masked).toContain('TOKEN=********');
    expect(masked).toContain('SECRET=********');
  });

  it('does not mask non-secret content', () => {
    const content = 'APP_NAME=internal-vault\nAPP_VERSION=1.0.0';
    const masked = maskContent(content, 'env');
    expect(masked).toContain('APP_NAME=********');
    expect(masked).toContain('APP_VERSION=********');
  });

  it('handles markdown content differently', () => {
    const content = 'api_key=secret123';
    const masked = maskContent(content, 'markdown');
    expect(masked).not.toContain('secret123');
  });

  it('masks KEY: value (colon separator) patterns', () => {
    const content = 'API_KEY: sk-live-abc123\nDATABASE_URL: postgres://user:pass@localhost';
    const masked = maskContent(content, 'env');
    expect(masked).toContain('API_KEY:********');
    expect(masked).toContain('DATABASE_URL:********');
    expect(masked).not.toContain('sk-live-abc123');
    expect(masked).not.toContain('pass');
  });

  it('masks consecutive lines correctly (no g flag state issue)', () => {
    const content = 'API_KEY=sk-test-111\nTOKEN=abc222\nSECRET=xyz333\nAPI_KEY=sk-test-444';
    const masked = maskContent(content, 'env');
    expect(masked).toContain('API_KEY=********');
    expect(masked).toContain('TOKEN=********');
    expect(masked).toContain('SECRET=********');
    expect(masked).not.toContain('sk-test-111');
    expect(masked).not.toContain('abc222');
    expect(masked).not.toContain('xyz333');
    expect(masked).not.toContain('sk-test-444');
  });

  it('masks YAML-style key: value in general content', () => {
    const content = 'database:\n  host: localhost\n  password: supersecret123';
    const masked = maskContent(content, 'yaml');
    expect(masked).not.toContain('supersecret123');
  });
});
