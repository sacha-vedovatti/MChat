//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Authentication
//

use crate::{
    app_state::AppState,
    error::{AppError, Result},
    models::{PublicUser, UserRecord, UserRole}
};

use axum::{
    extract::FromRequestParts,
    http::{header::AUTHORIZATION, request::Parts}
};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub exp: usize,
}

#[derive(Debug, Clone)]
pub struct CurrentUser {
    pub id: String,
    pub role: UserRole,
}

impl FromRequestParts<AppState> for CurrentUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self> {
        let token = bearer_token(parts)?;
        let claims = decode::<Claims>(&token, &DecodingKey::from_secret(state.jwt_secret.as_bytes()), &Validation::default())?;
        let user = sqlx::query_as::<_, UserRecord>(
            r#"
            SELECT id, email, username, password, avatar_url, role, created_at
            FROM "User"
            WHERE id = $1
            "#,
        )
        .bind(claims.claims.sub)
        .fetch_one(&state.pool)
        .await?;

        Ok(Self { id: user.id, role: user.role })
    }
}

fn bearer_token(parts: &Parts) -> Result<String> {
    let header = parts.headers
        .get(AUTHORIZATION)
        .ok_or_else(|| AppError::Unauthorized("missing authorization header".to_string()))?;
    let value = header.to_str()
        .map_err(|_| AppError::Unauthorized("invalid authorization header".to_string()))?;

    value.strip_prefix("Bearer ")
        .map(|token| token.trim().to_string())
        .filter(|token| !token.is_empty())
        .ok_or_else(|| AppError::Unauthorized("missing bearer token".to_string()))
}

pub fn hash_password(password: &str) -> Result<String> {
    Ok(hash(password, DEFAULT_COST)?)
}

pub fn verify_password(password: &str, hashed_password: &str) -> Result<bool> {
    Ok(verify(password, hashed_password)?)
}

pub fn generate_token(user_id: &str, jwt_secret: &str) -> Result<String> {
    let expiration = Utc::now() + Duration::hours(1);
    let claims = Claims {
        sub: user_id.to_string(),
        exp: expiration.timestamp() as usize
    };

    Ok(encode(&Header::default(), &claims, &EncodingKey::from_secret(jwt_secret.as_bytes()))?)
}

pub async fn load_public_user(state: &AppState, user_id: &str) -> Result<PublicUser> {
    let user = sqlx::query_as::<_, PublicUser>(
        r#"
        SELECT id, email, username, avatar_url
        FROM "User"
        WHERE id = $1
        "#,
    )
    .bind(user_id)
    .fetch_one(&state.pool)
    .await?;

    Ok(user)
}

pub async fn require_admin(user: &CurrentUser) -> Result<()> {
    if user.role == UserRole::ADMIN {
        Ok(())
    } else {
        Err(AppError::Forbidden("admin privileges required".to_string()))
    }
}
