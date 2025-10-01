# Use Node.js 18 base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy project files
COPY . .

# Expose health check port (optional, Railway auto-detects)
EXPOSE 3000

# Start the worker
CMD ["npm", "start"]
