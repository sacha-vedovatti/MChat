FROM node:22-bookworm-slim AS build

WORKDIR /app/backend

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY package*.json ./
RUN npm ci

COPY nest-cli.json ./
COPY tsconfig*.json ./
COPY src ./src

RUN npm run build


FROM node:22-bookworm-slim AS runtime

WORKDIR /app/backend

ENV NODE_ENV=production

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=build /app/backend/package*.json ./
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/prisma.config.ts ./

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
