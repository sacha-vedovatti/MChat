# Configuration Atlas pour le backend MChat.
#
# Concept : "src" est ton schéma DÉCLARÉ (l'état voulu de la base, écrit à la
# main dans schema/schema.sql, un peu comme un schema.prisma mais en SQL brut).
# Atlas compare cet état voulu à l'état réel obtenu en rejouant le contenu de
# backend/migrations/, et génère automatiquement le fichier .sql de diff.
#
# L'application des migrations reste gérée par sqlx::migrate!() au démarrage
# du backend (main.rs) — Atlas ne fait QUE générer les fichiers, il ne touche
# jamais à ta base de dev/prod directement, sauf si tu appelles explicitement
# `atlas migrate apply`.

variable "db_url" {
  type    = string
  default = getenv("DATABASE_URL")
}

env "local" {
  # Schéma désiré : ce que la base DOIT ressembler après application de
  # toutes les migrations. C'est ce fichier que tu édites à la main.
  src = "file://schema/schema.sql"

  # Base de données "dev" éphémère utilisée par Atlas comme bac à sable pour
  # calculer le diff en toute sécurité (jamais ta vraie base). Atlas la
  # démarre lui-même via Docker.
  dev = "docker://postgres/16/dev?search_path=public"

  migration {
    dir = "file://migrations"
  }
}
