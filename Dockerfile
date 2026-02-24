FROM node:18-alpine AS frontend-builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY shared/ ./shared/
COPY client/ ./client/
RUN npm ci
RUN npm run build

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml ./
RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    sqlalchemy \
    asyncpg \
    psycopg2-binary \
    python-dotenv \
    pydantic \
    alembic \
    bcrypt \
    "python-jose[cryptography]" \
    python-multipart \
    openai \
    aiohttp \
    requests \
    schedule \
    pandas \
    openpyxl \
    xlrd

COPY python_backend/ ./python_backend/
COPY shared/ ./shared/

COPY --from=frontend-builder /app/client/dist ./client/dist

WORKDIR /app/python_backend

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["python", "-m", "uvicorn", "simple_server:app", "--host", "0.0.0.0", "--port", "8000"]
