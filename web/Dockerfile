FROM node:22-bookworm-slim AS build

WORKDIR /app/web

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build


FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web/dist /usr/share/nginx/html

EXPOSE 80
