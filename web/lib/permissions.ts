/*
** EPITECH PROJECT, 2026
** MChat
** File description:
** Permission keys used by roles
*/

export const PERMISSIONS: { key: string; label: string; description: string }[] = [
  { key: "ADMIN", label: "Administrateur", description: "Accès complet à toutes les fonctionnalités du serveur." },
  { key: "MANAGE_SERVER", label: "Gérer le serveur", description: "Modifier le nom et les paramètres généraux du serveur." },
  { key: "MANAGE_ROLES", label: "Gérer les rôles", description: "Créer, modifier et supprimer les rôles." },
  { key: "MANAGE_CHANNELS", label: "Gérer les salons", description: "Créer, modifier et supprimer les salons." },
  { key: "KICK_MEMBERS", label: "Expulser des membres", description: "Renvoyer un membre du serveur." },
  { key: "BAN_MEMBERS", label: "Bannir des membres", description: "Bannir définitivement un membre du serveur." },
  { key: "MANAGE_MESSAGES", label: "Gérer les messages", description: "Supprimer les messages des autres membres." },
  { key: "SEND_MESSAGES", label: "Envoyer des messages", description: "Écrire dans les salons textuels." },
  { key: "VIEW_CHANNELS", label: "Voir les salons", description: "Voir et lire les salons du serveur." }
];
