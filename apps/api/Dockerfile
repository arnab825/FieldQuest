# Stage 1: Build API
FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace package definitions
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy API source code and compile TypeScript
COPY apps/api ./apps/api
RUN npm run build --workspace=@fieldquest/api

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install production dependencies only
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
RUN npm ci --omit=dev

# Copy compiled JavaScript output
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Non-root user for security
USER node

EXPOSE 4000

CMD ["node", "apps/api/dist/server.js"]
