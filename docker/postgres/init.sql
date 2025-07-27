-- PostgreSQL initialization script for SizeWise Suite
-- This script sets up the databases and users for the containerized environment

-- Create databases for different environments
SELECT 'CREATE DATABASE sizewise_dev' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sizewise_dev')\gexec
SELECT 'CREATE DATABASE sizewise_auth_dev' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sizewise_auth_dev')\gexec
SELECT 'CREATE DATABASE sizewise_test' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sizewise_test')\gexec
SELECT 'CREATE DATABASE sizewise_auth_test' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sizewise_auth_test')\gexec
SELECT 'CREATE DATABASE sizewise_prod_test' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sizewise_prod_test')\gexec
SELECT 'CREATE DATABASE sizewise_auth_prod_test' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sizewise_auth_prod_test')\gexec

-- Create additional users if needed (optional)
-- The main user is created by the POSTGRES_USER environment variable

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE sizewise_dev TO sizewise;
GRANT ALL PRIVILEGES ON DATABASE sizewise_auth_dev TO sizewise;
GRANT ALL PRIVILEGES ON DATABASE sizewise_test TO sizewise;
GRANT ALL PRIVILEGES ON DATABASE sizewise_auth_test TO sizewise;
GRANT ALL PRIVILEGES ON DATABASE sizewise_prod_test TO sizewise_test;
GRANT ALL PRIVILEGES ON DATABASE sizewise_auth_prod_test TO sizewise_test;

-- Create extensions that might be needed
\c sizewise_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c sizewise_auth_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c sizewise_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c sizewise_auth_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c sizewise_prod_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c sizewise_auth_prod_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
