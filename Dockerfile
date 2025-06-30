FROM node:20-slim

WORKDIR /app

# Copy app source and env config
COPY dist/index.obfuscated.js ./index.js
COPY .env.production .env

# Copy real package files including lockfile
COPY package.json package-lock.json ./

# Install dependencies using lockfile for consistency
RUN npm ci --omit=dev

# Ensure database directory and schema exist
RUN mkdir -p /app/data
RUN mkdir -p /app/src/db
COPY src/db/schema.sql ./src/db/schema.sql

EXPOSE 3001

CMD [ "node", "index.js" ]
