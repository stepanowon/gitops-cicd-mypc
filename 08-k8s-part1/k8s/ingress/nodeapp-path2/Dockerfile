FROM node:22

WORKDIR /usr/src/app
COPY . .
RUN npm install

EXPOSE 80
ENTRYPOINT ["node", "server.js"]
