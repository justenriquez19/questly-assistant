# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20.13.1
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules and run Puppeteer
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential \
    node-gyp \
    pkg-config \
    python-is-python3 \
    libgconf-2-4 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libxrandr2 \
    libgtk-3-0 \
    libgbm-dev \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    lsb-release \
    xdg-utils \
    wget

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Final stage for the app image
FROM base

# Copy built application
COPY --from=build /app /app

# Expose the port on which the app will run
EXPOSE 3000

# Define the command to run the application
CMD ["npm", "run", "start"]
