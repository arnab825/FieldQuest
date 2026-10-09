# Stage 1: Build Web App
FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace package definitions
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy Web source code and compile Vite bundle
COPY apps/web ./apps/web
RUN npm run build --workspace=@fieldquest/web

# Stage 2: Production Nginx Server
FROM nginx:alpine AS runner

# Copy custom nginx configuration with SPA routing
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy Vite build output to nginx html directory
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
