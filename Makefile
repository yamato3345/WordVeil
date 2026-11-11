.DEFAULT_GOAL := dev

.PHONY: dev backend down logs client-deps

dev: client-deps backend
	API_PROXY_TARGET=http://127.0.0.1:8080 npm --prefix client run tauri -- dev

client-deps:
	@command -v cargo >/dev/null || { echo 'Install Rust/Cargo and the Tauri system dependencies first'; exit 1; }
	@if [ ! -x client/node_modules/.bin/tauri ]; then npm --prefix client ci; fi

backend:
	docker compose up --build --wait --remove-orphans

down:
	docker compose down --remove-orphans

logs:
	docker compose logs -f server postgres
