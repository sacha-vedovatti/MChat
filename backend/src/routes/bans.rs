//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Server ban routes
//

use crate::{
    app_state::AppState,
    auth::{load_public_user, CurrentUser},
    error::{AppError, Result},
    models::{ServerBanResponse, ServerPermission},
    permissions::load_server_access,
};

use axum::{extract::{Extension, Path}, routing::{get, post}, Json, Router};
use chrono::NaiveDateTime;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow)]
struct ServerBanRecord {
    server_id: String,
    user_id: String,
    banned_by: String,
    created_at: NaiveDateTime,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/servers/{server_id}/bans", get(list_bans))
        .route("/servers/{server_id}/bans/{user_id}", post(ban_user).delete(unban_user))
}

#[utoipa::path(
    post, path = "/servers/{server_id}/bans/{user_id}", tag = "Bans", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID"), ("user_id" = String, Path, description = "User UUID")),
    responses((status = 200, description = "User banned", body = crate::doc::schemas::ServerBan),
              (status = 400, description = "Invalid id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Ban members permission required", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "User not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn ban_user(
    Extension(state): Extension<AppState>,
    user: CurrentUser,
    Path((server_id, target_user_id)): Path<(String, String)>,
) -> Result<Json<ServerBanResponse>> {
    validate_uuid(&server_id)?;
    validate_uuid(&target_user_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if access.server.owner_id == target_user_id || target_user_id == user.id {
        return Err(AppError::Forbidden("cannot ban the server owner or yourself".to_string()));
    }
    if !access.can(ServerPermission::BAN_MEMBERS) {
        return Err(AppError::Forbidden("ban members permission required".to_string()));
    }

    load_public_user(&state, &target_user_id).await?;
    let mut transaction = state.pool.begin().await?;
    let ban = sqlx::query_as::<_, ServerBanRecord>(
        r#"
        INSERT INTO "ServerBan" (server_id, user_id, banned_by)
        VALUES ($1, $2, $3)
        RETURNING server_id, user_id, banned_by, created_at
        "#,
    )
    .bind(&server_id)
    .bind(&target_user_id)
    .bind(&user.id)
    .fetch_one(&mut *transaction)
    .await?;

    sqlx::query("DELETE FROM \"ServerUser\" WHERE server_id = $1 AND user_id = $2")
        .bind(&server_id)
        .bind(&target_user_id)
        .execute(&mut *transaction)
        .await?;
    transaction.commit().await?;

    Ok(Json(load_ban_response(&state, ban).await?))
}

#[utoipa::path(
    delete, path = "/servers/{server_id}/bans/{user_id}", tag = "Bans", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID"), ("user_id" = String, Path, description = "User UUID")),
    responses((status = 200, description = "User unbanned", body = crate::doc::schemas::ServerBan),
              (status = 400, description = "Invalid id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Ban members permission required", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Ban not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn unban_user(
    Extension(state): Extension<AppState>,
    user: CurrentUser,
    Path((server_id, target_user_id)): Path<(String, String)>,
) -> Result<Json<ServerBanResponse>> {
    validate_uuid(&server_id)?;
    validate_uuid(&target_user_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.can(ServerPermission::BAN_MEMBERS) {
        return Err(AppError::Forbidden("ban members permission required".to_string()));
    }

    let ban = sqlx::query_as::<_, ServerBanRecord>(
        r#"
        DELETE FROM "ServerBan"
        WHERE server_id = $1 AND user_id = $2
        RETURNING server_id, user_id, banned_by, created_at
        "#,
    )
    .bind(&server_id)
    .bind(&target_user_id)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(load_ban_response(&state, ban).await?))
}

#[utoipa::path(
    get, path = "/servers/{server_id}/bans", tag = "Bans", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID")),
    responses((status = 200, description = "Server bans", body = [crate::doc::schemas::ServerBan]),
              (status = 400, description = "Invalid server id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Ban members permission required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn list_bans(
    Extension(state): Extension<AppState>,
    user: CurrentUser,
    Path(server_id): Path<String>,
) -> Result<Json<Vec<ServerBanResponse>>> {
    validate_uuid(&server_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.can(ServerPermission::BAN_MEMBERS) {
        return Err(AppError::Forbidden("ban members permission required".to_string()));
    }

    let bans = sqlx::query_as::<_, ServerBanRecord>(
        r#"
        SELECT server_id, user_id, banned_by, created_at
        FROM "ServerBan"
        WHERE server_id = $1
        ORDER BY created_at ASC, user_id ASC
        "#,
    )
    .bind(&server_id)
    .fetch_all(&state.pool)
    .await?;

    let mut responses = Vec::with_capacity(bans.len());
    for ban in bans {
        responses.push(load_ban_response(&state, ban).await?);
    }
    Ok(Json(responses))
}

async fn load_ban_response(state: &AppState, ban: ServerBanRecord) -> Result<ServerBanResponse> {
    let user = load_public_user(state, &ban.user_id).await?;
    let banned_by = load_public_user(state, &ban.banned_by).await?;
    Ok(ServerBanResponse {
        server_id: ban.server_id,
        user,
        banned_by,
        created_at: ban.created_at,
    })
}

fn validate_uuid(value: &str) -> Result<()> {
    Uuid::parse_str(value).map_err(|_| AppError::BadRequest("invalid id".to_string()))?;
    Ok(())
}
