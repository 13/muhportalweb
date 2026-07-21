FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime image: Nuxt's .output is self-contained - no node_modules, no source
FROM node:22-alpine

WORKDIR /app

COPY --from=build /app/.output ./.output

ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV MQTT_BROKER_URL=mqtt://192.168.22.5:1883
ENV CORS_ORIGINS=

EXPOSE 3000

USER node

CMD [ "node", ".output/server/index.mjs" ]
