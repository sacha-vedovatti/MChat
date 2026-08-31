//
// EPITECH PROJECT, 2026
// MChat
// File description:
// User routes => /users
//

use crate::{
    app_state::AppState,
    auth::{load_public_user, require_admin, CurrentUser},
    error::{AppError, Result},
    models::PublicUser,
};

use axum::{extract::{Extension, Path}, routing::get, Json, Router};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateUserBody {
    pub email: String,
    pub username: String,
    pub password: String,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserBody {
    pub email: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub avatar_url: Option<String>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/users/me", get(get_me).put(update_me))
        .route("/users", get(get_users).post(create_user))
        .route("/users/{user_id}", get(get_user).put(update_user).delete(delete_user))
        .route("/user/me", get(get_me).put(update_me))
        .route("/user", get(get_users).post(create_user))
        .route("/user/{user_id}", get(get_user).put(update_user).delete(delete_user))
}

#[utoipa::path(
    get,
    path = "/users/me",
    tag = "Users",
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "Current user", body = crate::doc::schemas::PublicUser),
        (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse)
    )
)]
pub(crate) async fn get_me(Extension(state): Extension<AppState>, user: CurrentUser) -> Result<Json<PublicUser>> {
    Ok(Json(load_public_user(&state, &user.id).await?))
}

#[utoipa::path(
    put,
    path = "/users/me",
    tag = "Users",
    security(("bearer_auth" = [])),
    request_body = crate::doc::schemas::UpdateUserBody,
    responses(
        (status = 200, description = "Updated current user", body = crate::doc::schemas::PublicUser),
        (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse)
    )
)]
pub(crate) async fn update_me(Extension(state): Extension<AppState>, user: CurrentUser, Json(body): Json<UpdateUserBody>) -> Result<Json<PublicUser>> {
    update_user_common(&state, &user.id, body).await
}

#[utoipa::path(
    get,
    path = "/users",
    tag = "Users",
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "All users (admin only)", body = [crate::doc::schemas::PublicUser]),
        (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
        (status = 403, description = "Admin privileges required", body = crate::doc::schemas::ErrorResponse)
    )
)]
pub(crate) async fn get_users(Extension(state): Extension<AppState>, user: CurrentUser) -> Result<Json<Vec<PublicUser>>> {
    require_admin(&user).await?;
    let users = sqlx::query_as::<_, PublicUser>(
        r#"
        SELECT id, email, username, avatar_url
        FROM "User"
        ORDER BY created_at ASC
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(users))
}

#[utoipa::path(
    get,
    path = "/users/{user_id}",
    tag = "Users",
    security(("bearer_auth" = [])),
    params(("user_id" = String, Path, description = "User UUID")),
    responses(
        (status = 200, description = "User", body = crate::doc::schemas::PublicUser),
        (status = 400, description = "Invalid user id", body = crate::doc::schemas::ErrorResponse),
        (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
        (status = 404, description = "User not found", body = crate::doc::schemas::ErrorResponse)
    )
)]
pub(crate) async fn get_user(Extension(state): Extension<AppState>, user: CurrentUser, Path(user_id): Path<String>) -> Result<Json<PublicUser>> {
    // require_admin(&user).await?;
    validate_uuid(&user_id)?;
    Ok(Json(load_public_user(&state, &user_id).await?))
}

#[utoipa::path(
    post,
    path = "/users",
    tag = "Users",
    security(("bearer_auth" = [])),
    request_body = crate::doc::schemas::CreateUserBody,
    responses(
        (status = 200, description = "Created user", body = crate::doc::schemas::PublicUser),
        (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
        (status = 409, description = "User already exists", body = crate::doc::schemas::ErrorResponse)
    )
)]
pub(crate) async fn create_user(Extension(state): Extension<AppState>, user: CurrentUser, Json(body): Json<CreateUserBody>) -> Result<Json<PublicUser>> {
    // require_admin(&user).await?;
    let user_id = Uuid::new_v4().to_string();
    let password = crate::auth::hash_password(&body.password)?;

    sqlx::query(
        r#"
        INSERT INTO "User" (id, email, username, password, avatar_url)
        VALUES ($1, $2, $3, $4, $5)
        "#,
    )
    .bind(&user_id)
    .bind(&body.email)
    .bind(&body.username)
    .bind(password)
    .bind(&body.avatar_url)
    .execute(&state.pool)
    .await?;

    Ok(Json(load_public_user(&state, &user_id).await?))
}

#[utoipa::path(
    put,
    path = "/users/{user_id}",
    tag = "Users",
    security(("bearer_auth" = [])),
    params(("user_id" = String, Path, description = "User UUID")),
    request_body = crate::doc::schemas::UpdateUserBody,
    responses(
        (status = 200, description = "Updated user", body = crate::doc::schemas::PublicUser),
        (status = 400, description = "Invalid user id", body = crate::doc::schemas::ErrorResponse),
        (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
        (status = 403, description = "Admin privileges required", body = crate::doc::schemas::ErrorResponse),
        (status = 404, description = "User not found", body = crate::doc::schemas::ErrorResponse)
    )
)]
pub(crate) async fn update_user(Extension(state): Extension<AppState>, user: CurrentUser, Path(user_id): Path<String>, Json(body): Json<UpdateUserBody>) -> Result<Json<PublicUser>> {
    require_admin(&user).await?;
    validate_uuid(&user_id)?;
    update_user_common(&state, &user_id, body).await
}

#[utoipa::path(
    delete,
    path = "/users/{user_id}",
    tag = "Users",
    security(("bearer_auth" = [])),
    params(("user_id" = String, Path, description = "User UUID")),
    responses(
        (status = 200, description = "Deleted user", body = crate::doc::schemas::PublicUser),
        (status = 400, description = "Invalid user id", body = crate::doc::schemas::ErrorResponse),
        (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
        (status = 403, description = "Admin privileges required", body = crate::doc::schemas::ErrorResponse),
        (status = 404, description = "User not found", body = crate::doc::schemas::ErrorResponse)
    )
)]
pub(crate) async fn delete_user(Extension(state): Extension<AppState>, user: CurrentUser, Path(user_id): Path<String>) -> Result<Json<PublicUser>> {
    require_admin(&user).await?;
    validate_uuid(&user_id)?;

    let deleted = sqlx::query_as::<_, PublicUser>(
        r#"
        DELETE FROM "User"
        WHERE id = $1
        RETURNING id, email, username, avatar_url
        "#,
    )
    .bind(&user_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("user not found".to_string()))?;

    Ok(Json(deleted))
}

async fn update_user_common(state: &AppState, user_id: &str, body: UpdateUserBody) -> Result<Json<PublicUser>> {
    let UpdateUserBody {
        email,
        username,
        password,
        avatar_url
    } = body;

    let password = match password {
        Some(password) => Some(crate::auth::hash_password(&password)?),
        None => None,
    };

    let user = sqlx::query_as::<_, PublicUser>(
        r#"
        UPDATE "User"
        SET
            email = COALESCE($2, email),
            username = COALESCE($3, username),
            password = COALESCE($4, password),
            avatar_url = COALESCE($5, avatar_url)
        WHERE id = $1
        RETURNING id, email, username, avatar_url
        "#,
    )
    .bind(user_id)
    .bind(email)
    .bind(username)
    .bind(password)
    .bind(avatar_url)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("user not found".to_string()))?;

    Ok(Json(user))
}

fn validate_uuid(value: &str) -> Result<()> {
    Uuid::parse_str(value).map_err(|_| AppError::BadRequest("invalid user id".to_string()))?;
    Ok(())
}
