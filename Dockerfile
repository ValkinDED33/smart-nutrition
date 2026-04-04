FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV SMART_NUTRITION_SERVE_STATIC=true
ENV SMART_NUTRITION_STATIC_DIR=/app/dist

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY server ./server
COPY --from=build /app/dist ./dist

EXPOSE 8787

CMD ["node", "server/index.mjs"]
