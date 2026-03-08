# ─── Stage 1: Install dependencies ───
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Production image ───
FROM node:20-alpine AS production
WORKDIR /app

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create persistent data directories
RUN mkdir -p /app/uploads /app/data && chown -R appuser:appgroup /app

# Copy dependencies from build stage
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules

# Copy application source
COPY --chown=appuser:appgroup . .

# Move data.json to persistent volume path on first run (handled by entrypoint)
# Ensure uploads and data dirs are writable
RUN chown -R appuser:appgroup /app/uploads /app

USER appuser

# Expose the port the app runs on
EXPOSE ${PORT:-3001}

# Health check using the existing /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3001}/health || exit 1

CMD ["node", "server.js"]
