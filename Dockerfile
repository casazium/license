FROM node:20-slim

WORKDIR /app

# Copy obfuscated code and env config
COPY dist/index.obfuscated.js ./index.js
COPY .env.production .env

# Copy production package manifest and install only production deps
COPY package.production.json ./package.json
RUN npm install --omit=dev

# Ensure database directory and schema exist
RUN mkdir -p /app/data
RUN mkdir -p /app/src/db
COPY src/db/schema.sql ./src/db/schema.sql

EXPOSE 3001

CMD [ "node", "index.js" ]
