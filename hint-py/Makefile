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

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
