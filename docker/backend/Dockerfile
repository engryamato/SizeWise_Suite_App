# Multi-stage build for Flask backend
FROM python:3.10-slim AS base

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
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY core/ ./core/
COPY run_backend.py .

# Create non-root user
RUN useradd --create-home --shell /bin/bash sizewise
RUN chown -R sizewise:sizewise /app
USER sizewise

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Development command with hot reloading
CMD ["python", "-m", "flask", "--app", "backend.app", "run", "--host=0.0.0.0", "--port=5000", "--debug"]

# Production stage
FROM base AS production
WORKDIR /app

# Copy requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install -r requirements.txt gunicorn

# Copy application code
COPY backend/ ./backend/
COPY core/ ./core/
COPY run_backend.py .

# Create non-root user
RUN useradd --create-home --shell /bin/bash sizewise
RUN chown -R sizewise:sizewise /app
USER sizewise

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Production command with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "backend.app:create_app()"]
