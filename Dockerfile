FROM node:24.0.0-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        sudo \
        python3 \
        python3-pip \
        ffmpeg \
        wget \
        ca-certificates \
        build-essential \
        git && \
            # ... (el resto de la instalación)
        # FORCE REBUILD 1.1
    rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

COPY package*.json ./

RUN pnpm install

ENV FFMPEG_PATH=/usr/bin/ffmpeg

ENV YTDLP_PATH=/usr/local/bin/yt-dlp

RUN wget -qO /usr/local/bin/yt-dlp \
    "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" && \
    chmod +x /usr/local/bin/yt-dlp

RUN ffmpeg -version

COPY . .

CMD ["node", "index.js"]