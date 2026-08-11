# API Implementation

| Catégorie | Méthode | Route | Description | Authentification |
| :--- | :--- | :--- | :--- | :--- |
| **Général** | `GET` | `/` | Message de bienvenue / Accueil API | ❌ Non |
| | `GET` | `/health` | Vérification du statut de l'API (Healthcheck) | ❌ Non |
| **Authentification** | `POST` | `/auth/register` | Créer un nouveau compte utilisateur (Rôle par défaut: `USER`) | ❌ Non |
| | `POST` | `/auth/login` | Connecter un utilisateur (Retourne un Token/JWT) | ❌ Non |
| **Utilisateurs (Global)** | `GET` | `/users/me` | Récupérer le profil de l'utilisateur connecté | 🔒 Oui |
| | `PUT` | `/users/me` | Modifier le profil ou l'avatar (`avatar_url`) de l'utilisateur connecté | 🔒 Oui |
| | `GET` | `/users` | Récupérer la liste de tous les utilisateurs du système | 🔒 Oui |
| | `GET` | `/users/:id` | Récupérer le profil d'un utilisateur spécifique | 🔒 Oui |
| | `POST` | `/users` | Créer un utilisateur manuellement | ⛔️ Admin (Global) |
| | `PUT` | `/users/:id` | Mettre à jour le profil d'un utilisateur tiers | ⛔️ Admin (Global) |
| | `DELETE` | `/users/:id` | Supprimer définitivement un compte utilisateur | ⛔️ Admin (Global) |
| **Serveurs** | `GET` | `/servers` | Récupérer les serveurs dont l'utilisateur connecté est membre | 🔒 Oui |
| | `GET` | `/servers/:serverId` | Récupérer les détails d'un serveur spécifique | 🔒 Oui |
| | `POST` | `/servers` | Créer un nouveau serveur (crée automatiquement un rôle par défaut) | 🔒 Oui |
| | `PUT` | `/servers/:serverId` | Modifier les paramètres d'un serveur (ex: nom) | 🔒 Perm. `MANAGE_SERVER` |
| | `DELETE` | `/servers/:serverId` | Supprimer définitivement un serveur et ses données | 🔒 Perm. `MANAGE_SERVER` |
| **Salons (Channels)** | `GET` | `/servers/:serverId/channels` | Liste des salons d'un serveur spécifique | 🔒 Perm. `VIEW_CHANNEL` |
| | `POST` | `/servers/:serverId/channels` | Créer un nouveau salon dans un serveur | 🔒 Perm. `MANAGE_CHANNELS` |
| | `PUT` | `/channels/:channelId` | Modifier les propriétés d'un salon (titre, description) | 🔒 Perm. `MANAGE_CHANNELS` |
| | `DELETE` | `/channels/:channelId` | Supprimer un salon et tous ses messages | 🔒 Perm. `MANAGE_CHANNELS` |
| **Membres (Participants)** | `GET` | `/servers/:serverId/members` | Voir la liste des membres du serveur (avec leurs rôles) | 🔒 Oui |
| | `POST` | `/servers/:serverId/members` | Rejoindre un serveur (via une invitation par exemple) | 🔒 Oui |
| | `PUT` | `/servers/:serverId/members/:userId` | Modifier le rôle assigné à un membre du serveur | 🔒 Perm. `MANAGE_ROLES` |
| | `DELETE` | `/servers/:serverId/members/:userId` | Expulser un membre du serveur | 🔒 Perm. `KICK_MEMBERS` |
| **Rôles de Serveur** | `GET` | `/servers/:serverId/roles` | Récupérer les rôles existants sur le serveur | 🔒 Oui |
| | `POST` | `/servers/:serverId/roles` | Créer un nouveau rôle avec des permissions spécifiques | 🔒 Perm. `MANAGE_ROLES` |
| | `PUT` | `/servers/:serverId/roles/:roleId` | Modifier un rôle (nom, permissions, position) | 🔒 Perm. `MANAGE_ROLES` |
| | `DELETE` | `/servers/:serverId/roles/:roleId` | Supprimer un rôle du serveur | 🔒 Perm. `MANAGE_ROLES` |
| **Messages** | `GET` | `/channels/:channelId/messages` | Récupérer l'historique des messages d'un salon (Pagination) | 🔒 Perm. `VIEW_CHANNEL` |
| | `POST` | `/channels/:channelId/messages` | Envoyer un nouveau message dans un salon | 🔒 Perm. `SEND_MESSAGES` |
| | `DELETE` | `/messages/:messageId` | Supprimer un message spécifique (le sien ou celui d'un autre) | 🔒 Propriétaire ou `MANAGE_MESSAGES` |
