# Multi-stage build for Auth Server
FROM python:3.9-slim AS base

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Development stage
FROM base AS dev
WORKDIR /app

# Copy requirements and install dependencies
COPY auth-server/requirements.txt .
RUN pip install -r requirements.txt

# Copy application code
COPY auth-server/ .

# Create non-root user
RUN useradd --create-home --shell /bin/bash authuser
RUN chown -R authuser:authuser /app
USER authuser

EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

# Development command
CMD ["python", "app.py"]

# Production stage
FROM base AS prod
WORKDIR /app

# Copy requirements and install dependencies
COPY auth-server/requirements.txt .
RUN pip install -r requirements.txt

# Copy application code
COPY auth-server/ .

# Create non-root user
RUN useradd --create-home --shell /bin/bash authuser
RUN chown -R authuser:authuser /app
USER authuser

EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

# Production command with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--timeout", "120", "app:app"]
