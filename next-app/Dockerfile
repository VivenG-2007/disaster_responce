# --- STAGE 1: TACTICAL FRONTEND BUILD ---
FROM node:18-alpine AS builder

WORKDIR /app

# Install Tactical dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Build Tactical Dashboard (Next.js)
COPY . .
RUN npm run build

# --- STAGE 2: TACTICAL FRONTEND RUNNER ---
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy Build Artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose Tactical Dashboard Port
EXPOSE 3000

# Start Command Dashboard
CMD ["npm", "start"]
