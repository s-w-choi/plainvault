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

.PHONY: help install run migrate reset db-studio test check

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

## Run: Start the Next.js development server
run:
	$(PKG_MANAGER) dev

## Test: Run lint, typecheck, and tests with coverage (requires 90%+ coverage)
test:
	@echo "==> Running lint..."
	$(PKG_MANAGER) run lint || exit 1
	@echo "==> Running typecheck..."
	$(PKG_MANAGER) run typecheck || exit 1
	@echo "==> Running tests with coverage..."
	$(PKG_MANAGER) run test:coverage || exit 1
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

# --- Help ----------------------------------------------------------------------

help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## /  /'
