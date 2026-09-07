//
// EPITECH PROJECT, 2026
// MChat
// File description: OpenAPI documentation
//

pub mod schemas;

use utoipa::OpenApi;
use utoipa::Modify;
use utoipa::openapi::security::{HttpBuilder, HttpAuthScheme, SecurityScheme};

#[derive(OpenApi)]
#[openapi(
    info(
        title = "MChat API",
        version = "1.0.0",
        description = "REST API for the MChat messaging platform",
        license(name = "MIT")
    ),
    servers(
        (url = "http://localhost:3000", description = "Local development server")
    ),
    tags(
        (name = "Health", description = "API health checks"),
        (name = "Auth", description = "Authentication and account login"),
        (name = "Users", description = "User management"),
        (name = "Servers", description = "MChat server management"),
        (name = "Channels", description = "Channel management"),
        (name = "Members", description = "Server member management"),
        (name = "Roles", description = "Server role and permission management"),
        (name = "Messages", description = "Messaging and message management")
    ),
    paths(
        crate::routes::root::root,
        crate::routes::root::health,
        crate::routes::auth::register,
        crate::routes::auth::login,
        crate::routes::users::get_me,
        crate::routes::users::update_me,
        crate::routes::users::get_users,
        crate::routes::users::get_user,
        crate::routes::users::create_user,
        crate::routes::users::update_user,
        crate::routes::users::delete_user,
        crate::routes::users::delete_me,
        crate::routes::servers::get_servers,
        crate::routes::servers::get_my_servers,
        crate::routes::servers::get_server,
        crate::routes::servers::create_server,
        crate::routes::servers::update_server,
        crate::routes::servers::delete_server,
        crate::routes::servers::get_server_channels,
        crate::routes::servers::create_channel,
        crate::routes::channels::update_channel,
        crate::routes::channels::delete_channel,
        crate::routes::members::get_members,
        crate::routes::members::join_server,
        crate::routes::members::update_member_role,
        crate::routes::members::kick_member,
        crate::routes::roles::get_roles,
        crate::routes::roles::create_role,
        crate::routes::roles::update_role,
        crate::routes::roles::delete_role,
        crate::routes::messages::get_messages,
        crate::routes::messages::create_message,
        crate::routes::messages::update_message,
        crate::routes::messages::delete_message
    ),
    components(
        schemas(
            schemas::UserRole,
            schemas::ServerPermission,
            schemas::PublicUser,
            schemas::RegisterBody,
            schemas::LoginBody,
            schemas::TokenResponse,
            schemas::LoginResponse,
            schemas::CreateUserBody,
            schemas::UpdateUserBody,
            schemas::ServerSummary,
            schemas::CreateServerBody,
            schemas::UpdateServerBody,
            schemas::ServerDetail,
            schemas::Channel,
            schemas::CreateChannelBody,
            schemas::UpdateChannelBody,
            schemas::ServerRole,
            schemas::CreateRoleBody,
            schemas::UpdateRoleBody,
            schemas::ServerMember,
            schemas::UpdateMemberBody,
            schemas::Message,
            schemas::CreateMessageBody,
            schemas::UpdateMessageBody,
            schemas::PaginationQuery,
            schemas::MessagePageResponse,
            schemas::ErrorResponse
        )
    ),
    modifiers(&SecurityAddon)
)]
pub struct ApiDoc;

struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        let components = openapi.components.get_or_insert_with(Default::default);

        components.add_security_scheme("bearer_auth", SecurityScheme::Http(HttpBuilder::new().scheme(HttpAuthScheme::Bearer).bearer_format("JWT").build()));
    }
}
