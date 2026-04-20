# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:22-alpine AS deps

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Full install (with scripts) so prisma engines & client generate properly
RUN pnpm install --frozen-lockfile && \
    npx prisma generate

# ─── Stage 2: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# build:swc skips prebuild (eslint/prettier) — safe for CI
RUN pnpm run build:swc

# ─── Stage 3: Production ─────────────────────────────────────────────────────
FROM node:22-alpine AS production

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_ENV=production

WORKDIR /app

# Copy only what's needed at runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY package.json ./

RUN mkdir -p uploads

EXPOSE 3000

# prisma migrate deploy — runs migration at startup (needs DATABASE_URL from env)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
