#!/usr/bin/env bash

# Génère une migration SQL automatiquement en diffant backend/schema/schema.sql
# (l'état voulu) contre backend/migrations/ (l'état actuel rejoué par Atlas).
#
# Usage: script/migrate.sh <nom_court_de_la_migration>
# Exemple: script/migrate.sh add_avatar_column

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
SCHEMA_FILE="$BACKEND_DIR/schema/schema.sql"

if ! command -v atlas >/dev/null 2>&1; then
  echo "ERROR: atlas CLI introuvable." >&2
  echo "Installation: curl -sSf https://atlasgo.sh | sh" >&2
  echo "(ou: brew install ariga/tap/atlas   /   scoop install atlas)" >&2
  exit 1
fi

if [[ ! -f "$SCHEMA_FILE" ]]; then
  echo "ERROR: $SCHEMA_FILE introuvable." >&2
  exit 1
fi

if grep -q "CE FICHIER EST UN PLACEHOLDER" "$SCHEMA_FILE"; then
  echo "ERROR: schema.sql est encore le placeholder." >&2
  echo "Génère-le d'abord avec:" >&2
  echo "  cd backend && atlas schema inspect -u \"\$DATABASE_URL\" --format '{{ sql . }}' > schema/schema.sql" >&2
  exit 1
fi

migration_name="${1:-}"
if [[ -z "$migration_name" ]]; then
  echo "Usage: $0 <nom_court_de_la_migration>" >&2
  echo "Exemple: $0 add_avatar_column" >&2
  exit 1
fi

cd "$BACKEND_DIR"

echo "Diff du schéma en cours (schema/schema.sql vs migrations/)..."
atlas migrate diff "$migration_name" --env local

echo "Migration générée dans backend/migrations/. Relis-la avant de commit."
