# Multi-stage build for Auth Server with optimized security and performance
FROM python:3.11-slim AS base

# Set environment variables for Python optimization
ENV PYTHONDONTWRITEBYTECODE=1 \
  PYTHONUNBUFFERED=1 \
  PYTHONHASHSEED=random \
  PIP_NO_CACHE_DIR=1 \
  PIP_DISABLE_PIP_VERSION_CHECK=1 \
  PIP_DEFAULT_TIMEOUT=100

# Install system dependencies and security updates
RUN apt-get update && apt-get install -y --no-install-recommends \
  curl \
  dumb-init \
  gcc \
  g++ \
  libffi-dev \
  libpq-dev \
  libssl-dev \
  && apt-get upgrade -y \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /tmp/* \
  && rm -rf /var/tmp/*

# Create non-root user for security
RUN groupadd --system --gid 1001 authuser && \
  useradd --system --uid 1001 --gid authuser --create-home --shell /bin/bash authuser

# Dependencies stage for development
FROM base AS dev-deps
WORKDIR /app

# Copy requirements and install development dependencies
COPY auth-server/requirements.txt .

# Install Python dependencies with optimized flags
RUN pip install --upgrade pip setuptools wheel && \
  pip install -r requirements.txt && \
  pip install pytest pytest-flask pytest-cov flake8 black mypy

# Development stage
FROM base AS development
WORKDIR /app

# Copy installed dependencies from dev-deps stage
COPY --from=dev-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dev-deps /usr/local/bin /usr/local/bin

# Copy application code
COPY auth-server/ .

# Create application directories with proper permissions
RUN mkdir -p /app/logs /app/data && \
  chown -R authuser:authuser /app

USER authuser

EXPOSE 5001

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["python", "app.py"]

# Production dependencies stage
FROM base AS prod-deps
WORKDIR /app

# Copy requirements and install production dependencies only
COPY auth-server/requirements.txt .

# Install Python dependencies optimized for production
RUN pip install --upgrade pip setuptools wheel && \
  pip install -r requirements.txt && \
  pip install gunicorn[gevent]

# Production stage
FROM base AS production
WORKDIR /app

# Copy installed dependencies from prod-deps stage
COPY --from=prod-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=prod-deps /usr/local/bin /usr/local/bin

# Copy application code
COPY auth-server/ .

# Create application directories with proper permissions
RUN mkdir -p /app/logs /app/data && \
  chown -R authuser:authuser /app

USER authuser

EXPOSE 5001

# Health check for production
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "python init_db.py && gunicorn --bind 0.0.0.0:5001 --workers 2 --worker-class gevent --timeout 120 --keepalive 2 app:app"]

# Alias for backward compatibility
FROM development AS dev
