//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Main file
//

mod app_state;
mod auth;
mod error;
mod models;
mod permissions;
mod routes;

use crate::app_state::AppState;
use anyhow::Context;
use axum::Extension;
use sqlx::postgres::PgPoolOptions;
use std::{env, net::SocketAddr};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = env::var("DATABASE_URL").context("DATABASE_URL is not defined")?;
    let jwt_secret = env::var("JWT_SECRET").context("JWT_SECRET is not defined")?;
    let port = env::var("PORT").ok().and_then(|value| value.parse::<u16>().ok()).unwrap_or(3000);
    let pool = PgPoolOptions::new().max_connections(10).connect(&database_url).await.context("failed to connect to PostgreSQL")?;
    sqlx::migrate!("./migrations").run(&pool).await.context("failed to run database migrations")?;

    let state = AppState::new(pool, jwt_secret);
    let app = routes::router()
        .layer(Extension(state.clone()))
        .layer(CorsLayer::permissive().allow_credentials(false))
        .layer(TraceLayer::new_for_http())
        .with_state(state);
    let address = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(address).await.context("failed to bind TCP listener")?;
    axum::serve(listener, app).await.context("server error")?;
    Ok(())
}
