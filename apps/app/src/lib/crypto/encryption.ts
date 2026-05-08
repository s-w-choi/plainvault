import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_V2 = 12; // GCM standard (NIST SP 800-38D)
const IV_LENGTH_V1 = 16; // Legacy
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ENVELOPE_VERSION = 1; // Version byte for new ciphertext

function getEncryptionKey(): Buffer {
  const key = process.env.VAULT_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('VAULT_ENCRYPTION_KEY environment variable is not set');
  }

  const keyBuffer = Buffer.from(key, 'base64');
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`VAULT_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes in base64`);
  }

  return keyBuffer;
}

export interface EncryptOptions {
  aad?: string;
}

export function encrypt(plaintext: string, options?: EncryptOptions): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH_V2);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  if (options?.aad) {
    cipher.setAAD(Buffer.from(options.aad, 'utf8'));
  }

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  const versionByte = Buffer.alloc(1);
  versionByte[0] = ENVELOPE_VERSION;

  return Buffer.concat([
    versionByte,
    salt,
    iv,
    authTag,
    encrypted,
  ]).toString('base64');
}

export interface DecryptOptions {
  aad?: string;
}

export function decrypt(encryptedData: string, options?: DecryptOptions): string {
  const key = getEncryptionKey();
  const buffer = Buffer.from(encryptedData, 'base64');

  let offset = 0;
  const firstByte = buffer[0];
  let ivLength: number;
  let isVersioned = false;

  if (firstByte === ENVELOPE_VERSION) {
    isVersioned = true;
    offset = 1;
    ivLength = IV_LENGTH_V2;
  } else {
    offset = 0;
    ivLength = IV_LENGTH_V1;
  }

  const salt = buffer.subarray(offset, offset + SALT_LENGTH);
  offset += SALT_LENGTH;

  const iv = buffer.subarray(offset, offset + ivLength);
  offset += ivLength;

  const authTag = buffer.subarray(offset, offset + AUTH_TAG_LENGTH);
  offset += AUTH_TAG_LENGTH;

  const encrypted = buffer.subarray(offset);

  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  if (options?.aad && isVersioned) {
    decipher.setAAD(Buffer.from(options.aad, 'utf8'));
  }

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}
