# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Accept VITE_API_URL as build arg
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and inject env
COPY . .

# Create .env file with injected VITE_API_URL
RUN echo "VITE_API_URL=$VITE_API_URL" > .env

# Build the app
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config with custom one
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
