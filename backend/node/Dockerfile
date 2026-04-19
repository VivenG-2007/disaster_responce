# --- STAGE 1: TACTICAL BACKEND ENGINE ---
FROM node:20-alpine

WORKDIR /app

# Install production dependencies from lockfile for reproducible builds
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV NODE_PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
