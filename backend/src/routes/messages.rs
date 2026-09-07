//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Messages routes
//

use crate::{
    app_state::AppState,
    auth::CurrentUser,
    error::{AppError, Result},
    models::{MessageRecord, MessageResponse, ServerPermission},
    permissions::{load_channel_server_id, load_server_access},
};

use axum::{extract::{Extension, Path, Query}, routing::{delete, get, put}, Json, Router};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateMessageBody {
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMessageBody {
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct PaginationQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct MessagePageResponse {
    pub items: Vec<MessageResponse>,
    pub page: u32,
    pub limit: u32,
    pub total: i64,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/channels/{channel_id}/messages", get(get_messages).post(create_message))
        .route("/messages/{message_id}", put(update_message).delete(delete_message))
}

#[utoipa::path(get, path = "/channels/{channel_id}/messages", tag = "Messages", security(("bearer_auth" = [])),
    params(("channel_id" = String, Path, description = "Channel UUID"),
        ("page" = Option<u32>, Query, description = "Page number, starting at 1", example = 1),
        ("limit" = Option<u32>, Query, description = "Items per page (1-200)", example = 50)),
    responses((status = 200, description = "Paginated channel messages", body = crate::doc::schemas::MessagePageResponse),
              (status = 400, description = "Invalid channel id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "View channel permission required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn get_messages(Extension(state): Extension<AppState>, user: CurrentUser, Path(channel_id): Path<String>, Query(query): Query<PaginationQuery>) -> Result<Json<MessagePageResponse>> {
    validate_uuid(&channel_id)?;

    let server_id = load_channel_server_id(&state, &channel_id).await?;
    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.can(ServerPermission::VIEW_CHANNEL) {
        return Err(AppError::Forbidden("view channel permission required".to_string()));
    }

    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let offset = (page - 1) * limit;
    let total = sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)
        FROM "Message"
        WHERE channel_id = $1
        "#,
    )
    .bind(&channel_id)
    .fetch_one(&state.pool)
    .await?;

    let messages = sqlx::query_as::<_, MessageRecord>(
        r#"
        SELECT id, channel_id, sender_id, content, created_at
        FROM "Message"
        WHERE channel_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT $2 OFFSET $3
        "#,
    )
    .bind(&channel_id)
    .bind(i64::from(limit))
    .bind(i64::from(offset))
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(MessagePageResponse {
        items: messages.into_iter().map(MessageResponse::from).collect(),
        page,
        limit,
        total
    }))
}

#[utoipa::path(post, path = "/channels/{channel_id}/messages", tag = "Messages", security(("bearer_auth" = [])),
    params(("channel_id" = String, Path, description = "Channel UUID")), request_body = crate::doc::schemas::CreateMessageBody,
    responses((status = 200, description = "Created message", body = crate::doc::schemas::Message),
              (status = 400, description = "Invalid channel id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Send messages permission required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn create_message(Extension(state): Extension<AppState>, user: CurrentUser, Path(channel_id): Path<String>, Json(body): Json<CreateMessageBody>) -> Result<Json<MessageResponse>> {
    validate_uuid(&channel_id)?;

    let server_id = load_channel_server_id(&state, &channel_id).await?;
    let access = load_server_access(&state, &server_id, &user.id).await?;
    if !access.can(ServerPermission::SEND_MESSAGES) {
        return Err(AppError::Forbidden("send messages permission required".to_string()));
    }

    let message = sqlx::query_as::<_, MessageRecord>(
        r#"
        INSERT INTO "Message" (id, channel_id, sender_id, content)
        VALUES ($1, $2, $3, $4)
        RETURNING id, channel_id, sender_id, content, created_at
        "#,
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&channel_id)
    .bind(&user.id)
    .bind(&body.content)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(MessageResponse::from(message)))
}

#[utoipa::path(
    put, path = "/messages/{message_id}", tag = "Messages", security(("bearer_auth" = [])),
    params(("message_id" = String, Path, description = "Message UUID")), request_body = crate::doc::schemas::UpdateMessageBody,
    responses((status = 200, description = "Updated message", body = crate::doc::schemas::Message),
              (status = 400, description = "Invalid message id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Cannot edit this message", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Message not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn update_message(Extension(state): Extension<AppState>, user: CurrentUser, Path(message_id): Path<String>, Json(body): Json<UpdateMessageBody>) -> Result<Json<MessageResponse>> {
    validate_uuid(&message_id)?;

    let message = sqlx::query_as::<_, MessageRecord>(
        r#"
        SELECT id, channel_id, sender_id, content, created_at
        FROM "Message"
        WHERE id = $1
        "#,
    )
    .bind(&message_id)
    .fetch_one(&state.pool)
    .await?;

    if message.sender_id != user.id {
        return Err(AppError::Forbidden("cannot edit this message".to_string()));
    }

    let updated = sqlx::query_as::<_, MessageRecord>(
        r#"
        UPDATE "Message"
        SET content = $2
        WHERE id = $1
        RETURNING id, channel_id, sender_id, content, created_at
        "#,
    )
    .bind(&message_id)
    .bind(&body.content)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(MessageResponse::from(updated)))
}

#[utoipa::path(
    delete, path = "/messages/{message_id}", tag = "Messages", security(("bearer_auth" = [])),
    params(("message_id" = String, Path, description = "Message UUID")),
    responses((status = 200, description = "Deleted message", body = crate::doc::schemas::Message),
              (status = 400, description = "Invalid message id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Cannot delete this message", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Message not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn delete_message(Extension(state): Extension<AppState>, user: CurrentUser, Path(message_id): Path<String>) -> Result<Json<MessageResponse>> {
    validate_uuid(&message_id)?;

    let message = sqlx::query_as::<_, MessageRecord>(
        r#"
        SELECT id, channel_id, sender_id, content, created_at
        FROM "Message"
        WHERE id = $1
        "#,
    )
    .bind(&message_id)
    .fetch_one(&state.pool)
    .await?;

    let server_id = load_channel_server_id(&state, &message.channel_id).await?;
    let access = load_server_access(&state, &server_id, &user.id).await?;
    if message.sender_id != user.id && !access.can(ServerPermission::MANAGE_MESSAGES) {
        return Err(AppError::Forbidden("cannot delete this message".to_string()));
    }

    let deleted = sqlx::query_as::<_, MessageRecord>(
        r#"
        DELETE FROM "Message"
        WHERE id = $1
        RETURNING id, channel_id, sender_id, content, created_at
        "#,
    )
    .bind(&message_id)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(MessageResponse::from(deleted)))
}

fn validate_uuid(value: &str) -> Result<()> {
    Uuid::parse_str(value).map_err(|_| AppError::BadRequest("invalid id".to_string()))?;
    Ok(())
}
