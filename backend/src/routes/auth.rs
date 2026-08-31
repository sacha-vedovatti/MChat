//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Authentication routes
//

use crate::{
    app_state::AppState,
    auth::{generate_token, hash_password, verify_password},
    error::{AppError, Result},
    models::UserRecord,
};

use axum::{extract::Extension, routing::post, Json, Router};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct RegisterBody {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginBody {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct TokenResponse {
    pub token: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub id: String,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
}

#[utoipa::path(post, path = "/auth/register", tag = "Auth", request_body = crate::doc::schemas::RegisterBody,
    responses(
        (status = 200, description = "User registered successfully", body = crate::doc::schemas::TokenResponse),
        (status = 409, description = "A user with this email already exists", body = crate::doc::schemas::ErrorResponse),
        (status = 400, description = "Invalid request", body = crate::doc::schemas::ErrorResponse)
    )
)]
pub(crate) async fn register(Extension(state): Extension<AppState>, Json(body): Json<RegisterBody>) -> Result<Json<TokenResponse>> {
    let existing = sqlx::query_scalar::<_, String>(r#"SELECT id FROM "User" WHERE email = $1"#)
        .bind(&body.email)
        .fetch_optional(&state.pool)
        .await?;
    if existing.is_some() {
        return Err(AppError::Conflict("user already exists".to_string()));
    }

    let password = hash_password(&body.password)?;
    let user_id = uuid::Uuid::new_v4().to_string();

    sqlx::query(
        r#"
        INSERT INTO "User" (id, email, username, password)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(&user_id)
    .bind(&body.email)
    .bind(&body.username)
    .bind(password)
    .execute(&state.pool)
    .await?;

    Ok(Json(TokenResponse {
        token: generate_token(&user_id, &state.jwt_secret)?,
    }))
}

#[utoipa::path(post, path = "/auth/login", tag = "Auth", request_body = crate::doc::schemas::LoginBody,
    responses(
        (status = 200, description = "Successfully authenticated", body = crate::doc::schemas::LoginResponse),
        (status = 401, description = "Invalid credentials", body = crate::doc::schemas::ErrorResponse)
    )
)]
pub(crate) async fn login(Extension(state): Extension<AppState>, Json(body): Json<LoginBody>) -> Result<Json<LoginResponse>> {
    let user = sqlx::query_as::<_, UserRecord>(
        r#"
        SELECT id, email, username, password, avatar_url, role, created_at
        FROM "User"
        WHERE email = $1
        "#,
    )
    .bind(&body.email)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::Unauthorized("invalid credentials".to_string()))?;

    if !verify_password(&body.password, &user.password)? {
        return Err(AppError::Unauthorized("invalid credentials".to_string()));
    }

    Ok(Json(LoginResponse {
        token: generate_token(&user.id, &state.jwt_secret)?,
        id: user.id,
    }))
}
