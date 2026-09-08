//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Permission middleware
//

use crate::{
    app_state::AppState,
    error::{AppError, Result},
    models::{ServerPermission, ServerRoleRecord, ServerSummary},
};

use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct ServerAccessRow {
    pub id: String,
    pub owner_id: String,
    pub name: String,
    pub created_at: chrono::NaiveDateTime,
    pub member_role_id: Option<i32>,
    pub permissions: Option<Vec<ServerPermission>>
}

#[derive(Debug, Clone)]
pub struct ServerAccess {
    pub server: ServerSummary,
    pub member_role_id: Option<i32>,
    pub permissions: Vec<ServerPermission>,
    pub is_owner: bool
}

impl ServerAccess {
    pub fn can(&self, required: ServerPermission) -> bool {
        self.is_owner
            || self.permissions.contains(&ServerPermission::OWNER)
            || self.permissions.contains(&ServerPermission::ADMIN)
            || self.permissions.contains(&required)
    }
}

pub fn can_user_admin_all(role_permissions: &[ServerPermission], required: ServerPermission) -> bool {
    role_permissions.contains(&ServerPermission::OWNER)
        || role_permissions.contains(&ServerPermission::ADMIN)
        || role_permissions.contains(&required)
}

pub async fn load_server_access(state: &AppState, server_id: &str, user_id: &str) -> Result<ServerAccess> {
    let row = sqlx::query_as::<_, ServerAccessRow>(
        r#"
        SELECT
            s.id,
            s.owner_id,
            s.name,
            s.created_at,
            (
                SELECT sur.role_id
                FROM "ServerUserRole" sur
                JOIN "ServerRole" sr ON sr.id = sur.role_id
                WHERE sur.server_id = s.id AND sur.user_id = $2
                ORDER BY sr.position ASC, sr.id ASC
                LIMIT 1
            ) AS member_role_id,
            NULL::"ServerPermissions"[] AS permissions
        FROM "Server" s
        WHERE s.id = $1
        "#,
    )
    .bind(server_id)
    .bind(user_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("server not found".to_string()))?;

    let permissions = sqlx::query_scalar::<_, Option<Vec<ServerPermission>>>(
        r#"
        SELECT COALESCE(array_agg(permission), ARRAY[]::"ServerPermissions"[])
        FROM (
            SELECT DISTINCT unnest(sr.permissions) AS permission
            FROM "ServerUserRole" sur
            JOIN "ServerRole" sr ON sr.id = sur.role_id
            WHERE sur.server_id = $1 AND sur.user_id = $2
        ) permissions
        "#,
    )
    .bind(server_id)
    .bind(user_id)
    .fetch_one(&state.pool)
    .await?
    .unwrap_or_default();

    Ok(ServerAccess {
        server: ServerSummary {
            id: row.id.clone(),
            owner_id: row.owner_id.clone(),
            name: row.name,
            created_at: row.created_at
        },
        member_role_id: row.member_role_id,
        permissions,
        is_owner: row.owner_id == user_id
    })
}

#[derive(Debug, Clone, FromRow)]
pub struct ChannelAccessRow {
    pub channel_id: String,
    pub server_id: String
}

pub async fn load_channel_server_id(state: &AppState, channel_id: &str) -> Result<String> {
    let row = sqlx::query_as::<_, ChannelAccessRow>(
        r#"
        SELECT id AS channel_id, server_id
        FROM "Channel"
        WHERE id = $1
        "#,
    )
    .bind(channel_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("channel not found".to_string()))?;

    Ok(row.server_id)
}

pub async fn load_server_default_role(state: &AppState, server_id: &str) -> Result<Option<ServerRoleRecord>> {
    let role = sqlx::query_as::<_, ServerRoleRecord>(
        r#"
        SELECT id, server_id, name, color, permissions, is_default, position, created_at
        FROM "ServerRole"
        WHERE server_id = $1 AND is_default = true
        ORDER BY position ASC, id ASC
        LIMIT 1
        "#,
    )
    .bind(server_id)
    .fetch_optional(&state.pool)
    .await?;

    Ok(role)
}
