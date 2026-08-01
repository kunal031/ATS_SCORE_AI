# Stage 1: Build the React Vite single-page application bundle
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests and install packages
COPY package*.json ./
RUN npm install

# Accept optional API base URL argument (defaulting to standard host map port 4000)
ARG VITE_API_BASE_URL=http://localhost:4000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy client application source code and generate production build bundle
COPY . .
RUN npm run build

# Stage 2: Serve lightweight production bundle using Nginx Alpine
FROM nginx:alpine

# Remove default static demo assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from Stage 1 build directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration supporting React router fallback and API reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard web server port
EXPOSE 80

# Start Nginx in foreground execution mode
CMD ["nginx", "-g", "daemon off;"]
