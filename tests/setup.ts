import * as fs from 'fs';
import * as path from 'path';

// Set test environment variables directly
process.env.VAULT_ENCRYPTION_KEY = 'PI7SEL9ac3FopAqIqba4lNznG50P89+UfWmXfctnhLA=';
process.env.SESSION_SECRET = 'test-session-secret-min-32-chars-for-testing';

// Use test database in prisma/data/ directory (same location as production)
const testDbDir = path.join(process.cwd(), 'prisma', 'data');
const testDbPath = path.join(testDbDir, 'vault.test.db');
if (!fs.existsSync(testDbDir)) {
  fs.mkdirSync(testDbDir, { recursive: true });
}
process.env.DATABASE_URL = `file:${testDbPath}`;