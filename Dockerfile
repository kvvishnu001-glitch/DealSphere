# Pure Python Dockerfile - No Node.js needed!
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY python_backend/ ./python_backend/
COPY pyproject.toml ./
RUN pip install -U pip
RUN pip install fastapi uvicorn[standard] sqlalchemy asyncpg psycopg2-binary python-dotenv pydantic alembic aiohttp bcrypt requests schedule openpyxl pandas xlrd python-jose python-multipart openai

# Change to python_backend directory
WORKDIR /app/python_backend

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Run the FastAPI application
CMD ["python", "-m", "uvicorn", "simple_server:app", "--host", "0.0.0.0", "--port", "8000"]