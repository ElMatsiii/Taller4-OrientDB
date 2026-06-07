FROM node:22-bullseye-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["sh", "-c", "node -e \"const http=require('http'); const wait=()=>{http.get('http://orientdb:2480', ()=>{console.log('OrientDB listo'); require('./src/index.js')}).on('error', ()=>{console.log('Esperando OrientDB...'); setTimeout(wait,2000)})}; wait();\""]