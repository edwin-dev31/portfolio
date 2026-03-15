# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies (ci for reproducible builds)
RUN npm ci --legacy-peer-deps --ignore-scripts

# Copy source code
COPY . .

# Build for production (uses default/placeholder values)
RUN npx ng build --configuration production

# ============================================================
# Stage 2: Runtime (nginx)
# ============================================================
FROM nginx:alpine AS runtime

# Install curl for health check and sed for runtime variable replacement
RUN apk add --no-cache curl sed

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built Angular app from builder stage
COPY --from=builder /app/dist/portfolio-angular/browser /usr/share/nginx/html

# Set correct ownership
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start with entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
