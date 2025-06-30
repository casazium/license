# ---------- Stage 1: Builder ----------
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files and install deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source code and build config
COPY . .

# Build the obfuscated output
RUN npm run build  # assumes this generates dist/index.obfuscated.js

# ---------- Stage 2: Runtime ----------
FROM node:20-slim

WORKDIR /app

# Copy only the obfuscated output and essentials
COPY --from=builder /app/dist/index.obfuscated.js ./index.js
COPY --from=builder /app/.env.production .env
COPY --from=builder /app/data /app/data
COPY --from=builder /app/src/db/schema.sql ./src/db/schema.sql
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

CMD ["node", "index.js"]
