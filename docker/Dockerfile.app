# ---- Main Service (App) ----
FROM node:22-alpine AS base

RUN npm install -g pnpm@9

WORKDIR /app

# ---- Dependencies Stage ----
FROM base AS deps

COPY apps/app/package.json apps/app/pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

# ---- Prisma Generate Stage ----
FROM deps AS prisma

RUN pnpm prisma:generate

# ---- Builder Stage ----
FROM prisma AS builder

COPY --from=prisma /app/node_modules/.prisma /app/node_modules/.prisma
COPY apps/app .
COPY src/lib ./src/lib
COPY src/types ./src/types
COPY src/server ./src/server

RUN pnpm build

# ---- Runner Stage ----
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]