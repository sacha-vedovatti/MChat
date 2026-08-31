//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Basic routes
//

use crate::app_state::AppState;
use axum::{response::IntoResponse, routing::get, Router};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(root))
        .route("/health", get(health))
}

#[utoipa::path(get, path = "/", tag = "Health", responses((status = 200, description = "API is reachable", body = String, example = "Hello World!")))]
pub(crate) async fn root() -> impl IntoResponse {
    "Hello World!"
}

#[utoipa::path(get, path = "/health", tag = "Health", responses((status = 200, description = "API health status", body = String, example = "OK")))]
pub(crate) async fn health() -> impl IntoResponse {
    "OK"
}
