.DEFAULT_GOAL := help

COMPOSE := docker compose
SQLC := $(shell go env GOPATH)/bin/sqlc

.PHONY: help env-init env-up env-down env-cleanup env-logs migrate-create migrate-up migrate-down migrate-version
.PHONY: sqlc-generate

help:
	@printf '%s\n' \
	  'make env-init                  Copy .env.example if .env is absent' \
	  'make env-up                    Start PostgreSQL and wait for readiness' \
	  'make env-down                  Stop containers; preserve database data' \
	  'make env-logs                  Follow PostgreSQL logs' \
	  'make env-cleanup               Delete the local database after confirmation' \
	  'make migrate-create name=init  Create a pair of SQL migration files' \
	  'make migrate-up                Apply pending migrations' \
	  'make migrate-down              Roll back one migration' \
	  'make migrate-version           Show the current migration version' \
	  'make sqlc-generate             Generate Go code from SQL queries'

sqlc-generate:
	@"$(SQLC)" generate

env-init:
	@if [ -e .env ]; then \
		echo '.env already exists; left unchanged'; \
	else \
		cp .env.example .env; \
	fi

env-up:
	@$(COMPOSE) up -d --wait postgres

env-down:
	@$(COMPOSE) down

env-logs:
	@$(COMPOSE) logs -f postgres

env-cleanup:
	@printf 'Delete ALL local Wordveil database data? [y/N]: '; \
	read -r answer; \
	if [ "$$answer" = y ]; then \
		$(COMPOSE) down --volumes; \
	else \
		echo 'Cancelled'; \
	fi

migrate-create:
	@case "$(name)" in \
	  ''|*[!a-zA-Z0-9_-]*) echo 'Use: make migrate-create name=create_users (letters, digits, _ and -)'; exit 1 ;; \
	esac
	@$(COMPOSE) run --rm --no-deps migrate create -ext sql -dir /migrations -seq "$(name)"

migrate-up:
	@$(MAKE) env-up
	@$(COMPOSE) run --rm --no-deps migrate

migrate-down:
	@$(MAKE) env-up
	@MIGRATE_ACTION=down MIGRATE_STEPS=1 $(COMPOSE) run --rm --no-deps migrate

migrate-version:
	@$(MAKE) env-up
	@MIGRATE_ACTION=version $(COMPOSE) run --rm --no-deps migrate
