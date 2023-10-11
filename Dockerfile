# Stage 1: Build the application
FROM node:20 AS builder

# Create app directory
WORKDIR /app

# Copy project files
COPY . .

# Install pnpm
RUN npm install -g pnpm

# Install app dependencies
RUN pnpm install

# Build the application
RUN pnpm build

# Stage 2: Create the final image
FROM node:20

# Set the working directory
WORKDIR /app

# Copy node_modules, package.json, and built files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/tsconfig.build.json ./
COPY --from=builder /app/dist ./dist

# Expose the port
EXPOSE 3000

# Start the application
CMD [ "yarn", "start" ]
