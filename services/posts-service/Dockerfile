# Use official Node.js image
FROM node:18

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start the app
CMD ["npm", "run", "dev"]
