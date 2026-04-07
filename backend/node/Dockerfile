# --- STAGE 1: TACTICAL BACKEND ENGINE ---
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --production

# Copy source code
COPY . .

# Set tactical env variables
ENV NODE_PORT=5000
EXPOSE 5000

# Start Secure Command Link
CMD ["node", "server.js"]
