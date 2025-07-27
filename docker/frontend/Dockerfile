# Multi-stage build for Next.js frontend
FROM --platform=linux/amd64 node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy Docker-specific package files (excludes problematic dependencies)
COPY frontend/package.docker.json ./package.json
COPY frontend/package-lock.json* ./
RUN npm install --production --no-optional --legacy-peer-deps

# Development stage
FROM base AS dev
WORKDIR /app
COPY frontend/package.docker.json ./package.json
COPY frontend/package-lock.json* ./

# Install dependencies with force to override peer dependency conflicts
RUN npm cache clean --force
RUN npm install --no-optional --legacy-peer-deps

COPY frontend/ .
EXPOSE 3000
ENV PORT=3000 \
  HOSTNAME="0.0.0.0"

# Enable hot reloading for development
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app
COPY frontend/package.docker.json ./package.json
COPY frontend/package-lock.json* ./
RUN npm install --no-optional --legacy-peer-deps

COPY frontend/ .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
