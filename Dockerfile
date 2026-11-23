FROM node:22-bookworm-slim AS base

RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install dependencies
FROM base AS deps

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-factor 2 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --no-audit --no-fund --maxsockets 7

# 2. Build the application
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Enable PAuS SSO mode (disable general email registration) in Unpad build
ENV NEXT_PUBLIC_REGISTRATION_ENABLED=false

# Generate Prisma Client and build Next.js
RUN npx prisma generate && npm run build

# 3. Production runner
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install Prisma CLI globally for DB initialization and migrations
# Create nextjs user with a valid home directory (fixes /nonexistent EACCES)
RUN npm install -g prisma@7.8.0 && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /home/nextjs nextjs && \
    mkdir -p /home/nextjs && \
    chown -R nextjs:nodejs /home/nextjs

ENV HOME=/home/nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Prisma CLI loads this from prisma.config.ts; Next standalone tracing omits it.
COPY --from=builder /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
