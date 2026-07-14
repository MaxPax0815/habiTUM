FROM node:26-bookworm-slim

WORKDIR /app

RUN npm install --global npm@11.12.1

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev:fresh"]
