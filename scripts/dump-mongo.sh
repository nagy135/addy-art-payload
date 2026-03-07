#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "${script_dir}/.." && pwd)"
env_file="${ENV_FILE:-${project_root}/.env}"

if [[ -f "$env_file" ]]; then
  set -a
  # Load MONGO_ROOT_* and DATABASE_URL from .env when present.
  # shellcheck disable=SC1090
  source "$env_file"
  set +a
fi

usage() {
  cat <<'EOF'
Usage:
  ./scripts/dump-mongo.sh [output-file.gz]

Description:
  Creates a gzipped MongoDB dump by running mongodump inside the Docker mongo service.
  The resulting .gz file is written on the host, outside Docker, so you can copy it elsewhere.

Defaults:
  - Docker service: mongo
  - Auth database: admin
  - Root username: MONGO_ROOT_USER or admin
  - Root password: MONGO_ROOT_PASSWORD or password123
  - Database name: parsed from MONGODB_URI or DATABASE_URL

Overrides:
  - COMPOSE_FILE_PATH=/abs/path/docker-compose.production.yml
  - MONGO_SERVICE=mongo
  - MONGO_DB_NAME=my_database
  - MONGO_AUTH_DB=admin

Examples:
  ./scripts/dump-mongo.sh
  COMPOSE_FILE_PATH=./docker-compose.production.yml ./scripts/dump-mongo.sh backups/prod.gz
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed or not in PATH." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Error: docker compose is not available." >&2
  exit 1
fi

mongo_service="${MONGO_SERVICE:-mongo}"
mongo_user="${MONGO_ROOT_USER:-admin}"
mongo_password="${MONGO_ROOT_PASSWORD:-password123}"
mongo_auth_db="${MONGO_AUTH_DB:-admin}"
mongo_uri="${MONGODB_URI:-${DATABASE_URL:-}}"

if [[ -n "${COMPOSE_FILE_PATH:-}" ]]; then
  compose_cmd=(docker compose -f "$COMPOSE_FILE_PATH")
else
  compose_cmd=(docker compose)
fi

if ! "${compose_cmd[@]}" ps --services >/dev/null 2>&1; then
  echo "Error: docker compose project is not accessible from ${project_root}." >&2
  exit 1
fi

if ! "${compose_cmd[@]}" ps --services | grep -qx "$mongo_service"; then
  echo "Error: Docker service '$mongo_service' was not found in the compose project." >&2
  exit 1
fi

mongo_db_name="${MONGO_DB_NAME:-}"

if [[ -z "$mongo_db_name" && -n "$mongo_uri" ]]; then
  mongo_db_name="$(node -e "const raw = process.argv[1]; const url = new URL(raw); const db = url.pathname.replace(/^\\//, ''); if (!db) process.exit(2); process.stdout.write(db);" "$mongo_uri" 2>/dev/null || true)"
fi

if [[ -z "$mongo_db_name" ]]; then
  echo "Error: could not determine database name. Set MONGO_DB_NAME or DATABASE_URL/MONGODB_URI." >&2
  exit 1
fi

timestamp="$(date +"%Y-%m-%d-%H%M%S")"
output_file="${1:-mongo-dump-${timestamp}.gz}"
output_dir="$(dirname "$output_file")"

mkdir -p "$output_dir"

echo "Creating MongoDB dump from Docker service '$mongo_service' into $output_file"
"${compose_cmd[@]}" exec -T \
  -e MONGO_USER="$mongo_user" \
  -e MONGO_PASSWORD="$mongo_password" \
  -e MONGO_AUTH_DB="$mongo_auth_db" \
  -e MONGO_DB_NAME="$mongo_db_name" \
  "$mongo_service" \
  sh -lc 'exec mongodump \
    --host 127.0.0.1 \
    --port 27017 \
    --username "$MONGO_USER" \
    --password "$MONGO_PASSWORD" \
    --authenticationDatabase "$MONGO_AUTH_DB" \
    --db "$MONGO_DB_NAME" \
    --archive \
    --gzip' > "$output_file"

echo "Dump created successfully: $output_file"
