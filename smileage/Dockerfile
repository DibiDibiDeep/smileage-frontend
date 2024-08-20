# Step 1: Build React application
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# 환경 변수를 설정하여 React 개발 서버를 모든 IP 주소에서 접근 가능하도록 합니다
ENV HOST=0.0.0.0

# Build the application
RUN npm run build

# Step 2: Serve React application
FROM nginx:alpine

# Copy build artifacts from the previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 for the Nginx server
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
