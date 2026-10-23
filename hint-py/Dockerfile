FROM python:3.13-slim
COPY --from=ghcr.io/astral-sh/uv:0.8 /uv /usr/local/bin/uv

WORKDIR /app
# The venv lives outside /app so that docker-compose can bind mount the source over /app
ENV UV_PROJECT_ENVIRONMENT=/opt/venv UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .
EXPOSE 8000
# No --reload here, docker-compose.yml adds it for development
CMD ["uv", "run", "--frozen", "--no-dev", "fastapi", "run", "main.py", "--port", "8000"]
