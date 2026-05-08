# =============================================================================
# PlainVault Makefile
# =============================================================================
#
# Development workflow targets for the PlainVault application.
# Requires pnpm as the package manager.
#
# Usage:
#   make install   - Install dependencies and set up the database
#   make run       - Start the Next.js development server
#   make help      - Display this help message
#
# =============================================================================

# --- Configuration -------------------------------------------------------------

# Node package manager (pnpm is required for this project)
PKG_MANAGER := pnpm

# Prisma schema path
PRISMA_SCHEMA := prisma/schema.prisma

# Default target
.DEFAULT_GOAL := help

# --- Phony Targets -------------------------------------------------------------

.PHONY: help install run migrate reset db-studio test check docker-landing docker-service deploy-web deploy-web-preview

# --- Targets -------------------------------------------------------------------

## Install: Install pnpm if needed, install dependencies, generate Prisma client, set up DB
install:
	@echo "==> Checking pnpm installation..."
	@command -v pnpm >/dev/null 2>&1 || (echo "pnpm not found. Installing..." && npm install -g pnpm)
	@echo "==> Installing dependencies..."
	$(PKG_MANAGER) install
	@echo "==> Generating Prisma client..."
	$(PKG_MANAGER) prisma:generate
	@echo "==> Running database migrations..."
	$(PKG_MANAGER) db:migrate
	@echo "==> Install complete."

## Run: Start all apps in parallel (web@13001 landing, app@13000 main service)
run:
	$(PKG_MANAGER) dev

## Test: Run lint, typecheck, and tests (requires 90%+ coverage)
test:
	@echo "==> Running lint..."
	$(PKG_MANAGER) run lint || exit 1
	@echo "==> Running typecheck..."
	$(PKG_MANAGER) run typecheck || exit 1
	@echo "==> Running tests..."
	$(PKG_MANAGER) run test || exit 1
	@echo "==> Checking coverage (90% threshold)..."
	@coverage=$$(./node_modules/.bin/vitest run --coverage 2>&1 | grep "^All files" | awk -F'|' '{gsub(/ /,"",$$2); print $$2}' | cut -d'.' -f1); \
	if [ -n "$$coverage" ] && [ "$$coverage" -ge 90 ]; then \
		echo "Coverage: $$coverage% (OK - >= 90%)"; \
	else \
		echo "Coverage: $$coverage% (FAIL - need 90%)"; \
		exit 1; \
	fi
	@echo "==> All checks passed."

## Migrate: Run Prisma migrations (for CI/manual DB updates)
migrate:
	$(PKG_MANAGER) db:migrate

## Reset: Reset the database (WARNING: destroys all data)
reset:
	$(PKG_MANAGER) db:reset

## db-studio: Open Prisma Studio to inspect the database
db-studio:
	$(PKG_MANAGER) db:studio

## Seed: Seed the database with initial data
seed:
	$(PKG_MANAGER) db:seed

## docker-landing: Build and run landing page (web) Docker container
docker-landing:
	docker build -f docker/Dockerfile.web -t plainvault-web .
	docker run -p 13001:3001 plainvault-web

## docker-service: Build and run main service (app) Docker container
docker-service:
	docker build -f docker/Dockerfile.app -t plainvault-app .
	docker run -p 13000:3000 plainvault-app

## deploy-web: Deploy landing page to Vercel (production)
deploy-web:
	@bash scripts/deploy-web.sh

## deploy-web-preview: Deploy landing page to Vercel (preview)
deploy-web-preview:
	@bash scripts/deploy-web.sh --preview

# --- Help ----------------------------------------------------------------------

help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
