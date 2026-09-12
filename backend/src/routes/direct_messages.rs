//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Direct Message (DM) routes
//

use crate::{
    app_state::AppState,
    auth::{load_public_user, CurrentUser},
    error::{AppError, Result},
    models::{DirectConversationRecord, DirectConversationResponse, DirectMessageRecord, DirectMessageResponse},
    social::{are_friends, are_users_blocked}
};

use axum::{extract::{Extension, Path, Query}, routing::{get, post, put}, Json, Router};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateDirectMessageBody {
    pub content: String
}

#[derive(Debug, Deserialize)]
pub struct UpdateDirectMessageBody {
    pub content: String
}

#[derive(Debug, Deserialize)]
pub struct PaginationQuery {
    pub page: Option<u32>,
    pub limit: Option<u32>
}

#[derive(Debug, Serialize)]
pub struct DirectMessagePageResponse {
    pub items: Vec<DirectMessageResponse>,
    pub page: u32,
    pub limit: u32,
    pub total: i64
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/dm", get(list_conversations))
        .route("/dm/{user_id}", post(open_conversation))
        .route("/dm/{conversation_id}/messages", get(get_messages).post(create_message))
        .route("/dm/messages/{message_id}", put(update_message).delete(delete_message))
}

#[utoipa::path(get, path = "/dm", tag = "Direct Messages", security(("bearer_auth" = [])),
    responses((status = 200, description = "Current user's direct conversations", body = [crate::doc::schemas::DirectConversation]),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn list_conversations(Extension(state): Extension<AppState>, user: CurrentUser) -> Result<Json<Vec<DirectConversationResponse>>> {
    let conversations = sqlx::query_as::<_, DirectConversationRecord>(
        r#"
        SELECT id, user_a_id, user_b_id, created_at
        FROM "DirectConversation"
        WHERE (user_a_id = $1 OR user_b_id = $1)
                    AND NOT EXISTS (
                            SELECT 1 FROM "UserBlock" b
                            WHERE (b.blocker_id = $1 AND b.blocked_id = CASE WHEN user_a_id = $1 THEN user_b_id ELSE user_a_id END)
                                 OR (b.blocked_id = $1 AND b.blocker_id = CASE WHEN user_a_id = $1 THEN user_b_id ELSE user_a_id END)
                    )
        ORDER BY created_at DESC
        "#,
    )
    .bind(&user.id)
    .fetch_all(&state.pool)
    .await?;

    let mut responses = Vec::with_capacity(conversations.len());
    for conversation in conversations {
        responses.push(load_conversation_response(&state, &user.id, conversation).await?);
    }

    Ok(Json(responses))
}

#[utoipa::path(post, path = "/dm/{user_id}", tag = "Direct Messages", security(("bearer_auth" = [])),
    params(("user_id" = String, Path, description = "Other user's UUID")),
    responses((status = 200, description = "Existing or newly created direct conversation", body = crate::doc::schemas::DirectConversation),
              (status = 400, description = "Invalid user id or cannot DM yourself", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "You must be friends to start a direct message", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "User not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn open_conversation(Extension(state): Extension<AppState>, user: CurrentUser, Path(target_user_id): Path<String>) -> Result<Json<DirectConversationResponse>> {
    validate_uuid(&target_user_id)?;
    if target_user_id == user.id {
        return Err(AppError::BadRequest("cannot open a direct message with yourself".to_string()));
    }
    load_public_user(&state, &target_user_id).await?;
    if are_users_blocked(&state, &user.id, &target_user_id).await? {
        return Err(AppError::Forbidden("you cannot message a blocked user".to_string()));
    }

    if !are_friends(&state, &user.id, &target_user_id).await? {
        return Err(AppError::Forbidden("you must be friends to start a direct message".to_string()));
    }

    let existing = sqlx::query_as::<_, DirectConversationRecord>(
        r#"
        SELECT id, user_a_id, user_b_id, created_at
        FROM "DirectConversation"
        WHERE LEAST(user_a_id, user_b_id) = LEAST($1, $2)
          AND GREATEST(user_a_id, user_b_id) = GREATEST($1, $2)
        "#,
    )
    .bind(&user.id)
    .bind(&target_user_id)
    .fetch_optional(&state.pool)
    .await?;

    let conversation = match existing {
        Some(conversation) => conversation,
        None => {
            sqlx::query_as::<_, DirectConversationRecord>(
                r#"
                INSERT INTO "DirectConversation" (id, user_a_id, user_b_id)
                VALUES ($1, $2, $3)
                RETURNING id, user_a_id, user_b_id, created_at
                "#,
            )
            .bind(Uuid::new_v4().to_string())
            .bind(&user.id)
            .bind(&target_user_id)
            .fetch_one(&state.pool)
            .await?
        }
    };

    Ok(Json(load_conversation_response(&state, &user.id, conversation).await?))
}

#[utoipa::path(get, path = "/dm/{conversation_id}/messages", tag = "Direct Messages", security(("bearer_auth" = [])),
    params(("conversation_id" = String, Path, description = "Conversation UUID"),
        ("page" = Option<u32>, Query, description = "Page number, starting at 1", example = 1),
        ("limit" = Option<u32>, Query, description = "Items per page (1-200)", example = 50)),
    responses((status = 200, description = "Paginated direct messages", body = crate::doc::schemas::DirectMessagePageResponse),
              (status = 400, description = "Invalid conversation id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Not a participant in this conversation", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Conversation not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn get_messages(Extension(state): Extension<AppState>, user: CurrentUser, Path(conversation_id): Path<String>, Query(query): Query<PaginationQuery>) -> Result<Json<DirectMessagePageResponse>> {
    validate_uuid(&conversation_id)?;
    require_participant(&state, &conversation_id, &user.id).await?;

    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let offset = (page - 1) * limit;

    let total = sqlx::query_scalar::<_, i64>(r#"SELECT COUNT(*) FROM "DirectMessage" WHERE conversation_id = $1"#)
        .bind(&conversation_id)
        .fetch_one(&state.pool)
        .await?;

    let messages = sqlx::query_as::<_, DirectMessageRecord>(
        r#"
        SELECT id, conversation_id, sender_id, content, created_at
        FROM "DirectMessage"
        WHERE conversation_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT $2 OFFSET $3
        "#,
    )
    .bind(&conversation_id)
    .bind(i64::from(limit))
    .bind(i64::from(offset))
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(DirectMessagePageResponse {
        items: messages.into_iter().map(DirectMessageResponse::from).collect(),
        page,
        limit,
        total
    }))
}

#[utoipa::path(post, path = "/dm/{conversation_id}/messages", tag = "Direct Messages", security(("bearer_auth" = [])),
    params(("conversation_id" = String, Path, description = "Conversation UUID")), request_body = crate::doc::schemas::CreateDirectMessageBody,
    responses((status = 200, description = "Created direct message", body = crate::doc::schemas::DirectMessage),
              (status = 400, description = "Invalid conversation id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Not a participant in this conversation", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Conversation not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn create_message(Extension(state): Extension<AppState>, user: CurrentUser, Path(conversation_id): Path<String>, Json(body): Json<CreateDirectMessageBody>) -> Result<Json<DirectMessageResponse>> {
    validate_uuid(&conversation_id)?;
    require_participant(&state, &conversation_id, &user.id).await?;

    let message = sqlx::query_as::<_, DirectMessageRecord>(
        r#"
        INSERT INTO "DirectMessage" (id, conversation_id, sender_id, content)
        VALUES ($1, $2, $3, $4)
        RETURNING id, conversation_id, sender_id, content, created_at
        "#,
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&conversation_id)
    .bind(&user.id)
    .bind(&body.content)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(DirectMessageResponse::from(message)))
}

#[utoipa::path(
    put, path = "/dm/messages/{message_id}", tag = "Direct Messages", security(("bearer_auth" = [])),
    params(("message_id" = String, Path, description = "Direct message UUID")), request_body = crate::doc::schemas::UpdateDirectMessageBody,
    responses((status = 200, description = "Updated direct message", body = crate::doc::schemas::DirectMessage),
              (status = 400, description = "Invalid message id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Cannot edit this message", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Message not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn update_message(Extension(state): Extension<AppState>, user: CurrentUser, Path(message_id): Path<String>, Json(body): Json<UpdateDirectMessageBody>) -> Result<Json<DirectMessageResponse>> {
    validate_uuid(&message_id)?;

    let message = sqlx::query_as::<_, DirectMessageRecord>(r#"SELECT id, conversation_id, sender_id, content, created_at FROM "DirectMessage" WHERE id = $1"#)
        .bind(&message_id)
        .fetch_one(&state.pool)
        .await?;

    if message.sender_id != user.id {
        return Err(AppError::Forbidden("cannot edit this message".to_string()));
    }

    let updated = sqlx::query_as::<_, DirectMessageRecord>(
        r#"
        UPDATE "DirectMessage"
        SET content = $2
        WHERE id = $1
        RETURNING id, conversation_id, sender_id, content, created_at
        "#,
    )
    .bind(&message_id)
    .bind(&body.content)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(DirectMessageResponse::from(updated)))
}

#[utoipa::path(
    delete, path = "/dm/messages/{message_id}", tag = "Direct Messages", security(("bearer_auth" = [])),
    params(("message_id" = String, Path, description = "Direct message UUID")),
    responses((status = 200, description = "Deleted direct message", body = crate::doc::schemas::DirectMessage),
              (status = 400, description = "Invalid message id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Cannot delete this message", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Message not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn delete_message(Extension(state): Extension<AppState>, user: CurrentUser, Path(message_id): Path<String>) -> Result<Json<DirectMessageResponse>> {
    validate_uuid(&message_id)?;

    let message = sqlx::query_as::<_, DirectMessageRecord>(r#"SELECT id, conversation_id, sender_id, content, created_at FROM "DirectMessage" WHERE id = $1"#)
        .bind(&message_id)
        .fetch_one(&state.pool)
        .await?;

    if message.sender_id != user.id {
        return Err(AppError::Forbidden("cannot delete this message".to_string()));
    }

    let deleted = sqlx::query_as::<_, DirectMessageRecord>(
        r#"
        DELETE FROM "DirectMessage"
        WHERE id = $1
        RETURNING id, conversation_id, sender_id, content, created_at
        "#,
    )
    .bind(&message_id)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(DirectMessageResponse::from(deleted)))
}

async fn require_participant(state: &AppState, conversation_id: &str, user_id: &str) -> Result<DirectConversationRecord> {
    let conversation = sqlx::query_as::<_, DirectConversationRecord>(r#"SELECT id, user_a_id, user_b_id, created_at FROM "DirectConversation" WHERE id = $1"#)
        .bind(conversation_id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or_else(|| AppError::NotFound("conversation not found".to_string()))?;

    if conversation.user_a_id != user_id && conversation.user_b_id != user_id {
        return Err(AppError::Forbidden("not a participant in this conversation".to_string()));
    }

    let other_user_id = if conversation.user_a_id == user_id { &conversation.user_b_id } else { &conversation.user_a_id };
    if are_users_blocked(state, user_id, other_user_id).await? {
        return Err(AppError::Forbidden("this conversation is unavailable because one user is blocked".to_string()));
    }

    Ok(conversation)
}

async fn load_conversation_response(state: &AppState, current_user_id: &str, conversation: DirectConversationRecord) -> Result<DirectConversationResponse> {
    let other_id = if conversation.user_a_id == current_user_id { &conversation.user_b_id } else { &conversation.user_a_id };
    let other_user = load_public_user(state, other_id).await?;

    let last_message = sqlx::query_as::<_, DirectMessageRecord>(
        r#"
        SELECT id, conversation_id, sender_id, content, created_at
        FROM "DirectMessage"
        WHERE conversation_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        "#,
    )
    .bind(&conversation.id)
    .fetch_optional(&state.pool)
    .await?
    .map(DirectMessageResponse::from);

    Ok(DirectConversationResponse {
        id: conversation.id,
        other_user,
        created_at: conversation.created_at,
        last_message
    })
}

fn validate_uuid(value: &str) -> Result<()> {
    Uuid::parse_str(value).map_err(|_| AppError::BadRequest("invalid id".to_string()))?;
    Ok(())
}
