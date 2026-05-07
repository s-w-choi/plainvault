# Development Guide

## Prerequisites

- Node.js 18+
- pnpm 8+
- macOS (primary dev environment)

## Initial Setup

```bash
# Clone and install
cd PlainVault
pnpm install

# Copy and configure environment
cp .env.example .env
# Edit .env and set VAULT_ENCRYPTION_KEY

# Generate key:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Initialize database
pnpm prisma generate
pnpm db:migrate
pnpm db:seed
```

## Daily Development

```bash
# Start dev server
pnpm dev

# Run typecheck
pnpm typecheck

# Run lint
pnpm lint

# Run tests
pnpm test

# Run all validations
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Database Operations

```bash
# Create migration
pnpm prisma migrate dev --name migration_name

# Apply migrations
pnpm prisma migrate deploy

# Reset database (WARNING: destroys data)
pnpm db:reset

# Open studio
pnpm db:studio
```

## Adding New API Routes

1. Create route file in `src/app/api/`
2. Use singleton PrismaClient pattern
3. Import auth helpers from `@/lib/auth/auth`
4. Import audit log from `@/lib/audit/audit-log`
5. Apply proper error format `{ error: { code, message } }`
6. Add Cache-Control header for sensitive responses

```typescript
// Example pattern
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth/auth';
import { createAuditLog } from '@/lib/audit/audit-log';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.userId) {
    return Response.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }
  // ... handler
}
```

## Adding New Components

Place in `src/components/ui/` following shadcn/ui patterns:

```typescript
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline';
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-indigo-600 text-white hover:bg-indigo-700',
        variant === 'outline' && 'border border-gray-300 bg-white hover:bg-gray-50',
        className
      )}
      {...props}
    />
  );
}
```

## Security Guidelines

1. **Never log secrets**: Don't console.log content, API keys, or passwords
2. **Server-side masking**: Always mask on server, never client
3. **Validate input**: Use validation lib for file names, titles
4. **No path traversal**: actualFileName validated before any file ops
5. **Encrypt everything**: Content must be encrypted before DB storage
6. **Audit everything**: Log all significant operations

## UI Guidelines

- White/light gray backgrounds
- Gray-200 borders
- Indigo-600 primary color
- Indigo-500 focus rings
- Table-centric layouts for data
- No gradients or flashy animations
- System font stack
