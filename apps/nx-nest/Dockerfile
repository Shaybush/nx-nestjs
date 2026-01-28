# Multi-stage Dockerfile for nx-nest (fully isolated build)
# Build: docker-compose up --build
# Or: docker build -f apps/nx-nest/Dockerfile -t nx-nest .

# =============================================================================
# Stage 1: Builder - Install dependencies and build the application
# =============================================================================
FROM docker.io/node:lts-alpine AS builder

WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy all workspace files needed for build
COPY tsconfig.base.json tsconfig.json nx.json ./
COPY libs ./libs
COPY apps ./apps

# Sync workspace and build the nx-nest app
RUN npx nx sync --verbose || true
RUN npx nx build nx-nest --verbose

# =============================================================================
# Stage 2: Production - Minimal runtime image
# =============================================================================
FROM docker.io/node:lts-alpine

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy nx-nest build output (shared library is bundled into main.js)
COPY --from=builder /app/dist/apps/nx-nest ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 8080

CMD ["node", "main.js"]
