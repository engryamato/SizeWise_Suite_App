# Multi-stage build for Flask backend with optimized security and performance
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
  gcc \
  g++ \
  libpq-dev \
  libffi-dev \
  libssl-dev \
  curl \
  dumb-init \
  && apt-get upgrade -y \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /tmp/* \
  && rm -rf /var/tmp/*

# Create non-root user for security
RUN groupadd --system --gid 1001 sizewise && \
  useradd --system --uid 1001 --gid sizewise --create-home --shell /bin/bash sizewise

# Dependencies stage for development
FROM base AS dev-deps
WORKDIR /app

# Copy requirements and install development dependencies
COPY backend/requirements.txt requirements.txt
COPY requirements.txt root-requirements.txt

# Install Python dependencies with optimized flags
RUN pip install --upgrade pip setuptools wheel && \
  pip install -r requirements.txt && \
  pip install -r root-requirements.txt && \
  pip install pytest pytest-flask pytest-cov flake8 black mypy

# Development stage
FROM base AS development
WORKDIR /app

# Copy installed dependencies from dev-deps stage
COPY --from=dev-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dev-deps /usr/local/bin /usr/local/bin

# Copy application code
COPY backend/ ./backend/
COPY core/ ./core/
COPY run_backend.py .

# Create application directories
RUN mkdir -p /app/logs /app/data /app/temp && \
  chown -R sizewise:sizewise /app

USER sizewise

EXPOSE 5000

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["python", "-m", "flask", "--app", "backend.app", "run", "--host=0.0.0.0", "--port=5000", "--debug"]

# Production dependencies stage
FROM base AS prod-deps
WORKDIR /app

# Copy requirements and install production dependencies only
COPY backend/requirements.txt requirements.txt
COPY requirements.txt root-requirements.txt

# Install Python dependencies optimized for production
RUN pip install --upgrade pip setuptools wheel && \
  pip install -r requirements.txt && \
  pip install -r root-requirements.txt && \
  pip install gunicorn[gevent]

# Production stage
FROM base AS production
WORKDIR /app

# Copy installed dependencies from prod-deps stage
COPY --from=prod-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=prod-deps /usr/local/bin /usr/local/bin

# Copy application code
COPY backend/ ./backend/
COPY core/ ./core/
COPY run_backend.py .

# Create application directories with proper permissions
RUN mkdir -p /app/logs /app/data /app/temp && \
  chown -R sizewise:sizewise /app

USER sizewise

EXPOSE 5000

# Health check for production
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--worker-class", "gevent", "--worker-connections", "1000", "--timeout", "120", "--keepalive", "2", "--max-requests", "1000", "--max-requests-jitter", "100", "backend.app:create_app()"]

# Alias for backward compatibility
FROM development AS dev
