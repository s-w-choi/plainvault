import { describe, expect, it } from 'vitest';
import { getAllowedApiKeyScopesForRole, normalizeApiKeyScopes } from '@/lib/api-keys/api-key';

describe('API key scope normalization', () => {
  it('limits viewer keys to read scope', () => {
    expect(getAllowedApiKeyScopesForRole('VIEWER')).toEqual(['files:read']);
    expect(normalizeApiKeyScopes('VIEWER', ['files:read', 'files:write', 'files:read_raw'])).toEqual(['files:read']);
  });

  it('limits developer keys to read and write scopes', () => {
    expect(getAllowedApiKeyScopesForRole('DEVELOPER')).toEqual(['files:read', 'files:write']);
    expect(normalizeApiKeyScopes('DEVELOPER', ['files:read', 'files:write', 'files:read_raw'])).toEqual([
      'files:read',
      'files:write',
    ]);
  });

  it('allows admins to issue raw-file keys', () => {
    expect(getAllowedApiKeyScopesForRole('ADMIN')).toEqual(['files:read', 'files:write', 'files:read_raw']);
    expect(normalizeApiKeyScopes('ADMIN', ['files:read_raw'])).toEqual(['files:read_raw']);
  });

  it('falls back to role defaults when scopes are omitted', () => {
    expect(normalizeApiKeyScopes('VIEWER')).toEqual(['files:read']);
    expect(normalizeApiKeyScopes('DEVELOPER')).toEqual(['files:read', 'files:write']);
  });
});
