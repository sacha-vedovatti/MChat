//
// EPITECH PROJECT, 2026
// MChat
// File description:
// OpenAPI schemas
//

use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "UPPERCASE")]
pub enum UserRole {
    USER,
    ADMIN
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ServerPermission {
    OWNER,
    ADMIN,
    VIEW_CHANNELS,
    SEND_MESSAGES,
    MANAGE_MESSAGES,
    MANAGE_CHANNELS,
    MANAGE_SERVER,
    MANAGE_ROLES,
    INVITE_MEMBERS,
    KICK_MEMBERS,
    BAN_MEMBERS,
    ADD_REACTIONS,
    USE_EMOJIS,
    ATTACH_FILES
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct PublicUser {
    #[schema(example = "550e8400-e29b-41d4-a716-446655440000")]
    pub id: String,
    pub email: String,
    pub username: String,
    pub avatar_url: Option<String>
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct RegisterBody {
    pub email: String,
    pub username: String,
    pub password: String
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct LoginBody {
    pub email: String,
    pub password: String
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct TokenResponse {
    pub token: String
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct LoginResponse {
    pub token: String,
    pub id: String
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateUserBody {
    pub email: String,
    pub username: String,
    pub password: String,
    pub avatar_url: Option<String>
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UpdateUserBody {
    pub email: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub avatar_url: Option<String>
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ServerSummary {
    pub id: String,
    pub owner_id: String,
    pub name: String,
    pub created_at: NaiveDateTime
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateServerBody {
    pub name: String
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UpdateServerBody {
    pub name: Option<String>
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct Channel {
    pub id: String,
    pub server_id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: NaiveDateTime
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateChannelBody {
    pub name: String,
    pub description: Option<String>
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UpdateChannelBody {
    pub name: Option<String>,
    pub description: Option<String>
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ServerRole {
    pub id: i32,
    pub server_id: String,
    pub name: String,
    pub color: String,
    pub permissions: Vec<ServerPermission>,
    pub is_default: bool,
    pub position: i32,
    pub created_at: NaiveDateTime
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateRoleBody {
    pub name: String,
    pub color: Option<String>,
    pub permissions: Vec<ServerPermission>,
    pub position: Option<i32>
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UpdateRoleBody {
    pub name: Option<String>,
    pub color: Option<String>,
    pub permissions: Option<Vec<ServerPermission>>,
    pub position: Option<i32>
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ServerMember {
    pub user: PublicUser,
    pub role: Option<ServerRole>,
    pub joined_at: NaiveDateTime
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UpdateMemberBody {
    pub role_id: Option<i32>
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct Message {
    pub id: String,
    pub channel_id: String,
    pub sender_id: String,
    pub content: String,
    pub created_at: NaiveDateTime
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateMessageBody {
    #[schema(example = "Hello from MChat!")]
    pub content: String
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UpdateMessageBody {
    #[schema(example = "Hello from MChat, edited!")]
    pub content: String
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct PaginationQuery {
    #[schema(example = 1)]
    pub page: Option<u32>,

    #[schema(example = 50)]
    pub limit: Option<u32>
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct MessagePageResponse {
    pub items: Vec<Message>,
    pub page: u32,
    pub limit: u32,
    pub total: i64
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ServerDetail {
    pub id: String,
    pub owner_id: String,
    pub name: String,
    pub created_at: NaiveDateTime,
    pub channels: Vec<Channel>,
    pub users: Vec<ServerMember>,
    pub roles: Vec<ServerRole>
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ErrorResponse {
    #[schema(example = "invalid credentials")]
    pub error: String
}
