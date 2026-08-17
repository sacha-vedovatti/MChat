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

async fn get_roles(Extension(state): Extension<AppState>, user: CurrentUser, Path(server_id): Path<String>) -> Result<Json<Vec<ServerRoleResponse>>> {
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

async fn create_role(Extension(state): Extension<AppState>, user: CurrentUser, Path(server_id): Path<String>, Json(body): Json<CreateRoleBody>) -> Result<Json<ServerRoleResponse>> {
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
    .bind(body.permissions.into_iter().map(|permission| permission.as_str().to_string()).collect::<Vec<_>>())
    .bind(position)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(ServerRoleResponse::from(role)))
}

async fn update_role(Extension(state): Extension<AppState>, user: CurrentUser, Path((server_id, role_id)): Path<(String, i32)>, Json(body): Json<UpdateRoleBody>) -> Result<Json<ServerRoleResponse>> {
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
    .bind(body.permissions.map(|permissions| permissions.into_iter().map(|permission| permission.as_str().to_string()).collect::<Vec<_>>()))
    .bind(body.position)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(ServerRoleResponse::from(role)))
}

async fn delete_role(Extension(state): Extension<AppState>, user: CurrentUser, Path((server_id, role_id)): Path<(String, i32)>) -> Result<Json<ServerRoleResponse>> {
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
