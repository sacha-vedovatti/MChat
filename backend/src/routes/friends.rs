//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Friendship routes => /friends
//

use crate::{
    app_state::AppState,
    auth::{load_public_user, CurrentUser},
    error::{AppError, Result},
    models::{FriendRequestDirection, FriendRequestResponse, FriendResponse, FriendshipRecord, FriendshipResponse, FriendshipStatus},
    social::{are_users_blocked, load_friendship_between}
};

use axum::{extract::{Extension, Path}, routing::{delete, get, post}, Json, Router};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateFriendRequestBody {
    pub user_id: String
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/friends", get(list_friends))
        .route("/friends/requests", get(list_friend_requests).post(send_friend_request))
        .route("/friends/requests/{request_id}/accept", post(accept_friend_request))
        .route("/friends/requests/{request_id}", delete(cancel_friend_request))
        .route("/friends/{user_id}", delete(remove_friend))
}

#[utoipa::path(
    get, path = "/friends", tag = "Friends", security(("bearer_auth" = [])),
    responses((status = 200, description = "Current user's friends", body = [crate::doc::schemas::Friend]),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn list_friends(Extension(state): Extension<AppState>, user: CurrentUser) -> Result<Json<Vec<FriendResponse>>> {
    let friendships = sqlx::query_as::<_, FriendshipRecord>(
        r#"
        SELECT id, requester_id, addressee_id, status, created_at, responded_at
        FROM "Friendship"
        WHERE status = 'ACCEPTED' AND (requester_id = $1 OR addressee_id = $1)
                    AND NOT EXISTS (
                            SELECT 1 FROM "UserBlock" b
                            WHERE (b.blocker_id = $1 AND b.blocked_id = CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END)
                                 OR (b.blocked_id = $1 AND b.blocker_id = CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END)
                    )
        ORDER BY responded_at ASC, created_at ASC
        "#,
    )
    .bind(&user.id)
    .fetch_all(&state.pool)
    .await?;

    let mut responses = Vec::with_capacity(friendships.len());
    for friendship in friendships {
        let other_id = if friendship.requester_id == user.id { &friendship.addressee_id } else { &friendship.requester_id };
        let friend = load_public_user(&state, other_id).await?;
        responses.push(FriendResponse {
            friend,
            since: friendship.responded_at.unwrap_or(friendship.created_at)
        });
    }

    Ok(Json(responses))
}

#[utoipa::path(
    get, path = "/friends/requests", tag = "Friends", security(("bearer_auth" = [])),
    responses((status = 200, description = "Pending friend requests, incoming and outgoing", body = [crate::doc::schemas::FriendRequest]),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn list_friend_requests(Extension(state): Extension<AppState>, user: CurrentUser) -> Result<Json<Vec<FriendRequestResponse>>> {
    let friendships = sqlx::query_as::<_, FriendshipRecord>(
        r#"
        SELECT id, requester_id, addressee_id, status, created_at, responded_at
        FROM "Friendship"
        WHERE status = 'PENDING' AND (requester_id = $1 OR addressee_id = $1)
                    AND NOT EXISTS (
                            SELECT 1 FROM "UserBlock" b
                            WHERE (b.blocker_id = $1 AND b.blocked_id = CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END)
                                 OR (b.blocked_id = $1 AND b.blocker_id = CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END)
                    )
        ORDER BY created_at ASC
        "#,
    )
    .bind(&user.id)
    .fetch_all(&state.pool)
    .await?;

    let mut responses = Vec::with_capacity(friendships.len());
    for friendship in friendships {
        let (direction, other_id) = if friendship.requester_id == user.id {
            (FriendRequestDirection::OUTGOING, &friendship.addressee_id)
        } else {
            (FriendRequestDirection::INCOMING, &friendship.requester_id)
        };
        let other_user = load_public_user(&state, other_id).await?;
        responses.push(FriendRequestResponse {
            id: friendship.id,
            direction,
            user: other_user,
            created_at: friendship.created_at
        });
    }

    Ok(Json(responses))
}

#[utoipa::path(
    post, path = "/friends/requests", tag = "Friends", security(("bearer_auth" = [])),
    request_body = crate::doc::schemas::CreateFriendRequestBody,
    responses((status = 200, description = "Friend request created, or auto-accepted if the other user had already requested you", body = crate::doc::schemas::Friendship),
              (status = 400, description = "Invalid user id or cannot friend yourself", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "User not found", body = crate::doc::schemas::ErrorResponse),
              (status = 409, description = "Friend request already pending or users already friends", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn send_friend_request(Extension(state): Extension<AppState>, user: CurrentUser, Json(body): Json<CreateFriendRequestBody>) -> Result<Json<FriendshipResponse>> {
    validate_uuid(&body.user_id)?;
    if body.user_id == user.id {
        return Err(AppError::BadRequest("cannot send a friend request to yourself".to_string()));
    }
    load_public_user(&state, &body.user_id).await?;
    if are_users_blocked(&state, &user.id, &body.user_id).await? {
        return Err(AppError::Forbidden("you cannot send a friend request to a blocked user".to_string()));
    }

    if let Some(existing) = load_friendship_between(&state, &user.id, &body.user_id).await? {
        return match existing.status {
            FriendshipStatus::ACCEPTED => Err(AppError::Conflict("you are already friends".to_string())),
            FriendshipStatus::PENDING if existing.requester_id == user.id => Err(AppError::Conflict("friend request already sent".to_string())),
            FriendshipStatus::PENDING => {
                let accepted = sqlx::query_as::<_, FriendshipRecord>(
                    r#"
                    UPDATE "Friendship"
                    SET status = 'ACCEPTED', responded_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                    RETURNING id, requester_id, addressee_id, status, created_at, responded_at
                    "#,
                )
                .bind(&existing.id)
                .fetch_one(&state.pool)
                .await?;

                Ok(Json(load_friendship_response(&state, accepted).await?))
            }
        };
    }

    let friendship = sqlx::query_as::<_, FriendshipRecord>(
        r#"
        INSERT INTO "Friendship" (id, requester_id, addressee_id)
        VALUES ($1, $2, $3)
        RETURNING id, requester_id, addressee_id, status, created_at, responded_at
        "#,
    )
    .bind(Uuid::new_v4().to_string())
    .bind(&user.id)
    .bind(&body.user_id)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(load_friendship_response(&state, friendship).await?))
}

#[utoipa::path(
    post, path = "/friends/requests/{request_id}/accept", tag = "Friends", security(("bearer_auth" = [])),
    params(("request_id" = String, Path, description = "Friend request UUID")),
    responses((status = 200, description = "Friend request accepted", body = crate::doc::schemas::Friendship),
              (status = 400, description = "Invalid request id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Only the recipient can accept this request", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Friend request not found", body = crate::doc::schemas::ErrorResponse),
              (status = 409, description = "Request already resolved", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn accept_friend_request(Extension(state): Extension<AppState>, user: CurrentUser, Path(request_id): Path<String>) -> Result<Json<FriendshipResponse>> {
    validate_uuid(&request_id)?;

    let existing = fetch_friendship(&state, &request_id).await?;
    if existing.status != FriendshipStatus::PENDING {
        return Err(AppError::Conflict("friend request already resolved".to_string()));
    }
    if existing.addressee_id != user.id {
        return Err(AppError::Forbidden("only the recipient can accept this request".to_string()));
    }

    let accepted = sqlx::query_as::<_, FriendshipRecord>(
        r#"
        UPDATE "Friendship"
        SET status = 'ACCEPTED', responded_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id, requester_id, addressee_id, status, created_at, responded_at
        "#,
    )
    .bind(&request_id)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(load_friendship_response(&state, accepted).await?))
}

#[utoipa::path(
    delete, path = "/friends/requests/{request_id}", tag = "Friends", security(("bearer_auth" = [])),
    params(("request_id" = String, Path, description = "Friend request UUID")),
    responses((status = 200, description = "Friend request cancelled (by the requester) or declined (by the recipient)", body = crate::doc::schemas::Friendship),
              (status = 400, description = "Invalid request id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 403, description = "Not a participant in this request", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Friend request not found", body = crate::doc::schemas::ErrorResponse),
              (status = 409, description = "Request already resolved", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn cancel_friend_request(Extension(state): Extension<AppState>, user: CurrentUser, Path(request_id): Path<String>) -> Result<Json<FriendshipResponse>> {
    validate_uuid(&request_id)?;

    let existing = fetch_friendship(&state, &request_id).await?;
    if existing.status != FriendshipStatus::PENDING {
        return Err(AppError::Conflict("friend request already resolved".to_string()));
    }
    if existing.requester_id != user.id && existing.addressee_id != user.id {
        return Err(AppError::Forbidden("not a participant in this request".to_string()));
    }

    let response = load_friendship_response(&state, existing.clone()).await?;
    sqlx::query(r#"DELETE FROM "Friendship" WHERE id = $1"#).bind(&request_id).execute(&state.pool).await?;

    Ok(Json(response))
}

#[utoipa::path(
    delete, path = "/friends/{user_id}", tag = "Friends", security(("bearer_auth" = [])),
    params(("user_id" = String, Path, description = "Friend's user UUID")),
    responses((status = 200, description = "Friendship removed", body = crate::doc::schemas::Friendship),
              (status = 400, description = "Invalid user id", body = crate::doc::schemas::ErrorResponse),
              (status = 401, description = "Authentication required", body = crate::doc::schemas::ErrorResponse),
              (status = 404, description = "Friendship not found", body = crate::doc::schemas::ErrorResponse))
)]
pub(crate) async fn remove_friend(Extension(state): Extension<AppState>, user: CurrentUser, Path(target_user_id): Path<String>) -> Result<Json<FriendshipResponse>> {
    validate_uuid(&target_user_id)?;

    let existing = load_friendship_between(&state, &user.id, &target_user_id)
        .await?
        .filter(|friendship| friendship.status == FriendshipStatus::ACCEPTED)
        .ok_or_else(|| AppError::NotFound("friendship not found".to_string()))?;

    let response = load_friendship_response(&state, existing.clone()).await?;
    sqlx::query(r#"DELETE FROM "Friendship" WHERE id = $1"#).bind(&existing.id).execute(&state.pool).await?;

    Ok(Json(response))
}

async fn fetch_friendship(state: &AppState, request_id: &str) -> Result<FriendshipRecord> {
    sqlx::query_as::<_, FriendshipRecord>(
        r#"
        SELECT id, requester_id, addressee_id, status, created_at, responded_at
        FROM "Friendship"
        WHERE id = $1
        "#,
    )
    .bind(request_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("friend request not found".to_string()))
}

async fn load_friendship_response(state: &AppState, friendship: FriendshipRecord) -> Result<FriendshipResponse> {
    let requester = load_public_user(state, &friendship.requester_id).await?;
    let addressee = load_public_user(state, &friendship.addressee_id).await?;
    Ok(FriendshipResponse {
        id: friendship.id,
        status: friendship.status,
        requester,
        addressee,
        created_at: friendship.created_at,
        responded_at: friendship.responded_at
    })
}

fn validate_uuid(value: &str) -> Result<()> {
    Uuid::parse_str(value).map_err(|_| AppError::BadRequest("invalid id".to_string()))?;
    Ok(())
}
