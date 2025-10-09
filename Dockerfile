FROM node:20 AS builder

WORKDIR /backend

COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.prod.json ./

RUN npm install

COPY src/ ./src/

RUN npm run build

FROM node:20-slim

WORKDIR /backend

COPY --from=builder /backend/dist ./dist
COPY --from=builder /backend/package*.json ./

RUN npm install --only=production

EXPOSE 3000

CMD ["npm", "start"]