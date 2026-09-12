//
// EPITECH PROJECT, 2026
// MChat
// File description:
// Routes module
//

use crate::app_state::AppState;
use axum::Router;

pub mod auth;
pub mod bans;
pub mod blocks;
pub mod channels;
pub mod direct_messages;
pub mod friends;
pub mod invitations;
pub mod members;
pub mod messages;
pub mod roles;
pub mod root;
pub mod servers;
pub mod users;

pub fn router() -> Router<AppState> {
    Router::new()
        .merge(root::router())
        .merge(auth::router())
        .merge(bans::router())
        .merge(blocks::router())
        .merge(users::router())
        .merge(servers::router())
        .merge(channels::router())
        .merge(invitations::router())
        .merge(members::router())
        .merge(roles::router())
        .merge(messages::router())
        .merge(friends::router())
        .merge(direct_messages::router())
}
