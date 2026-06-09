FROM node:26-bookworm-slim

WORKDIR /app

RUN npm install --global npm@11.12.1

COPY package*.json ./
RUN npm ci

COPY . .

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
