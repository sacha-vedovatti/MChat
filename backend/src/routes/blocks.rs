//
// EPITECH PROJECT, 2026
// MChat
// File description:
// User blocking routes => /blocks
//

use crate::{
    app_state::AppState,
    auth::{load_public_user, CurrentUser},
    error::{AppError, Result},
    models::BlockedUserResponse,
};

use axum::{extract::{Extension, Path}, routing::{get, post}, Json, Router};
use uuid::Uuid;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/blocks", get(list_blocks))
        .route("/blocks/{user_id}", post(block_user).delete(unblock_user))
}

#[utoipa::path(
    get, path = "/blocks", tag = "Blocks", security(("bearer_auth" = [])),
    responses((status = 200, description = "Users blocked by the current user", body = [crate::doc::schemas::BlockedUser]))
)]
pub(crate) async fn list_blocks(Extension(state): Extension<AppState>, user: CurrentUser) -> Result<Json<Vec<BlockedUserResponse>>> {
    let rows = sqlx::query_as::<_, (String, String, chrono::NaiveDateTime)>(
        r#"
        SELECT b.blocked_id, u.id, b.created_at
        FROM "UserBlock" b
        JOIN "User" u ON u.id = b.blocked_id
        WHERE b.blocker_id = $1
        ORDER BY b.created_at ASC
        "#,
    )
    .bind(&user.id)
    .fetch_all(&state.pool)
    .await?;

    let mut response = Vec::with_capacity(rows.len());
    for (_, user_id, created_at) in rows {
        response.push(BlockedUserResponse { user: load_public_user(&state, &user_id).await?, created_at });
    }
    Ok(Json(response))
}

#[utoipa::path(
    post, path = "/blocks/{user_id}", tag = "Blocks", security(("bearer_auth" = [])),
    params(("user_id" = String, Path, description = "User UUID")),
    responses((status = 200, description = "User blocked", body = crate::doc::schemas::BlockedUser))
)]
pub(crate) async fn block_user(Extension(state): Extension<AppState>, user: CurrentUser, Path(target_user_id): Path<String>) -> Result<Json<BlockedUserResponse>> {
    validate_uuid(&target_user_id)?;
    if target_user_id == user.id {
        return Err(AppError::BadRequest("cannot block yourself".to_string()));
    }
    load_public_user(&state, &target_user_id).await?;

    let mut transaction = state.pool.begin().await?;
    sqlx::query(r#"DELETE FROM "Friendship" WHERE requester_id IN ($1, $2) AND addressee_id IN ($1, $2)"#)
        .bind(&user.id)
        .bind(&target_user_id)
        .execute(&mut *transaction)
        .await?;
    sqlx::query(r#"DELETE FROM "DirectConversation" WHERE user_a_id IN ($1, $2) AND user_b_id IN ($1, $2)"#)
        .bind(&user.id)
        .bind(&target_user_id)
        .execute(&mut *transaction)
        .await?;
    let row = sqlx::query_as::<_, (chrono::NaiveDateTime,)>(
        r#"
        INSERT INTO "UserBlock" (blocker_id, blocked_id)
        VALUES ($1, $2)
        ON CONFLICT (blocker_id, blocked_id) DO UPDATE SET created_at = "UserBlock".created_at
        RETURNING created_at
        "#,
    )
    .bind(&user.id)
    .bind(&target_user_id)
    .fetch_one(&mut *transaction)
    .await?;
    transaction.commit().await?;

    Ok(Json(BlockedUserResponse { user: load_public_user(&state, &target_user_id).await?, created_at: row.0 }))
}

#[utoipa::path(
    delete, path = "/blocks/{user_id}", tag = "Blocks", security(("bearer_auth" = [])),
    params(("user_id" = String, Path, description = "User UUID")),
    responses((status = 200, description = "User unblocked", body = crate::doc::schemas::BlockedUser))
)]
pub(crate) async fn unblock_user(Extension(state): Extension<AppState>, user: CurrentUser, Path(target_user_id): Path<String>) -> Result<Json<BlockedUserResponse>> {
    validate_uuid(&target_user_id)?;
    let created_at = sqlx::query_scalar::<_, chrono::NaiveDateTime>(
        r#"DELETE FROM "UserBlock" WHERE blocker_id = $1 AND blocked_id = $2 RETURNING created_at"#,
    )
    .bind(&user.id)
    .bind(&target_user_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("block not found".to_string()))?;
    Ok(Json(BlockedUserResponse { user: load_public_user(&state, &target_user_id).await?, created_at }))
}

fn validate_uuid(value: &str) -> Result<()> {
    Uuid::parse_str(value).map_err(|_| AppError::BadRequest("invalid user id".to_string()))?;
    Ok(())
}