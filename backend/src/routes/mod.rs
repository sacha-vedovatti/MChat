use crate::app_state::AppState;
use axum::Router;

pub mod auth;
pub mod channels;
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
        .merge(users::router())
        .merge(servers::router())
        .merge(channels::router())
        .merge(members::router())
        .merge(roles::router())
        .merge(messages::router())
}
