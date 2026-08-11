use crate::app_state::AppState;
use axum::{response::IntoResponse, routing::get, Router};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(root))
        .route("/health", get(health))
}

async fn root() -> impl IntoResponse {
    "Hello World!"
}

async fn health() -> impl IntoResponse {
    "OK"
}
