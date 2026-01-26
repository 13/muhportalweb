#FROM node:19
FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --omit=dev

# Bundle app source
COPY . .

# Build the Nuxt application
RUN npm run build

EXPOSE 3000

# Runtime environment variables with defaults
# These can be overridden when running the container via docker-compose or docker run
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV MQTT_BROKER_URL=mqtt://192.168.22.5:1883
ENV CORS_ORIGINS=

CMD [ "node", ".output/server/index.mjs" ]
