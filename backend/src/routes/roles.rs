//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Roles routes
//

use crate::{
    app_state::AppState,
    auth::CurrentUser,
    error::{AppError, Result},
    models::{ServerPermission, ServerRoleRecord, ServerRoleResponse},
    permissions::{load_server_access, load_server_default_role},
};
use axum::{extract::{Extension, Path}, routing::{get, put}, Json, Router};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateRoleBody {
    pub name: String,
    pub permissions: Vec<ServerPermission>,
    pub position: Option<i32>
}

#[derive(Debug, Deserialize)]
pub struct UpdateRoleBody {
    pub name: Option<String>,
    pub permissions: Option<Vec<ServerPermission>>,
    pub position: Option<i32>
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/servers/{server_id}/roles", get(get_roles).post(create_role))
        .route("/servers/{server_id}/roles/{role_id}", put(update_role).delete(delete_role))
}

#[utoipa::path(get, path = "/servers/{server_id}/roles", tag = "Roles", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID")),
    responses((status = 200, description = "Server roles", body = [crate::doc::schemas::ServerRole]),
              (status = 400, description = "Invalid server id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "View channel permission required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn get_roles(Extension(state): Extension<AppState>, user: CurrentUser, Path(server_id): Path<String>) -> Result<Json<Vec<ServerRoleResponse>>> {
    validate_uuid(&server_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.can(ServerPermission::VIEW_CHANNEL) {
        return Err(AppError::Forbidden("view channel permission required".to_string()));
    }

    let roles = sqlx::query_as::<_, ServerRoleRecord>(
        r#"
        SELECT id, server_id, name, permissions, is_default, position, created_at
        FROM "ServerRole"
        WHERE server_id = $1
        ORDER BY position ASC, id ASC
        "#,
    )
    .bind(&server_id)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(roles.into_iter().map(ServerRoleResponse::from).collect()))
}

fn contains_privileged_permission(permissions: &[ServerPermission]) -> bool {
    permissions.iter().any(|p| matches!(p, ServerPermission::OWNER | ServerPermission::ADMIN))
}

#[utoipa::path(post, path = "/servers/{server_id}/roles", tag = "Roles", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID")), request_body = crate::doc::schemas::CreateRoleBody,
    responses((status = 200, description = "Created role", body = crate::doc::schemas::ServerRole),
              (status = 400, description = "Invalid server id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Manage roles permission required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn create_role(Extension(state): Extension<AppState>, user: CurrentUser, Path(server_id): Path<String>, Json(body): Json<CreateRoleBody>) -> Result<Json<ServerRoleResponse>> {
    validate_uuid(&server_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.can(ServerPermission::MANAGE_ROLES) {
        return Err(AppError::Forbidden("'MANAGE_ROLES' permission required".to_string()));
    }
    if !access.is_owner && contains_privileged_permission(&body.permissions) {
        return Err(AppError::Forbidden("Permission missing.".to_string()))
    }

    let position = body.position.unwrap_or(0);
    let role = sqlx::query_as::<_, ServerRoleRecord>(
        r#"
        INSERT INTO "ServerRole" (server_id, name, permissions, position, is_default)
        VALUES ($1, $2, $3, $4, false)
        RETURNING id, server_id, name, permissions, is_default, position, created_at
        "#,
    )
    .bind(&server_id)
    .bind(&body.name)
    .bind(body.permissions)
    .bind(position)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(ServerRoleResponse::from(role)))
}

#[utoipa::path(put, path = "/servers/{server_id}/roles/{role_id}", tag = "Roles", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID"), ("role_id" = i32, Path, description = "Role id")),
    request_body = crate::doc::schemas::UpdateRoleBody,
    responses((status = 200, description = "Updated role", body = crate::doc::schemas::ServerRole),
              (status = 400, description = "Invalid server id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Manage roles permission required", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Role not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn update_role(Extension(state): Extension<AppState>, user: CurrentUser, Path((server_id, role_id)): Path<(String, i32)>, Json(body): Json<UpdateRoleBody>) -> Result<Json<ServerRoleResponse>> {
    validate_uuid(&server_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.can(ServerPermission::MANAGE_ROLES) {
        return Err(AppError::Forbidden("'MANAGE_ROLES' permission required".to_string()));
    }
    if !access.is_owner && contains_privileged_permission(&body.permissions.as_deref().unwrap_or(&[])) {
        return Err(AppError::Forbidden("Permission missing.".to_string()))
    }

    let role = sqlx::query_as::<_, ServerRoleRecord>(
        r#"
        UPDATE "ServerRole"
        SET
            name = COALESCE($3, name),
            permissions = COALESCE($4, permissions),
            position = COALESCE($5, position)
        WHERE id = $1 AND server_id = $2
        RETURNING id, server_id, name, permissions, is_default, position, created_at
        "#,
    )
    .bind(role_id)
    .bind(&server_id)
    .bind(body.name)
    .bind(body.permissions)
    .bind(body.position)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(ServerRoleResponse::from(role)))
}

#[utoipa::path(delete, path = "/servers/{server_id}/roles/{role_id}", tag = "Roles", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID"), ("role_id" = i32, Path, description = "Role id")),
    responses((status = 200, description = "Deleted role", body = crate::doc::schemas::ServerRole),
              (status = 400, description = "Invalid server id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Manage roles permission required", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Role not found", body = crate::doc::schemas::ErrorResponse),
              (status = 409, description = "Default role cannot be deleted", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn delete_role(Extension(state): Extension<AppState>, user: CurrentUser, Path((server_id, role_id)): Path<(String, i32)>) -> Result<Json<ServerRoleResponse>> {
    validate_uuid(&server_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.can(ServerPermission::MANAGE_ROLES) {
        return Err(AppError::Forbidden("'MANAGE_ROLES' permission required".to_string()));
    }

    let role = sqlx::query_as::<_, ServerRoleRecord>(
        r#"
        SELECT id, server_id, name, permissions, is_default, position, created_at
        FROM "ServerRole"
        WHERE id = $1 AND server_id = $2
        "#,
    ).bind(role_id)
    .bind(&server_id)
    .fetch_one(&state.pool)
    .await?;

    if role.is_default {
        return Err(AppError::Conflict("default role cannot be deleted".to_string()));
    }
    if let Some(default_role) = load_server_default_role(&state, &server_id).await? {
        sqlx::query(
            r#"
            UPDATE "ServerUser"
            SET role_id = $3
            WHERE server_id = $1 AND role_id = $2
            "#,
        )
        .bind(&server_id)
        .bind(role_id)
        .bind(default_role.id)
        .execute(&state.pool)
        .await?;
    }

    let deleted = sqlx::query_as::<_, ServerRoleRecord>(
        r#"
        DELETE FROM "ServerRole"
        WHERE id = $1 AND server_id = $2
        RETURNING id, server_id, name, permissions, is_default, position, created_at
        "#,
    )
    .bind(role_id)
    .bind(&server_id)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(ServerRoleResponse::from(deleted)))
}

fn validate_uuid(value: &str) -> Result<()> {
    Uuid::parse_str(value).map_err(|_| AppError::BadRequest("invalid server id".to_string()))?;
    Ok(())
}
