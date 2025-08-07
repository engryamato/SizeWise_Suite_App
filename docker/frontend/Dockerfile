# Multi-stage build for Next.js frontend with optimized caching and security
FROM node:20-alpine AS base

# Install system dependencies and security updates
RUN apk add --no-cache \
  libc6-compat \
  dumb-init \
  && apk upgrade --no-cache

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs

# Dependencies stage - optimized for caching
FROM base AS deps

# Copy package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install dependencies with optimized flags
RUN npm ci --only=production --no-audit --no-fund --legacy-peer-deps && \
  npm cache clean --force

# Development dependencies stage
FROM base AS dev-deps

# Copy package files
COPY frontend/package.json frontend/package-lock.json* ./

# Install all dependencies for development
RUN npm ci --no-audit --no-fund --legacy-peer-deps && \
  npm cache clean --force

# Development stage
FROM base AS development
WORKDIR /app

# Copy dependencies from dev-deps stage
COPY --from=dev-deps /app/node_modules ./node_modules

# Copy source code
COPY frontend/ .

# Set environment variables for development
ENV NODE_ENV=development \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=3000 \
  HOSTNAME="0.0.0.0"

# Change ownership to nextjs user
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from dev-deps stage
COPY --from=dev-deps /app/node_modules ./node_modules

# Copy source code
COPY frontend/ .

# Set build environment variables
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1

# Build Next.js application with standalone output
RUN npm run build

# Production stage
FROM base AS production
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=3000 \
  HOSTNAME="0.0.0.0"

# Copy built application from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Change ownership to nextjs user
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

# Health check for production
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# Alias for backward compatibility
FROM production AS runner
