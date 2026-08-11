FROM rust:1-bookworm AS build

WORKDIR /app/backend

RUN apt-get update \
	&& apt-get install -y --no-install-recommends pkg-config libssl-dev ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY Cargo.toml ./
COPY Cargo.lock ./
COPY migrations ./migrations
COPY src ./src

RUN cargo build --release


FROM debian:bookworm-slim AS runtime

WORKDIR /app/backend

ENV NODE_ENV=production

RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates openssl \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=build /app/backend/target/release/mchat-backend /app/backend/mchat-backend
COPY --from=build /app/backend/migrations /app/backend/migrations

EXPOSE 3000

CMD ["/app/backend/mchat-backend"]
