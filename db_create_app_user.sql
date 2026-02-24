-- ============================================================
-- DealSphere: Create App-Specific Database User
-- ============================================================
-- Run this script as a PostgreSQL superuser (e.g., postgres) to
-- create a restricted application user. Replace the password
-- with a strong, random value before running.
--
-- Usage:
--   psql -U postgres -d dealsphere -f db_create_app_user.sql
-- ============================================================

-- 1. Create the application role (no superuser, no createdb, no createrole)
CREATE ROLE dealsphere_app WITH
    LOGIN
    PASSWORD 'CHANGE_ME_TO_A_STRONG_PASSWORD'
    NOSUPERUSER
    NOCREATEDB
    NOCREATEROLE
    CONNECTION LIMIT 25;

-- 2. Grant connect to the database
GRANT CONNECT ON DATABASE dealsphere TO dealsphere_app;

-- 3. Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO dealsphere_app;

-- 4. Grant DML permissions on all existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dealsphere_app;

-- 5. Grant usage on all sequences (needed for SERIAL/auto-increment columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dealsphere_app;

-- 6. Set default privileges so future tables/sequences created by the
--    superuser are also accessible to the app user
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dealsphere_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO dealsphere_app;

-- 7. Allow the app to create tables (needed for initial setup / migrations)
--    Remove this line after first deployment if you want tighter control
GRANT CREATE ON SCHEMA public TO dealsphere_app;

-- ============================================================
-- After running this script, update your DATABASE_URL to:
--
--   postgresql://dealsphere_app:YOUR_PASSWORD@hostname:5432/dealsphere
--
-- To revoke CREATE permission after initial setup:
--   REVOKE CREATE ON SCHEMA public FROM dealsphere_app;
-- ============================================================
