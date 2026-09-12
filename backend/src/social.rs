//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Social graph helpers (friendships)
//

use crate::{
    app_state::AppState,
    error::Result,
    models::{FriendshipRecord, FriendshipStatus}
};

pub async fn are_users_blocked(state: &AppState, user_a: &str, user_b: &str) -> Result<bool> {
    let blocked = sqlx::query_scalar::<_, bool>(
        r#"
        SELECT EXISTS(
            SELECT 1
            FROM "UserBlock"
            WHERE (blocker_id = $1 AND blocked_id = $2)
               OR (blocker_id = $2 AND blocked_id = $1)
        )
        "#,
    )
    .bind(user_a)
    .bind(user_b)
    .fetch_one(&state.pool)
    .await?;

    Ok(blocked)
}

pub async fn load_friendship_between(state: &AppState, user_a: &str, user_b: &str) -> Result<Option<FriendshipRecord>> {
    let friendship = sqlx::query_as::<_, FriendshipRecord>(
        r#"
        SELECT id, requester_id, addressee_id, status, created_at, responded_at
        FROM "Friendship"
        WHERE LEAST(requester_id, addressee_id) = LEAST($1, $2)
          AND GREATEST(requester_id, addressee_id) = GREATEST($1, $2)
        "#,
    )
    .bind(user_a)
    .bind(user_b)
    .fetch_optional(&state.pool)
    .await?;

    Ok(friendship)
}

pub async fn are_friends(state: &AppState, user_a: &str, user_b: &str) -> Result<bool> {
    let friendship = load_friendship_between(state, user_a, user_b).await?;
    Ok(matches!(friendship, Some(friendship) if friendship.status == FriendshipStatus::ACCEPTED))
}
