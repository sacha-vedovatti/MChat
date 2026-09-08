//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Server routes
//

use crate::{
    app_state::AppState,
    auth::{load_public_user, require_admin, CurrentUser},
    error::{AppError, Result},
    models::{ChannelRecord, ServerDetailResponse, ServerMemberResponse, ServerPermission, ServerRoleRecord, ServerRoleResponse, ServerSummary},
    permissions::load_server_access
};

use axum::{extract::{Extension, Path}, routing::get, Json, Router};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateServerBody {
    pub name: String
}

#[derive(Debug, Deserialize)]
pub struct UpdateServerBody {
    pub name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateChannelBody {
    pub name: String,
    pub description: Option<String>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/servers", get(get_servers).post(create_server))
        .route("/servers/me", get(get_my_servers))
        .route("/servers/{server_id}", get(get_server).put(update_server).delete(delete_server))
        .route("/servers/{server_id}/channels", get(get_server_channels).post(create_channel))
        .route("/server", get(get_servers).post(create_server))
        .route("/server/me", get(get_my_servers))
        .route("/server/{server_id}", get(get_server).put(update_server).delete(delete_server))
        .route("/server/{server_id}/channels", get(get_server_channels).post(create_channel))
}

#[utoipa::path(
    get, path = "/servers", tag = "Servers", security(("bearer_auth" = [])),
    responses((status = 200, description = "Servers visible to the current user", body = [crate::doc::schemas::ServerDetail]),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Admin privileges required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn get_servers(Extension(state): Extension<AppState>, user: CurrentUser) -> Result<Json<Vec<ServerDetailResponse>>> {
    require_admin(&user).await?;
    let server_ids = sqlx::query_scalar::<_, String>(
        r#"
        SELECT s.id
        FROM "Server" s
        INNER JOIN "ServerUser" su ON su.server_id = s.id
        WHERE su.user_id = $1
        ORDER BY s.created_at ASC
        "#,
    )
    .bind(&user.id)
    .fetch_all(&state.pool)
    .await?;

    let mut servers = Vec::with_capacity(server_ids.len());
    for server_id in server_ids {
        servers.push(load_server_detail(&state, &server_id).await?);
    }
    Ok(Json(servers))
}

#[utoipa::path(
    get, path = "/servers/me", tag = "Servers", security(("bearer_auth" = [])),
    responses((status = 200, description = "Servers the current user is a member of", body = [crate::doc::schemas::ServerDetail]),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn get_my_servers(Extension(state): Extension<AppState>, user: CurrentUser) -> Result<Json<Vec<ServerDetailResponse>>> {
    let server_ids = sqlx::query_scalar::<_, String>(
        r#"
        SELECT s.id
        FROM "Server" s
        INNER JOIN "ServerUser" su ON su.server_id = s.id
        WHERE su.user_id = $1
        ORDER BY s.created_at ASC
        "#,
    )
    .bind(&user.id)
    .fetch_all(&state.pool)
    .await?;

    let mut servers = Vec::with_capacity(server_ids.len());
    for server_id in server_ids {
        servers.push(load_server_detail(&state, &server_id).await?);
    }

    Ok(Json(servers))
}

#[utoipa::path(
    get, path = "/servers/{server_id}", tag = "Servers", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID")),
    responses((status = 200, description = "Server details", body = crate::doc::schemas::ServerDetail),
              (status = 400, description = "Invalid server id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Membership required", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Server not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn get_server(Extension(state): Extension<AppState>, user: CurrentUser, Path(server_id): Path<String>) -> Result<Json<ServerDetailResponse>> {
    validate_uuid(&server_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.is_owner && access.member_role_id.is_none() {
        return Err(AppError::Forbidden("membership required".to_string()));
    }
    Ok(Json(load_server_detail(&state, &access.server.id).await?))
}

#[utoipa::path(
    post, path = "/servers", tag = "Servers", security(("bearer_auth" = [])), request_body = crate::doc::schemas::CreateServerBody,
    responses((status = 200, description = "Created server", body = crate::doc::schemas::ServerSummary),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn create_server(Extension(state): Extension<AppState>, user: CurrentUser, Json(body): Json<CreateServerBody>) -> Result<Json<ServerSummary>> {
    let server_id = Uuid::new_v4().to_string();
    let mut transaction = state.pool.begin().await?;
    let server = sqlx::query_as::<_, ServerSummary>(
        r#"
        INSERT INTO "Server" (id, owner_id, name)
        VALUES ($1, $2, $3)
        RETURNING id, owner_id, name, created_at
        "#,
    )
    .bind(&server_id)
    .bind(&user.id)
    .bind(&body.name)
    .fetch_one(&mut *transaction)
    .await?;

    let role = sqlx::query_as::<_, ServerRoleRecord>(
        r#"
        INSERT INTO "ServerRole" (server_id, name, color, permissions, is_default, position)
        VALUES ($1, $2, '#99AAB5', $3, true, 0)
        RETURNING id, server_id, name, color, permissions, is_default, position, created_at
        "#,
    )
    .bind(&server.id)
    .bind("@everyone")
    .bind(vec![ServerPermission::VIEW_CHANNELS, ServerPermission::SEND_MESSAGES])
    .fetch_one(&mut *transaction)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO "ServerUser" (server_id, user_id)
        VALUES ($1, $2)
        "#,
    )
    .bind(&server.id)
    .bind(&user.id)
    .execute(&mut *transaction)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO "ServerUserRole" (server_id, user_id, role_id)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(&server.id)
    .bind(&user.id)
    .bind(role.id)
    .execute(&mut *transaction)
    .await?;

    transaction.commit().await?;
    Ok(Json(server))
}

#[utoipa::path(
    put, path = "/servers/{server_id}", tag = "Servers", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID")), request_body = crate::doc::schemas::UpdateServerBody,
    responses((status = 200, description = "Updated server", body = crate::doc::schemas::ServerSummary),
              (status = 400, description = "Invalid server id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Manage server permission required", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Server not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn update_server(Extension(state): Extension<AppState>, user: CurrentUser, Path(server_id): Path<String>, Json(body): Json<UpdateServerBody>) -> Result<Json<ServerSummary>> {
    validate_uuid(&server_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.can(ServerPermission::MANAGE_SERVER) {
        return Err(AppError::Forbidden("manage server permission required".to_string()));
    }

    let server = sqlx::query_as::<_, ServerSummary>(
        r#"
        UPDATE "Server"
        SET name = COALESCE($2, name)
        WHERE id = $1
        RETURNING id, owner_id, name, created_at
        "#,
    )
    .bind(&server_id)
    .bind(body.name)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(server))
}

#[utoipa::path(
    delete, path = "/servers/{server_id}", tag = "Servers", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID")),
    responses((status = 200, description = "Deleted server", body = crate::doc::schemas::ServerSummary),
              (status = 400, description = "Invalid server id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Manage server permission required", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Server not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn delete_server(Extension(state): Extension<AppState>, user: CurrentUser, Path(server_id): Path<String>) -> Result<Json<ServerSummary>> {
    validate_uuid(&server_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.can(ServerPermission::MANAGE_SERVER) {
        return Err(AppError::Forbidden("manage server permission required".to_string()));
    }

    let server = sqlx::query_as::<_, ServerSummary>(
        r#"
        DELETE FROM "Server"
        WHERE id = $1
        RETURNING id, owner_id, name, created_at
        "#,
    )
    .bind(&server_id)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(server))
}

#[utoipa::path(
    get, path = "/servers/{server_id}/channels", tag = "Channels", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID")),
    responses((status = 200, description = "Server channels", body = [crate::doc::schemas::Channel]),
              (status = 400, description = "Invalid server id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "View channel permission required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn get_server_channels(Extension(state): Extension<AppState>, user: CurrentUser, Path(server_id): Path<String>) -> Result<Json<Vec<ChannelRecord>>> {
    validate_uuid(&server_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.can(ServerPermission::VIEW_CHANNELS) {
        return Err(AppError::Forbidden("view channel permission required".to_string()));
    }

    let channels = sqlx::query_as::<_, ChannelRecord>(
        r#"
        SELECT id, server_id, name, description, created_at
        FROM "Channel"
        WHERE server_id = $1
        ORDER BY created_at ASC
        "#,
    )
    .bind(&server_id)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(channels))
}

#[utoipa::path(
    post, path = "/servers/{server_id}/channels", tag = "Channels", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID")), request_body = crate::doc::schemas::CreateChannelBody,
    responses((status = 200, description = "Created channel", body = crate::doc::schemas::Channel),
              (status = 400, description = "Invalid server id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Manage channels permission required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn create_channel(Extension(state): Extension<AppState>, user: CurrentUser, Path(server_id): Path<String>, Json(body): Json<CreateChannelBody>,) -> Result<Json<ChannelRecord>> {
    validate_uuid(&server_id)?;

    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.can(ServerPermission::MANAGE_CHANNELS) {
        return Err(AppError::Forbidden("manage channels permission required".to_string()));
    }

    let channel = sqlx::query_as::<_, ChannelRecord>(
        r#"
        INSERT INTO "Channel" (id, server_id, name, description)
        VALUES ($1, $2, $3, $4)
        RETURNING id, server_id, name, description, created_at
        "#,
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&server_id)
    .bind(&body.name)
    .bind(&body.description)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(channel))
}

async fn load_server_detail(state: &AppState, server_id: &str) -> Result<ServerDetailResponse> {
    let server = sqlx::query_as::<_, ServerSummary>(
        r#"
        SELECT id, owner_id, name, created_at
        FROM "Server"
        WHERE id = $1
        "#,
    )
    .bind(server_id)
    .fetch_one(&state.pool)
    .await?;

    let channels = sqlx::query_as::<_, ChannelRecord>(
        r#"
        SELECT id, server_id, name, description, created_at
        FROM "Channel"
        WHERE server_id = $1
        ORDER BY created_at ASC
        "#,
    )
    .bind(&server.id)
    .fetch_all(&state.pool)
    .await?;

    let roles = sqlx::query_as::<_, ServerRoleRecord>(
        r#"
        SELECT id, server_id, name, color, permissions, is_default, position, created_at
        FROM "ServerRole"
        WHERE server_id = $1
        ORDER BY position ASC, id ASC
        "#,
    )
    .bind(&server.id)
    .fetch_all(&state.pool)
    .await?;

    let users = load_server_members(state, &server.id, &roles).await?;

    Ok(ServerDetailResponse {
        id: server.id,
        owner_id: server.owner_id,
        name: server.name,
        created_at: server.created_at,
        channels,
        users,
        roles: roles.into_iter().map(ServerRoleResponse::from).collect()
    })
}

async fn load_server_members(state: &AppState, server_id: &str, roles: &[ServerRoleRecord]) -> Result<Vec<ServerMemberResponse>> {
    let rows = sqlx::query_as::<_, crate::models::ServerMemberRecord>(
        r#"
         SELECT su.server_id, su.user_id,
             COALESCE(array_agg(sur.role_id ORDER BY sr.position, sr.id) FILTER (WHERE sur.role_id IS NOT NULL), ARRAY[]::integer[]) AS role_ids,
             su.joined_at
         FROM "ServerUser" su
         LEFT JOIN "ServerUserRole" sur ON sur.server_id = su.server_id AND sur.user_id = su.user_id
         LEFT JOIN "ServerRole" sr ON sr.id = sur.role_id
         WHERE su.server_id = $1
         GROUP BY su.server_id, su.user_id, su.joined_at
        ORDER BY joined_at ASC
        "#,
    )
    .bind(server_id)
    .fetch_all(&state.pool)
    .await?;

    let mut members = Vec::with_capacity(rows.len());
    for row in rows {
        let user = load_public_user(state, &row.user_id).await?;
        let member_roles = row.role_ids.iter()
            .filter_map(|role_id| roles.iter().find(|role| role.id == *role_id).cloned())
            .map(ServerRoleResponse::from)
            .collect();

        members.push(ServerMemberResponse {user, roles: member_roles, joined_at: row.joined_at});
    }
    Ok(members)
}

fn validate_uuid(value: &str) -> Result<()> {
    Uuid::parse_str(value).map_err(|_| AppError::BadRequest("invalid server id".to_string()))?;
    Ok(())
}
