import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, hashContent, generateEncryptionKey } from '@/lib/crypto/encryption';

describe('Encryption', () => {
  it('encrypts and decrypts correctly', () => {
    const plaintext = 'DATABASE_URL=postgresql://user:pass@localhost:5432/app';
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).toBeTruthy();
  });

  it('produces different ciphertext each time (due to random IV)', () => {
    const plaintext = 'SECRET_KEY=abc123';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('decrypts to original plaintext', () => {
    const plaintext = 'OPENAI_API_KEY=sk-test-123';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('hashContent produces consistent SHA256', () => {
    const content = 'test content';
    const hash1 = hashContent(content);
    const hash2 = hashContent(content);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('generateEncryptionKey produces 32-byte base64 key', () => {
    const key = generateEncryptionKey();
    const keyBuffer = Buffer.from(key, 'base64');
    expect(keyBuffer).toHaveLength(32);
  });
});
