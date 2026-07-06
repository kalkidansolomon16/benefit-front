# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_BASE_URL is passed at build time via --build-arg
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ARG VITE_STORAGE_URL=http://localhost:8000/storage
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STORAGE_URL=$VITE_STORAGE_URL

RUN npm run build-only

# ── Stage 2: Serve ──────────────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# SPA fallback: all routes → index.html
COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
