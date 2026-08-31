FROM node:22-bookworm-slim AS build

WORKDIR /app/web

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app/web
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/web/.next ./.next
COPY --from=build /app/web/public ./public
COPY --from=build /app/web/node_modules ./node_modules
COPY --from=build /app/web/package.json ./package.json
COPY --from=build /app/web/next.config.ts ./next.config.ts

EXPOSE 80
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "80"]
