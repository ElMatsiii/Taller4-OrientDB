FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["sh", "-c", "until curl -s http://orientdb:2480 > /dev/null; do echo 'Esperando OrientDB...'; sleep 2; done && node src/index.js"]