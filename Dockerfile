# Stage 1 — install dependencies (cached layer when only source changes)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 2 — production image (smaller, no devDependencies)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Non-root user (security best practice for containers)
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

RUN apk add --no-cache curl \
    && mkdir -p uploads \
    && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/server.js"]
