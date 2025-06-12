# Multi-stage build for optimized production image
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat python3 make g++ curl

WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create optimized build
ENV NODE_ENV=production
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy built application
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/package*.json ./

# Install production dependencies only
RUN npm ci --only=production --frozen-lockfile && \
    npm cache clean --force && \
    rm -rf /tmp/*

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", "dist/index.js"]