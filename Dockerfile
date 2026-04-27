# syntax=docker/dockerfile:1.4

# ─── Base: pnpm setup (shared) ───────────────────────────────────────────────
FROM node:22-alpine AS base

RUN npm install -g pnpm

# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile && \
    npx prisma generate

# ─── Stage 2: Builder ────────────────────────────────────────────────────────
FROM base AS builder

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

# prisma db push — runs schema sync at startup (needs DATABASE_URL from env)
CMD ["sh", "-c", "npx prisma db push && node dist/main"]
