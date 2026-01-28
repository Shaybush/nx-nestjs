# Multi-stage Dockerfile for nx-react (fully isolated build)
# Build: docker-compose up --build
# Or: docker build -f apps/nx-react/Dockerfile -t nx-react .

# =============================================================================
# Stage 1: Builder - Install dependencies and build the application
# =============================================================================
FROM docker.io/node:lts-alpine AS builder

WORKDIR /app

# Copy root and workspace package files first (for better layer caching)
COPY package*.json ./
COPY apps/nx-react/package.json ./apps/nx-react/
COPY apps/nx-nest/package.json ./apps/nx-nest/
COPY apps/nx-nest-e2e/package.json ./apps/nx-nest-e2e/
COPY libs/shared/package.json ./libs/shared/

# Install all dependencies (workspaces-aware)
RUN npm ci

# Copy all workspace files needed for build
COPY tsconfig.base.json tsconfig.json nx.json ./
COPY libs ./libs
COPY apps ./apps

# Build arg for VITE_API_URL (defaults to /api for nginx proxy)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the nx-react app (run vite build directly, skip tsc type-check in Docker)
RUN npx nx sync && npx --workspace=@nx-workspace/nx-react vite build

# =============================================================================
# Stage 2: Production - Minimal nginx image to serve static files
# =============================================================================
FROM nginx:alpine

# Copy custom nginx configuration
COPY apps/nx-react/nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder stage
COPY --from=builder /app/apps/nx-react/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
