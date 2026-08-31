//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Members routes
//

use crate::{
    app_state::AppState,
    auth::CurrentUser,
    error::{AppError, Result},
    models::{ServerMemberRecord, ServerMemberResponse, ServerPermission, ServerRoleResponse},
    permissions::{load_server_access, load_server_default_role},
};

use axum::{extract::{Extension, Path}, routing::{get, put}, Json, Router};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct UpdateMemberBody {
    pub role_id: Option<i32>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/servers/{server_id}/members", get(get_members).post(join_server))
        .route("/servers/{server_id}/members/{user_id}", put(update_member_role).delete(kick_member))
}

#[utoipa::path(get, path = "/servers/{server_id}/members", tag = "Members", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID")),
    responses((status = 200, description = "Server members", body = [crate::doc::schemas::ServerMember]),
              (status = 400, description = "Invalid server id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "View channel permission required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn get_members(Extension(state): Extension<AppState>, user: CurrentUser, Path(server_id): Path<String>) -> Result<Json<Vec<ServerMemberResponse>>> {
    validate_uuid(&server_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.can(ServerPermission::VIEW_CHANNEL) {
        return Err(AppError::Forbidden("view channel permission required".to_string()));
    }

    Ok(Json(load_members(&state, &server_id).await?))
}

#[utoipa::path(post, path = "/servers/{server_id}/members", tag = "Members", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID")),
    responses((status = 200, description = "Joined server", body = crate::doc::schemas::ServerMember),
              (status = 400, description = "Invalid server id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 409, description = "Already a member", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn join_server(Extension(state): Extension<AppState>, user: CurrentUser, Path(server_id): Path<String>) -> Result<Json<ServerMemberResponse>> {
    validate_uuid(&server_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if access.is_owner || access.member_role_id.is_some() {
        return Err(AppError::Conflict("already a member".to_string()));
    }

    let default_role = load_server_default_role(&state, &server_id).await?;
    sqlx::query(
        r#"
        INSERT INTO "ServerUser" (server_id, user_id, role_id)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(&server_id)
    .bind(&user.id)
    .bind(default_role.as_ref().map(|role| role.id))
    .execute(&state.pool)
    .await?;

    load_member(&state, &server_id, &user.id).await
}

#[utoipa::path(put, path = "/servers/{server_id}/members/{user_id}", tag = "Members", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID"), ("user_id" = String, Path, description = "Target user UUID")),
    request_body = crate::doc::schemas::UpdateMemberBody,
    responses((status = 200, description = "Updated member role", body = crate::doc::schemas::ServerMember),
              (status = 400, description = "Invalid id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Manage roles permission required", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Member or role not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn update_member_role(Extension(state): Extension<AppState>, user: CurrentUser, Path((server_id, target_user_id)): Path<(String, String)>, Json(body): Json<UpdateMemberBody>) -> Result<Json<ServerMemberResponse>> {
    validate_uuid(&server_id)?;
    validate_uuid(&target_user_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if access.server.owner_id == target_user_id && !access.is_owner {
        return Err(AppError::Forbidden("Permission missing.".to_string()));
    }
    if !access.can(ServerPermission::MANAGE_ROLES) {
        return Err(AppError::Forbidden("manage roles permission required".to_string()));
    }

    if let Some(role_id) = body.role_id {
        let role_exists = sqlx::query_scalar::<_, i32>(
            r#"
            SELECT id
            FROM "ServerRole"
            WHERE id = $1 AND server_id = $2
            "#,
        )
        .bind(role_id)
        .bind(&server_id)
        .fetch_optional(&state.pool)
        .await?;

        if role_exists.is_none() {
            return Err(AppError::NotFound("role not found".to_string()));
        }
    }

    sqlx::query(
        r#"
        UPDATE "ServerUser"
        SET role_id = $3
        WHERE server_id = $1 AND user_id = $2
        "#,
    )
    .bind(&server_id)
    .bind(&target_user_id)
    .bind(body.role_id)
    .execute(&state.pool)
    .await?;

    load_member(&state, &server_id, &target_user_id).await
}

#[utoipa::path(delete, path = "/servers/{server_id}/members/{user_id}", tag = "Members", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID"), ("user_id" = String, Path, description = "Target user UUID")),
    responses((status = 200, description = "Removed member", body = crate::doc::schemas::ServerMember),
              (status = 400, description = "Invalid id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Kick permission required", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Member not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn kick_member(Extension(state): Extension<AppState>, user: CurrentUser, Path((server_id, target_user_id)): Path<(String, String)>) -> Result<Json<ServerMemberResponse>> {
    validate_uuid(&server_id)?;
    validate_uuid(&target_user_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if access.server.owner_id == target_user_id {
        return Err(AppError::Forbidden("Permission missing.".to_string()));
    }

    let is_self_leave = target_user_id == user.id;
    if !is_self_leave && !access.can(ServerPermission::KICK_MEMBERS) {
        return Err(AppError::Forbidden("kick members permission required".to_string()));
    }

    let existing = load_member(&state, &server_id, &target_user_id).await?;
    let removed = sqlx::query(
        r#"
        DELETE FROM "ServerUser"
        WHERE server_id = $1 AND user_id = $2
        "#,
    )
    .bind(&server_id)
    .bind(&target_user_id)
    .execute(&state.pool)
    .await?;

    if removed.rows_affected() == 0 {
        return Err(AppError::NotFound("member not found".to_string()));
    }
    Ok(existing)
}

async fn load_members(state: &AppState, server_id: &str) -> Result<Vec<ServerMemberResponse>> {
    let rows = sqlx::query_as::<_, ServerMemberRecord>(
        r#"
        SELECT server_id, user_id, role_id, joined_at
        FROM "ServerUser"
        WHERE server_id = $1
        ORDER BY joined_at ASC
        "#,
    )
    .bind(server_id)
    .fetch_all(&state.pool)
    .await?;

    let roles = sqlx::query_as::<_, crate::models::ServerRoleRecord>(
        r#"
        SELECT id, server_id, name, permissions, is_default, position, created_at
        FROM "ServerRole"
        WHERE server_id = $1
        "#,
    )
    .bind(server_id)
    .fetch_all(&state.pool)
    .await?;

    let mut members = Vec::with_capacity(rows.len());
    for row in rows {
        let user = crate::auth::load_public_user(state, &row.user_id).await?;
        let role = row
            .role_id
            .and_then(|role_id| roles.iter().find(|role| role.id == role_id).cloned())
            .map(ServerRoleResponse::from);

        members.push(ServerMemberResponse {
            user,
            role,
            joined_at: row.joined_at,
        });
    }

    Ok(members)
}

async fn load_member(state: &AppState, server_id: &str, user_id: &str) -> Result<Json<ServerMemberResponse>> {
    let member = load_members(state, server_id)
        .await?
        .into_iter()
        .find(|member| member.user.id == user_id)
        .ok_or_else(|| AppError::NotFound("member not found".to_string()))?;

    Ok(Json(member))
}

fn validate_uuid(value: &str) -> Result<()> {
    Uuid::parse_str(value).map_err(|_| AppError::BadRequest("invalid id".to_string()))?;
    Ok(())
}
