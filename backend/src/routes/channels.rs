use crate::{
    app_state::AppState,
    auth::CurrentUser,
    error::{AppError, Result},
    models::{ChannelRecord, ServerPermission},
    permissions::{load_channel_server_id, load_server_access},
};
use axum::{extract::{Extension, Path}, routing::put, Json, Router};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct UpdateChannelBody {
    pub name: Option<String>,
    pub description: Option<String>,
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/channels/{channel_id}", put(update_channel).delete(delete_channel))
        .route("/channel/{channel_id}", put(update_channel).delete(delete_channel))
}

async fn update_channel(
    Extension(state): Extension<AppState>,
    user: CurrentUser,
    Path(channel_id): Path<String>,
    Json(body): Json<UpdateChannelBody>,
) -> Result<Json<ChannelRecord>> {
    validate_uuid(&channel_id)?;
    let server_id = load_channel_server_id(&state, &channel_id).await?;
    let access = load_server_access(&state, &server_id, &user.id).await?;

    if !access.can(ServerPermission::MANAGE_CHANNELS) {
        return Err(AppError::Forbidden("manage channels permission required".to_string()));
    }

    let channel = sqlx::query_as::<_, ChannelRecord>(
        r#"
        UPDATE "Channel"
        SET
            name = COALESCE($2, name),
            description = COALESCE($3, description)
        WHERE id = $1
        RETURNING id, server_id, name, description, created_at
        "#,
    )
    .bind(&channel_id)
    .bind(body.name)
    .bind(body.description)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(channel))
}

async fn delete_channel(
    Extension(state): Extension<AppState>,
    user: CurrentUser,
    Path(channel_id): Path<String>,
) -> Result<Json<ChannelRecord>> {
    validate_uuid(&channel_id)?;
    let server_id = load_channel_server_id(&state, &channel_id).await?;
    let access = load_server_access(&state, &server_id, &user.id).await?;

    if !access.can(ServerPermission::MANAGE_CHANNELS) {
        return Err(AppError::Forbidden("manage channels permission required".to_string()));
    }

    let channel = sqlx::query_as::<_, ChannelRecord>(
        r#"
        DELETE FROM "Channel"
        WHERE id = $1
        RETURNING id, server_id, name, description, created_at
        "#,
    )
    .bind(&channel_id)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(channel))
}

fn validate_uuid(value: &str) -> Result<()> {
    Uuid::parse_str(value).map_err(|_| AppError::BadRequest("invalid channel id".to_string()))?;
    Ok(())
}
