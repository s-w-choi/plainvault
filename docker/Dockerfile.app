# ---- Main Service (App) ----
FROM node:22-alpine AS base

RUN npm install -g pnpm@9
# Prisma needs OpenSSL to detect the correct engine binary on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# ---- Dependencies Stage ----
FROM base AS deps

COPY apps/app/package.json ./apps/app/package.json
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY prisma ./prisma/

RUN pnpm --dir ./apps/app install --no-frozen-lockfile

# ---- Prisma Generate Stage ----
FROM deps AS prisma

RUN npx prisma generate --schema=./prisma/schema.prisma

# ---- Builder Stage ----
FROM prisma AS builder

# Copy source without host node_modules/.next artifacts that can break pnpm links
COPY apps/app/messages ./apps/app/messages
COPY apps/app/scripts ./apps/app/scripts
COPY apps/app/src ./apps/app/src
COPY apps/app/public ./apps/app/public
COPY apps/app/next.config.ts ./apps/app/next.config.ts
COPY apps/app/next-env.d.ts ./apps/app/next-env.d.ts
COPY apps/app/tsconfig.json ./apps/app/tsconfig.json
COPY tsconfig.json ./tsconfig.json
COPY postcss.config.mjs ./postcss.config.mjs

RUN pnpm --dir ./apps/app build

# Remove any database created during build (db.ts sets default DATABASE_URL
# and Next.js build executes code that creates the DB). Fresh containers
# should start with no data.
RUN rm -f /app/prisma/data/vault.db /app/data/vault.db

# ---- Runner Stage ----
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY docker/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/standalone/apps/app ./apps/app
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/.next/static ./apps/app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/app/public ./apps/app/public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules /app/node_modules

# Patch standalone server.js to not pass HOSTNAME to startServer.
# Next.js uses the hostname for both binding (server.listen) and URL construction
# (redirect Location headers). With Docker port mapping (13000→3000), the internal
# hostname (0.0.0.0:3000) leaks into redirect URLs, breaking the app.
# Setting hostname to undefined makes Node.js default to 0.0.0.0 for binding
# while keeping redirect URLs as relative paths.
RUN sed -i "s/const hostname = process.env.HOSTNAME || '0.0.0.0'/const hostname = undefined/" \
    apps/app/server.js

USER nextjs

EXPOSE 3000

ENV PORT=3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "apps/app/server.js"]
