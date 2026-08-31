//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Database schema (all models)
//

use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "UserRole", rename_all = "UPPERCASE")]
pub enum UserRole {
    USER,
    ADMIN
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "ServerPermissions", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ServerPermission {
    OWNER,
    ADMIN,
    VIEW_CHANNEL,
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

impl sqlx::postgres::PgHasArrayType for ServerPermission {
    fn array_type_info() -> sqlx::postgres::PgTypeInfo {
        sqlx::postgres::PgTypeInfo::with_name("\"_ServerPermissions\"")
    }

    fn array_compatible(ty: &sqlx::postgres::PgTypeInfo) -> bool {
        *ty == sqlx::postgres::PgTypeInfo::with_name("_ServerPermissions")
    }
}

impl ServerPermission {
    pub fn as_str(self) -> &'static str {
        match self {
            ServerPermission::OWNER => "OWNER",
            ServerPermission::ADMIN => "ADMIN",
            ServerPermission::VIEW_CHANNEL => "VIEW_CHANNEL",
            ServerPermission::SEND_MESSAGES => "SEND_MESSAGES",
            ServerPermission::MANAGE_MESSAGES => "MANAGE_MESSAGES",
            ServerPermission::MANAGE_CHANNELS => "MANAGE_CHANNELS",
            ServerPermission::MANAGE_SERVER => "MANAGE_SERVER",
            ServerPermission::MANAGE_ROLES => "MANAGE_ROLES",
            ServerPermission::INVITE_MEMBERS => "INVITE_MEMBERS",
            ServerPermission::KICK_MEMBERS => "KICK_MEMBERS",
            ServerPermission::BAN_MEMBERS => "BAN_MEMBERS",
            ServerPermission::ADD_REACTIONS => "ADD_REACTIONS",
            ServerPermission::USE_EMOJIS => "USE_EMOJIS",
            ServerPermission::ATTACH_FILES => "ATTACH_FILES"
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PublicUser {
    pub id: String,
    pub email: String,
    pub username: String,
    pub avatar_url: Option<String>
}

#[derive(Debug, Clone, FromRow)]
pub struct UserRecord {
    pub id: String,
    pub email: String,
    pub username: String,
    pub password: String,
    pub avatar_url: Option<String>,
    pub role: UserRole,
    pub created_at: NaiveDateTime
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ServerSummary {
    pub id: String,
    pub owner_id: String,
    pub name: String,
    pub created_at: NaiveDateTime
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ChannelRecord {
    pub id: String,
    pub server_id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: NaiveDateTime
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ServerRoleRecord {
    pub id: i32,
    pub server_id: String,
    pub name: String,
    pub permissions: Vec<ServerPermission>,
    pub is_default: bool,
    pub position: i32,
    pub created_at: NaiveDateTime
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ServerMemberRecord {
    pub server_id: String,
    pub user_id: String,
    pub role_id: Option<i32>,
    pub joined_at: NaiveDateTime
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MessageRecord {
    pub id: String,
    pub channel_id: String,
    pub sender_id: String,
    pub content: String,
    pub created_at: NaiveDateTime
}

#[derive(Debug, Clone, Serialize)]
pub struct ServerRoleResponse {
    pub id: i32,
    pub server_id: String,
    pub name: String,
    pub permissions: Vec<ServerPermission>,
    pub is_default: bool,
    pub position: i32,
    pub created_at: NaiveDateTime
}

#[derive(Debug, Clone, Serialize)]
pub struct ServerMemberResponse {
    pub user: PublicUser,
    pub role: Option<ServerRoleResponse>,
    pub joined_at: NaiveDateTime
}

#[derive(Debug, Clone, Serialize)]
pub struct ServerDetailResponse {
    pub id: String,
    pub owner_id: String,
    pub name: String,
    pub created_at: NaiveDateTime,
    pub channels: Vec<ChannelRecord>,
    pub users: Vec<ServerMemberResponse>,
    pub roles: Vec<ServerRoleResponse>
}

#[derive(Debug, Clone, Serialize)]
pub struct MessageResponse {
    pub id: String,
    pub channel_id: String,
    pub sender_id: String,
    pub content: String,
    pub created_at: NaiveDateTime
}

impl From<MessageRecord> for MessageResponse {
    fn from(value: MessageRecord) -> Self {
        Self {
            id: value.id,
            channel_id: value.channel_id,
            sender_id: value.sender_id,
            content: value.content,
            created_at: value.created_at
        }
    }
}

impl From<ServerRoleRecord> for ServerRoleResponse {
    fn from(value: ServerRoleRecord) -> Self {
        Self {
            id: value.id,
            server_id: value.server_id,
            name: value.name,
            permissions: value.permissions,
            is_default: value.is_default,
            position: value.position,
            created_at: value.created_at
        }
    }
}
