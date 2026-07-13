FROM node:22-bookworm-slim AS build

WORKDIR /app/backend

RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./
COPY backend/package*.json ./
RUN npm ci

COPY backend/nest-cli.json ./
COPY backend/tsconfig*.json ./
COPY backend/src ./src

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

CMD ["sh", "-c", "npx prisma db push && node dist/src/main.js"]
