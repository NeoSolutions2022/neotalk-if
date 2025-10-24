# Build stage: install dependencies and compile the production bundle
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies based on lockfile for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci

# Copy the remaining source files and build the app
COPY . .
RUN npm run build

# Production stage: serve the built assets with Nginx
FROM nginx:1.27-alpine AS production

# Copy the build output to Nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
