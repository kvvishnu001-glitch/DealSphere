# DealSphere Deployment Guide

This guide covers building Docker images for both the frontend (UI) and backend, configuring environment variables, and deploying the full-stack application.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Docker - Backend](#docker---backend)
5. [Docker - Frontend (UI)](#docker---frontend-ui)
6. [Docker Compose - Full Stack](#docker-compose---full-stack)
7. [Database Setup](#database-setup)
8. [Manual Deployment (No Docker)](#manual-deployment-no-docker)
9. [Production Checklist](#production-checklist)

---

## Architecture Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend (UI)  │────▶│  Backend (API)   │────▶│   PostgreSQL     │
│   React + Vite   │     │  FastAPI/Python  │     │   Database       │
│   Served by      │     │  Port 8000       │     │   Port 5432      │
│   nginx :80      │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

- **Frontend:** React SPA built with Vite, served by nginx (or by the backend in unified mode).
- **Backend:** FastAPI Python server handling API routes, SEO rendering, and static file serving.
- **Database:** PostgreSQL for all data storage.

---

## Prerequisites

- Docker 20.10+ and Docker Compose v2+
- Node.js 18+ (for local frontend builds)
- Python 3.11+ (for local backend runs)
- PostgreSQL 15+ (or use the Docker Compose database)

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dealsphere` |
| `JWT_SECRET_KEY` | Secret for signing admin JWT tokens | Random 64+ char string |
| `OPENAI_API_KEY` | OpenAI API key for AI deal validation | `sk-...` |

### Optional Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `8000` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `*` (all) |
| `AWS_ACCESS_KEY_ID` | Amazon PA-API access key | - |
| `AWS_SECRET_ACCESS_KEY` | Amazon PA-API secret key | - |
| `AMAZON_ASSOCIATE_TAG` | Amazon Associates tag | - |
| `CJ_DEVELOPER_KEY` | Commission Junction API key | - |
| `CJ_WEBSITE_ID` | CJ website ID | - |
| `CLICKBANK_CLIENT_ID` | ClickBank client ID | - |
| `CLICKBANK_DEVELOPER_KEY` | ClickBank developer key | - |
| `CLICKBANK_NICKNAME` | ClickBank nickname | - |

### Generating a JWT Secret Key

```bash
openssl rand -hex 64
```

---

## Docker - Backend

### Build the Backend Image

```bash
docker build -t dealsphere-backend -f Dockerfile .
```

### Run the Backend Container

```bash
docker run -d \
  --name dealsphere-backend \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dealsphere" \
  -e JWT_SECRET_KEY="your-secret-key" \
  -e OPENAI_API_KEY="sk-..." \
  -e ALLOWED_ORIGINS="https://your-frontend-domain.com" \
  dealsphere-backend
```

### Dockerfile Explained

The backend Dockerfile is a **multi-stage build**:

1. **Stage 1 (frontend-builder):** Installs Node.js dependencies and builds the React frontend into static files.
2. **Stage 2 (backend):** Sets up Python 3.11, installs backend dependencies from `pyproject.toml`, copies the built frontend, and runs the FastAPI server.

In unified mode, the backend serves both the API and the frontend static files.

---

## Docker - Frontend (UI)

For standalone frontend deployment (separate from backend), use `Dockerfile.frontend`.

### Build the Frontend Image

```bash
docker build -t dealsphere-frontend -f Dockerfile.frontend .
```

### Run the Frontend Container

```bash
docker run -d \
  --name dealsphere-frontend \
  -p 80:80 \
  -e BACKEND_URL="http://dealsphere-backend:8000" \
  dealsphere-frontend
```

### Dockerfile.frontend Explained

1. **Stage 1 (build):** Installs Node.js dependencies and builds the React app with Vite.
2. **Stage 2 (serve):** Uses nginx to serve the built static files. Includes a custom nginx config that:
   - Serves the SPA with history-mode routing (all paths fall back to `index.html`).
   - Proxies `/api/*` requests to the backend server.
   - Enables gzip compression for static assets.
   - Sets proper cache headers for JS/CSS bundles.

### Custom Backend URL

The nginx config proxies API calls to the backend. Set `BACKEND_URL` at container startup to configure where the proxy points:

```bash
docker run -d \
  -e BACKEND_URL="http://api.example.com:8000" \
  dealsphere-frontend
```

---

## Docker Compose - Full Stack

The easiest way to run the entire stack:

### Start Everything

```bash
# Copy .env.example to .env and fill in values
cp .env.example .env

# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop everything
docker compose down
```

### Services

| Service | Port | Description |
|---|---|---|
| `backend` | 8000 | FastAPI backend + static frontend |
| `frontend` | 80 | Standalone nginx frontend (optional) |
| `db` | 5432 | PostgreSQL database |

### Using Only Backend + DB (Unified Mode)

If you want the backend to serve both API and frontend (recommended for simpler setups):

```bash
docker compose up -d backend db
```

The backend serves the frontend at `http://localhost:8000`.

### Using Separate Frontend + Backend + DB

```bash
docker compose up -d --build
```

- Frontend at `http://localhost:80`
- Backend API at `http://localhost:8000`
- Database at `localhost:5432`

---

## Database Setup

### Create an App-Specific Database User (Recommended)

For production, do **not** use a PostgreSQL superuser. Create a restricted app-specific user instead:

```bash
# Connect as the superuser and run the setup script
psql -U postgres -d dealsphere -f db_create_app_user.sql
```

Or run manually:

```sql
-- Create restricted app user (replace the password!)
CREATE ROLE dealsphere_app WITH
    LOGIN
    PASSWORD 'your_strong_password_here'
    NOSUPERUSER NOCREATEDB NOCREATEROLE
    CONNECTION LIMIT 25;

GRANT CONNECT ON DATABASE dealsphere TO dealsphere_app;
GRANT USAGE, CREATE ON SCHEMA public TO dealsphere_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dealsphere_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dealsphere_app;

-- Auto-grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dealsphere_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO dealsphere_app;
```

Then update your `DATABASE_URL`:
```
postgresql://dealsphere_app:your_strong_password_here@hostname:5432/dealsphere
```

After the app has created its tables on first startup, you can optionally tighten permissions further:
```sql
REVOKE CREATE ON SCHEMA public FROM dealsphere_app;
```

The full setup script is available at `db_create_app_user.sql` in the project root.

### Automatic Table Creation

Tables are created automatically on first startup. The backend runs `init_database()` during its lifespan startup, which creates all required tables using SQLAlchemy models.

### Create First Admin User

After the database is initialized, create the first super admin user via the Python CLI:

```bash
# Inside the backend container
docker exec -it dealsphere-backend bash

cd /app/python_backend
python -c "
import asyncio
from database import get_db, init_database
from admin_auth import create_admin_user

async def setup():
    await init_database()
    async for db in get_db():
        admin = await create_admin_user(
            username='admin',
            email='admin@example.com',
            password='your_secure_password',
            db=db,
            role='super_admin',
            permissions=['manage_deals','approve_deals','manage_users','view_analytics','manage_affiliates','manage_automation','upload_deals']
        )
        print(f'Admin created: {admin.username}')

asyncio.run(setup())
"
```

### Database Connection String Format

```
postgresql://username:password@hostname:port/database_name
```

For SSL connections (e.g., Neon, Supabase):
```
postgresql://username:password@hostname:port/database_name?sslmode=require
```

The backend automatically handles `sslmode` conversion for asyncpg.

### Database Migrations

The app uses SQLAlchemy `create_all()` for initial setup. For schema changes in production:

1. URL health columns are auto-migrated on startup via `_migrate_url_health_columns()`.
2. For other changes, use Alembic:
   ```bash
   cd python_backend
   alembic upgrade head
   ```

---

## Manual Deployment (No Docker)

### Backend

```bash
# Install Python dependencies
pip install fastapi "uvicorn[standard]" sqlalchemy asyncpg psycopg2-binary \
    python-dotenv pydantic alembic bcrypt "python-jose[cryptography]" \
    python-multipart openai aiohttp requests schedule pandas openpyxl xlrd

# Set environment variables
export DATABASE_URL="postgresql://..."
export JWT_SECRET_KEY="..."
export OPENAI_API_KEY="sk-..."

# Run the server
cd python_backend
python -m uvicorn simple_server:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
# Install dependencies and build
npm install
npm run build

# The built files are in client/dist/
# Serve with any static file server, or let the backend serve them
```

---

## Production Checklist

### Security
- [ ] Set a strong, random `JWT_SECRET_KEY` (64+ chars)
- [ ] Set `ALLOWED_ORIGINS` to your specific domain (not `*`)
- [ ] Swagger/OpenAPI docs are disabled by default (keep disabled in production)
- [ ] Use HTTPS in production (handled by reverse proxy or load balancer)
- [ ] Store all secrets securely (not in code or Docker images)

### Performance
- [ ] Database connection pooling is configured (20 connections by default)
- [ ] Static assets have cache headers via nginx
- [ ] Gzip compression enabled for text-based assets

### Monitoring
- [ ] Health check endpoint: `GET /api/health`
- [ ] Docker health check configured in Dockerfile
- [ ] URL health checker runs every 2 hours automatically
- [ ] Data quality cleanup runs every 2 hours automatically

### Database
- [ ] Regular database backups configured
- [ ] SSL enabled for database connections in production
- [ ] Connection string uses `sslmode=require` for cloud databases

### Environment File Template

Create a `.env` file from this template:

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/dealsphere
JWT_SECRET_KEY=your-random-64-char-secret-key-here
OPENAI_API_KEY=sk-your-openai-api-key

# Optional - Server
PORT=8000
ALLOWED_ORIGINS=https://your-domain.com

# Optional - Amazon Associates
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AMAZON_ASSOCIATE_TAG=

# Optional - Commission Junction
CJ_DEVELOPER_KEY=
CJ_WEBSITE_ID=

# Optional - ClickBank
CLICKBANK_CLIENT_ID=
CLICKBANK_DEVELOPER_KEY=
CLICKBANK_NICKNAME=
```
