FROM node:24-slim AS deps
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY server ./server

RUN mkdir -p /app/server/data

EXPOSE 3001
CMD ["node", "server/index.js"]
