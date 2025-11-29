# Usar la imagen base de Node.js basada en Alpine, que es mucho más ligera (small footprint)
FROM node:24.0.0-alpine

# Instalar dependencias del sistema y FFmpeg
# Se usa `apk` (Alpine Package Keeper) en lugar de `apt`
RUN apk update && \
    apk add --no-cache \
        sudo \
        python3 \
        py3-pip \
        ffmpeg \
        wget \
        ca-certificates \
        build-base \
        git && \
    # Limpieza de caché
    rm -rf /var/cache/apk/*

# CRÍTICO: Imprimir la versión de FFmpeg para verificación
RUN ffmpeg -version

# Instalar pnpm globalmente
RUN npm install -g pnpm

WORKDIR /app

# Copiar archivos de gestión de paquetes
COPY package*.json ./

# Instalar dependencias de Node.js
RUN pnpm install --prod

# Configurar variables de entorno (Las rutas de los binarios son las mismas)
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV YTDLP_PATH=/usr/local/bin/yt-dlp

# Descargar la última versión estable de yt-dlp
# Se utiliza el binario de Linux (no el de Windows)
RUN wget -qO /usr/local/bin/yt-dlp \
    "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" && \
    chmod +x /usr/local/bin/yt-dlp

# Copiar el resto del código de la aplicación
COPY . .

# CRÍTICO: Iniciar Node con un límite de memoria (V8 Heap Size)
# Esto indica a Node que no exceda 384 MB de RAM, ayudando a evitar el OOM Kill.
CMD ["node", "--max-old-space-size=384", "index.js"]