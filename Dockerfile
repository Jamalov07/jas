# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:22-alpine AS deps

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

# ─── Stage 2: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build without eslint/prettier (prebuild only runs before "build", not "build:swc")
RUN pnpm run build:swc

# ─── Stage 3: Production ─────────────────────────────────────────────────────
FROM node:22-alpine AS production

# Chromium/Puppeteer dependencies (lightweight, skip browser download)
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV NODE_ENV=production

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile --prod && \
    npx prisma db push

COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
