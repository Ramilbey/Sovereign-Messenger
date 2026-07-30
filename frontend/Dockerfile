# =========================================================
# Stage 1: Build the custom Sovereign Messenger client
# =========================================================
FROM node:24-slim AS builder

# Install pnpm matching the required version
RUN npm install -g pnpm@11.5.2

WORKDIR /src

# Copy workspace setup files first to leverage Docker build cache
COPY element-web/package.json element-web/pnpm-lock.yaml element-web/pnpm-workspace.yaml ./
COPY element-web/packages/ ./packages/
COPY element-web/apps/web/package.json ./apps/web/package.json
COPY element-web/apps/desktop/package.json ./apps/desktop/package.json

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the client source files
COPY element-web/ ./

# Overwrite default branding config with our custom configuration
COPY config.json ./apps/web/config.json

# Build the required shared packages first, then compile the main webapp
RUN pnpm nx run-many -t build -p @element-hq/web-shared-components @element-hq/element-web-module-api
RUN pnpm --filter element-web build

# =========================================================
# Stage 2: Serve the compiled static assets using Nginx
# =========================================================
FROM nginx:alpine

# Copy built assets to Nginx default public directory
COPY --from=builder /src/apps/web/webapp /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
