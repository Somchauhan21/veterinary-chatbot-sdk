FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src
COPY dist ./dist

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "src/index.js"]
