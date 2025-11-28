# Use a Debian-based Node image for better compatibility and full FFmpeg builds.
# 'slim' means it's smaller than the full Debian image but uses the standard glibc library.
FROM node:20-slim

# Install system dependencies via apt-get:
# 1. curl: To download yt-dlp.
# 2. ca-certificates: Ensures curl can validate HTTPS certificates (crucial for GitHub).
# 3. ffmpeg: The full-featured binary needed for processing.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
        ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Crear carpeta de trabajo
WORKDIR /app

# Copiar package.json y dependencias
COPY package*.json ./
# Assuming pnpm is installed globally or available
# Install pnpm globally, then install dependencies locally.
RUN npm install -g pnpm
RUN pnpm install

# Define the FFmpeg path for Node.js scripts. This is standard for Debian/Ubuntu.
ENV FFMPEG_PATH=/usr/bin/ffmpeg

# Copy app code
COPY . .

# Install yt-dlp (curl no longer needs the --cacert flag on Debian)
RUN curl -L \
    https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod +x /usr/local/bin/yt-dlp

# Comando de inicio
CMD ["node", "index.js"]