# ---- Base Stage ----
FROM node:22-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@9

WORKDIR /app

# ---- Dependencies Stage ----
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

# Prisma schema
COPY prisma/schema.prisma ./prisma/

RUN pnpm install --frozen-lockfile

# ---- Prisma Generate Stage ----
FROM deps AS prisma

RUN pnpm prisma:generate

# ---- Builder Stage ----
FROM prisma AS builder

COPY --from=prisma /app/node_modules/.prisma /app/node_modules/.prisma

COPY . .

RUN pnpm build

# ---- Runner Stage ----
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]