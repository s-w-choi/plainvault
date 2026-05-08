#!/usr/bin/env bash
# =============================================================================
# deploy-web.sh — Deploy PlainVault landing page (apps/web) to Vercel
# =============================================================================
#
# Usage:
#   ./scripts/deploy-web.sh              # Deploy to production
#   ./scripts/deploy-web.sh --preview    # Deploy preview
#   ./scripts/deploy-web.sh --setup      # First-time Vercel project linking
#
# Prerequisites:
#   - pnpm
#   - Vercel CLI (npm i -g vercel)
#   - Logged into Vercel (vercel login)
#
# =============================================================================

set -euo pipefail

# --- Colors -------------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

# --- Paths --------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"

# --- Args ---------------------------------------------------------------------

MODE="production"

for arg in "$@"; do
  case "$arg" in
    --preview)  MODE="preview" ;;
    --setup)    MODE="setup" ;;
    --help|-h)
      echo "Usage: $0 [--preview|--setup|--help]"
      echo ""
      echo "  (default)   Deploy to production"
      echo "  --preview   Deploy a preview"
      echo "  --setup     First-time Vercel project linking"
      echo "  --help      Show this help"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown argument: $arg${NC}"
      exit 1
      ;;
  esac
done

# --- Helpers ------------------------------------------------------------------

info()  { echo -e "${GREEN}==>${NC} $*"; }
warn()  { echo -e "${YELLOW}==>${NC} $*"; }
error() { echo -e "${RED}ERROR:${NC} $*" >&2; exit 1; }

# --- Prerequisites ------------------------------------------------------------

info "Checking prerequisites..."

command -v pnpm >/dev/null 2>&1 || error "pnpm not found. Install: npm i -g pnpm"
command -v vercel >/dev/null 2>&1 || {
  warn "Vercel CLI not found. Installing..."
  pnpm add -g vercel
}

[ -f "$ROOT_DIR/pnpm-workspace.yaml" ] || error "Not in PlainVault repo root"
[ -f "$WEB_DIR/package.json" ] || error "apps/web not found"

# --- Setup Mode ---------------------------------------------------------------

if [ "$MODE" = "setup" ]; then
  info "${BOLD}First-time Vercel project setup${NC}"
  echo ""
  echo "This will:"
  echo "  1. Link apps/web to a new or existing Vercel project"
  echo "  2. Configure build settings for the monorepo"
  echo ""

  cd "$WEB_DIR"
  vercel link

  echo ""
  info "Setup complete! Now deploy with:"
  echo "  $0          # production"
  echo "  $0 --preview"
  exit 0
fi

# --- Build Verification -------------------------------------------------------

info "Building @plainvault/web to verify compilation..."

cd "$ROOT_DIR"
pnpm --filter @plainvault/web build

if [ $? -ne 0 ]; then
  error "Build failed. Fix errors before deploying."
fi

info "Build succeeded."

# --- Deploy -------------------------------------------------------------------

cd "$WEB_DIR"

if [ ! -f ".vercel/project.json" ]; then
  warn "Vercel project not linked yet."
  info "Run '$0 --setup' first, or linking now..."
  vercel link
fi

if [ "$MODE" = "production" ]; then
  info "${BOLD}Deploying to production...${NC}"
  vercel deploy --prod --yes
else
  info "${BOLD}Deploying preview...${NC}"
  vercel deploy --yes
fi

echo ""
info "${BOLD}Done!${NC} Landing page deployed."
