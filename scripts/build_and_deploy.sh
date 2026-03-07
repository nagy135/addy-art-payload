#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "${script_dir}/.." && pwd)"
env_file="${ENV_FILE:-${project_root}/.env}"

if [[ -f "$env_file" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a
fi

usage() {
  cat <<'EOF'
Usage:
  ./scripts/build_and_deploy.sh

Description:
  Rebuilds and redeploys the production app container with a hard reset of the local app image.

Default behavior:
  1. Stops the app service
  2. Removes the existing app container
  3. Removes the local app image
  4. Builds the app image with --no-cache
  5. Starts the app service again

Overrides:
  - COMPOSE_FILE_PATH=/abs/path/docker-compose.production.yml
  - APP_SERVICE=app
  - APP_IMAGE=addy-art-payload-app

Examples:
  ./scripts/build_and_deploy.sh
  COMPOSE_FILE_PATH=./docker-compose.production.yml ./scripts/build_and_deploy.sh
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

if [[ -n "${COMPOSE_FILE_PATH:-}" ]]; then
  compose_cmd=(docker compose -f "$COMPOSE_FILE_PATH")
else
  compose_cmd=(docker compose -f "${project_root}/docker-compose.production.yml")
fi

app_service="${APP_SERVICE:-app}"
app_image="${APP_IMAGE:-addy-art-payload-app}"

cd "$project_root"

if ! "${compose_cmd[@]}" config --services >/dev/null 2>&1; then
  echo "Error: docker compose project is not accessible from ${project_root}." >&2
  exit 1
fi

if ! "${compose_cmd[@]}" config --services | grep -qx "$app_service"; then
  echo "Error: Docker service '$app_service' was not found in the compose project." >&2
  exit 1
fi

echo "Stopping service: $app_service"
"${compose_cmd[@]}" stop "$app_service" || true

echo "Removing existing container for service: $app_service"
"${compose_cmd[@]}" rm -f "$app_service" || true

existing_image_id="$(docker images -q "$app_image" | head -n 1 || true)"

if [[ -n "$existing_image_id" ]]; then
  echo "Removing existing image: $app_image ($existing_image_id)"
  docker image rm -f "$app_image"
else
  echo "No existing image found for: $app_image"
fi

echo "Building service '$app_service' with --no-cache"
"${compose_cmd[@]}" build --no-cache "$app_service"

echo "Starting service '$app_service'"
"${compose_cmd[@]}" up -d --force-recreate "$app_service"

echo
echo "Deployment complete. Current status:"
"${compose_cmd[@]}" ps "$app_service"
