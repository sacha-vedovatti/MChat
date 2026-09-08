//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Server invitation routes
//

use crate::{
    app_state::AppState,
    auth::CurrentUser,
    error::{AppError, Result},
    models::{ServerInvitationRecord, ServerInvitationResponse, ServerPermission, ServerSummary},
    permissions::load_server_access
};

use axum::{extract::{Extension, Path}, routing::post, Json, Router};
use serde::Deserialize;
use uuid::Uuid;

const DEFAULT_EXPIRATION_SECONDS: i64 = 24 * 60 * 60;
const MIN_EXPIRATION_SECONDS: i64 = 60;
const MAX_EXPIRATION_SECONDS: i64 = 30 * 24 * 60 * 60;

#[derive(Debug, Deserialize)]
pub struct CreateInvitationBody {
    pub expires_in_seconds: Option<i64>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/servers/{server_id}/invites", post(create_invitation))
        .route("/invites/{token}/accept", post(accept_invitation))
}

#[utoipa::path(
    post, path = "/servers/{server_id}/invites", tag = "Invitations", security(("bearer_auth" = [])),
    params(("server_id" = String, Path, description = "Server UUID")),
    request_body = crate::doc::schemas::CreateInvitationBody,
    responses((status = 200, description = "Created invitation", body = crate::doc::schemas::ServerInvitation),
              (status = 400, description = "Invalid server id or expiration", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Invite members permission required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn create_invitation(Extension(state): Extension<AppState>, user: CurrentUser, Path(server_id): Path<String>, Json(body): Json<CreateInvitationBody>) -> Result<Json<ServerInvitationResponse>> {
    validate_uuid(&server_id)?;
    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.can(ServerPermission::INVITE_MEMBERS) {
        return Err(AppError::Forbidden("invite members permission required".to_string()));
    }

    let expires_in_seconds = body.expires_in_seconds.unwrap_or(DEFAULT_EXPIRATION_SECONDS);
    if !(MIN_EXPIRATION_SECONDS..=MAX_EXPIRATION_SECONDS).contains(&expires_in_seconds) {
        return Err(AppError::BadRequest(format!(
            "expiration must be between {MIN_EXPIRATION_SECONDS} and {MAX_EXPIRATION_SECONDS} seconds"
        )));
    }

    let token = Uuid::new_v4().to_string();
    let invitation = sqlx::query_as::<_, ServerInvitationRecord>(
        r#"
        INSERT INTO "ServerInvitation" (token, server_id, created_by, expires_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP + ($4 * INTERVAL '1 second'))
        RETURNING token, server_id, created_by, created_at, expires_at
        "#,
    )
    .bind(&token)
    .bind(&server_id)
    .bind(&user.id)
    .bind(expires_in_seconds as f64)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(invitation.into()))
}

#[utoipa::path(
    post, path = "/invites/{token}/accept", tag = "Invitations", security(("bearer_auth" = [])),
    params(("token" = String, Path, description = "Invitation token")),
    responses((status = 200, description = "Joined server", body = crate::doc::schemas::ServerSummary),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Invitation not found or expired", body = crate::doc::schemas::ErrorResponse),
              (status = 409, description = "Already a member", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn accept_invitation(Extension(state): Extension<AppState>, user: CurrentUser, Path(token): Path<String>) -> Result<Json<ServerSummary>> {
    let mut transaction = state.pool.begin().await?;
    let invitation = sqlx::query_as::<_, ServerInvitationRecord>(
        r#"
        SELECT token, server_id, created_by, created_at, expires_at
        FROM "ServerInvitation"
        WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP
        FOR UPDATE
        "#,
    )
    .bind(&token)
    .fetch_optional(&mut *transaction)
    .await?
    .ok_or_else(|| AppError::NotFound("invitation not found or expired".to_string()))?;

    let already_member = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM "ServerUser"
            WHERE server_id = $1 AND user_id = $2
        )
        "#,
    )
    .bind(&invitation.server_id)
    .bind(&user.id)
    .fetch_one(&mut *transaction)
    .await?;
    if already_member {
        return Err(AppError::Conflict("already a member".to_string()));
    }

    let default_role = sqlx::query_scalar::<_, i32>(
        r#"
        SELECT id
        FROM "ServerRole"
        WHERE server_id = $1 AND is_default = true
        ORDER BY position ASC, id ASC
        LIMIT 1
        "#,
    )
    .bind(&invitation.server_id)
    .fetch_optional(&mut *transaction)
    .await?
    .ok_or_else(|| AppError::Conflict("server has no @everyone role".to_string()))?;

    sqlx::query(
        r#"
        INSERT INTO "ServerUser" (server_id, user_id)
        VALUES ($1, $2)
        "#,
    )
    .bind(&invitation.server_id)
    .bind(&user.id)
    .execute(&mut *transaction)
    .await?;

    sqlx::query(
        r#"
        INSERT INTO "ServerUserRole" (server_id, user_id, role_id)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(&invitation.server_id)
    .bind(&user.id)
    .bind(default_role)
    .execute(&mut *transaction)
    .await?;

    let server = sqlx::query_as::<_, ServerSummary>(
        r#"
        SELECT id, owner_id, name, created_at
        FROM "Server"
        WHERE id = $1
        "#,
    )
    .bind(&invitation.server_id)
    .fetch_one(&mut *transaction)
    .await?;

    transaction.commit().await?;
    Ok(Json(server))
}

fn validate_uuid(value: &str) -> Result<()> {
    Uuid::parse_str(value).map_err(|_| AppError::BadRequest("invalid id".to_string()))?;
    Ok(())
}
