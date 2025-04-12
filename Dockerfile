FROM node:22-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 8080
CMD ["node", "--env-file=.env", "src/server.js"]