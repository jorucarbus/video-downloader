FROM node:20-slim

# yt-dlp (binario standalone, sin python) + Deno (runtime JS que yt-dlp necesita
# para resolver el challenge anti-bot de TikTok, ver ROADMAP.md)
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl ca-certificates unzip \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh \
    && apt-get purge -y unzip && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
