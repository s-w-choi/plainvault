#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ${NC}  $1"; }
log_success() { echo -e "${GREEN}✓${NC}  $1"; }
log_error() { echo -e "${RED}✗${NC}  $1"; }
log_step() { echo -e "\n${CYAN}▸${NC} ${YELLOW}$1${NC}"; }

VERSION=""
while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--version)
      VERSION="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

PKG_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")

if [ -z "$VERSION" ]; then
  echo ""
  echo "PlainVault Docker Publisher"
  echo ""
  echo "Usage: $0 -v <version>"
  echo ""
  echo "Options:"
  echo "  -v, --version    Docker image version tag (must be > package.json version)"
  echo ""
  echo "Current package.json version: $PKG_VERSION"
  echo "Example: $0 -v 0.0.2"
  echo ""
  exit 1
fi

if [ "$VERSION" = "$PKG_VERSION" ] || [ "$(printf '%s\n%s' "$VERSION" "$PKG_VERSION" | sort -V | head -n1)" = "$VERSION" ]; then
  log_error "Version $VERSION must be greater than package.json version $PKG_VERSION"
  exit 1
fi

IMAGE="boydchoi/plainvault"
CONTAINER_NAME="plainvault-test-$VERSION"

cleanup() {
  if docker ps -a --format '{{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
    docker stop "$CONTAINER_NAME" > /dev/null 2>&1 || true
    docker rm "$CONTAINER_NAME" > /dev/null 2>&1 || true
  fi
  rm -f /tmp/pv-smoke.txt
}
trap cleanup EXIT

if ! docker info > /dev/null 2>&1; then
  log_error "Docker daemon is not running"
  exit 1
fi

has_inline_dockerhub_auth() {
  local config_file="${DOCKER_CONFIG:-$HOME/.docker}/config.json"
  if [ ! -f "$config_file" ]; then
    return 1
  fi

  node - "$config_file" <<'NODE'
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const auths = cfg.auths || {};
const keys = [
  'https://index.docker.io/v1/',
  'https://index.docker.io/v1',
  'https://index.docker.io',
  'https://registry-1.docker.io',
  'https://registry.docker.io',
  'docker.io'
];
for (const key of keys) {
  if (typeof auths[key]?.auth === 'string' && auths[key].auth.length > 0) {
    process.exit(0);
  }
}
process.exit(1);
NODE
}

uses_external_credential_store() {
  local config_file="${DOCKER_CONFIG:-$HOME/.docker}/config.json"
  if [ ! -f "$config_file" ]; then
    return 1
  fi

  node - "$config_file" <<'NODE'
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (cfg.credsStore || cfg.credStore) {
  process.exit(0);
}
process.exit(1);
NODE
}

if ! has_inline_dockerhub_auth; then
  if uses_external_credential_store; then
    log_info "Docker Hub authentication is managed by an external credentials store; proceeding with publish step."
  else
    log_error "Not logged into Docker Hub. Run: docker login"
    exit 1
  fi
fi

if lsof -Pi :13000 -sTCP:LISTEN -t > /dev/null 2>&1; then
  log_error "Port 13000 is already in use"
  exit 1
fi

log_step "Running Unit Tests"
pnpm test
log_success "Unit tests passed"

log_step "Building Application"
cd apps/app
pnpm build
cd ../..
log_success "App build completed"

log_step "Building Docker Image"
docker build -f docker/Dockerfile.app -t "$IMAGE:$VERSION" -t "$IMAGE:latest" .
log_success "Docker image built: $IMAGE:$VERSION"

log_step "Running Smoke Tests"
docker run -d --name "$CONTAINER_NAME" -p 13000:3000 "$IMAGE:$VERSION" > /dev/null

sleep 10

set +e
SMOKED=0
for i in {1..30}; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:13000/api/health | grep -q "200"; then
    SMOKED=1
    break
  fi
  sleep 1
done

if [ "$SMOKED" -eq 0 ]; then
  log_error "Container health check failed"
  docker logs "$CONTAINER_NAME"
  docker stop "$CONTAINER_NAME" > /dev/null && docker rm "$CONTAINER_NAME" > /dev/null
  exit 1
fi

set -e
log_info "Health check: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:13000/api/health)"

curl -s -c /tmp/pv-smoke.txt http://localhost:13000/login > /dev/null
curl -s -b /tmp/pv-smoke.txt -c /tmp/pv-smoke.txt -X POST http://localhost:13000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@plainvault.local","password":"plainvault-admin"}' \
  -o /dev/null -w "%{http_code}" | xargs -I{} log_info "Login endpoint: {}"

curl -s -b /tmp/pv-smoke.txt -X POST http://localhost:13000/api/files \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke Test","actualFileName":"test.txt","contentType":"text","content":"test"}' \
  -o /dev/null -w "%{http_code}" | xargs -I{} log_info "File creation: {}"

docker stop "$CONTAINER_NAME" > /dev/null && docker rm "$CONTAINER_NAME" > /dev/null
rm -f /tmp/pv-smoke.txt
log_success "Smoke tests passed"

log_step "Publishing to Docker Hub"
log_info "Pushing $IMAGE:$VERSION..."
docker push "$IMAGE:$VERSION"
log_info "Pushing $IMAGE:latest..."
docker push "$IMAGE:latest"

log_success "Published: $IMAGE:$VERSION and $IMAGE:latest"
