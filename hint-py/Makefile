.PHONY: install
install: ## Create the virtual environment and install the git hooks
	@uv sync
	@uv run pre-commit install -c ../.pre-commit-config.yaml

.PHONY: check
check: ## Lint, format check and type check (what the pre-commit hook runs)
	@uv lock --check
	@uv run pre-commit run -a -c ../.pre-commit-config.yaml

.PHONY: test
test: ## Run the tests with coverage
	@uv run pytest --cov --cov-report=term-missing --cov-report=xml

.PHONY: run
run: ## Run the API locally with auto reload
	@uv run fastapi dev app/main.py

# Sends the logs and traces to the dashboard that `make otel-up` starts
run-otel: export OTEL_SERVICE_NAME = hint-py
run-otel: export OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED = true
run-otel: export OTEL_EXPORTER_OTLP_ENDPOINT = http://localhost:4317
.PHONY: run-otel
run-otel: ## Run the API as `run` does, sending its logs and traces to the local dashboard (see `otel-up`)
	@uv run opentelemetry-instrument fastapi dev app/main.py

.PHONY: otel-up
otel-up: ## Start the local OpenTelemetry dashboard, at http://localhost:18888
	@docker compose -f ../docker-compose.yml --profile otel up -d otel
	@echo Dashboard: http://localhost:18888

.PHONY: otel-down
otel-down: ## Stop the local OpenTelemetry dashboard
	@docker compose -f ../docker-compose.yml --profile otel stop otel

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
