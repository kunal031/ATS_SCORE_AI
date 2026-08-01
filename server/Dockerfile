# Use minimal Node.js 20 LTS Alpine base image for low resource usage and security
FROM node:20-alpine

# Set application working directory inside container
WORKDIR /app

# Copy dependency specifications first to leverage Docker layer caching
COPY package*.json ./

# Install backend server dependencies
RUN npm install

# Copy the entire backend server application code
COPY . .

# Expose required operational port for API access
EXPOSE 4000

# Set required runtime variables and start application command
ENV PORT=4000
CMD ["node", "server.js"]
