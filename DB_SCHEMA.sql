-- DealSphere PostgreSQL Database Schema Export
-- Generated: 2026-02-24

-- ============================================================
-- TABLE: users (Replit Auth)
-- ============================================================
CREATE TABLE users (
    id              VARCHAR     PRIMARY KEY,
    email           VARCHAR     UNIQUE,
    first_name      VARCHAR,
    last_name       VARCHAR,
    profile_image_url VARCHAR,
    created_at      TIMESTAMP   DEFAULT now(),
    updated_at      TIMESTAMP   DEFAULT now()
);

-- ============================================================
-- TABLE: admin_users
-- ============================================================
CREATE TABLE admin_users (
    id              VARCHAR     PRIMARY KEY,
    username        VARCHAR     NOT NULL,
    email           VARCHAR     NOT NULL,
    password_hash   VARCHAR     NOT NULL,
    is_active       BOOLEAN     DEFAULT TRUE,
    created_at      TIMESTAMP   DEFAULT now(),
    updated_at      TIMESTAMP   DEFAULT now(),
    role            VARCHAR     DEFAULT 'admin',
    permissions     JSON        DEFAULT '[]',
    created_by      VARCHAR
);

CREATE UNIQUE INDEX ix_admin_users_username ON admin_users (username);
CREATE UNIQUE INDEX ix_admin_users_email ON admin_users (email);

-- ============================================================
-- TABLE: deals
-- ============================================================
CREATE TABLE deals (
    id                  VARCHAR     PRIMARY KEY,
    title               TEXT        NOT NULL,
    description         TEXT,
    original_price      NUMERIC     NOT NULL,
    sale_price          NUMERIC     NOT NULL,
    discount_percentage INTEGER     NOT NULL,
    image_url           TEXT,
    affiliate_url       TEXT        NOT NULL,
    store               VARCHAR     NOT NULL,
    store_logo_url      TEXT,
    category            VARCHAR     NOT NULL,
    rating              NUMERIC,
    review_count        INTEGER,
    expires_at          TIMESTAMP,
    is_active           BOOLEAN     DEFAULT TRUE,
    is_ai_approved      BOOLEAN,
    status              VARCHAR     DEFAULT 'pending',
    ai_score            NUMERIC,
    ai_reasons          JSON,
    popularity          INTEGER     DEFAULT 0,
    click_count         INTEGER     DEFAULT 0,
    share_count         INTEGER     DEFAULT 0,
    deal_type           VARCHAR     NOT NULL,
    source_api          VARCHAR,
    rejected_at         TIMESTAMP,
    deleted_at          TIMESTAMP,
    created_at          TIMESTAMP   DEFAULT now(),
    updated_at          TIMESTAMP   DEFAULT now(),
    coupon_code         VARCHAR,
    coupon_required     BOOLEAN     DEFAULT FALSE,
    url_last_checked    TIMESTAMP,
    url_check_failures  INTEGER     DEFAULT 0,
    url_status          VARCHAR     DEFAULT 'unchecked',
    url_flagged_at      TIMESTAMP
);

-- ============================================================
-- TABLE: deal_clicks
-- ============================================================
CREATE TABLE deal_clicks (
    id          VARCHAR     PRIMARY KEY,
    deal_id     VARCHAR     NOT NULL REFERENCES deals(id),
    ip_address  VARCHAR,
    user_agent  TEXT,
    referrer    TEXT,
    clicked_at  TIMESTAMP   DEFAULT now()
);

-- ============================================================
-- TABLE: social_shares
-- ============================================================
CREATE TABLE social_shares (
    id          VARCHAR     PRIMARY KEY,
    deal_id     VARCHAR     NOT NULL REFERENCES deals(id),
    platform    VARCHAR     NOT NULL,
    ip_address  VARCHAR,
    short_url   VARCHAR,
    shared_at   TIMESTAMP   DEFAULT now()
);

-- ============================================================
-- TABLE: short_urls
-- ============================================================
CREATE TABLE short_urls (
    id              VARCHAR     PRIMARY KEY,
    short_code      VARCHAR     NOT NULL,
    original_url    TEXT        NOT NULL,
    deal_id         VARCHAR     REFERENCES deals(id),
    click_count     INTEGER     DEFAULT 0,
    created_at      TIMESTAMP   DEFAULT now()
);

CREATE UNIQUE INDEX ix_short_urls_short_code ON short_urls (short_code);

-- ============================================================
-- TABLE: banners
-- ============================================================
CREATE TABLE banners (
    id                  VARCHAR     PRIMARY KEY,
    name                VARCHAR     NOT NULL,
    position            VARCHAR     NOT NULL,
    banner_type         VARCHAR     NOT NULL,
    image_url           TEXT,
    link_url            TEXT,
    html_code           TEXT,
    alt_text            VARCHAR,
    sort_order          INTEGER     DEFAULT 0,
    is_active           BOOLEAN     DEFAULT TRUE,
    start_date          TIMESTAMP,
    end_date            TIMESTAMP,
    click_count         INTEGER     DEFAULT 0,
    impression_count    INTEGER     DEFAULT 0,
    created_at          TIMESTAMP   DEFAULT now(),
    updated_at          TIMESTAMP   DEFAULT now()
);

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
    id              VARCHAR     PRIMARY KEY,
    admin_id        VARCHAR     NOT NULL REFERENCES admin_users(id),
    admin_username  VARCHAR     NOT NULL,
    action          VARCHAR     NOT NULL,
    resource_type   VARCHAR     NOT NULL,
    resource_id     VARCHAR,
    details         JSON,
    ip_address      VARCHAR,
    created_at      TIMESTAMP   DEFAULT now()
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs (admin_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);

-- ============================================================
-- TABLE: affiliate_networks
-- ============================================================
CREATE TABLE affiliate_networks (
    id              SERIAL      PRIMARY KEY,
    network_id      VARCHAR(50) UNIQUE,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    api_type        VARCHAR(50),
    base_url        VARCHAR(500),
    compliance_terms JSON,
    is_active       BOOLEAN     DEFAULT TRUE,
    created_at      TIMESTAMP   DEFAULT now(),
    updated_at      TIMESTAMP   DEFAULT now()
);

CREATE UNIQUE INDEX ix_affiliate_networks_network_id ON affiliate_networks (network_id);

-- ============================================================
-- TABLE: affiliate_configs
-- ============================================================
CREATE TABLE affiliate_configs (
    id              SERIAL      PRIMARY KEY,
    network_id      VARCHAR(50) UNIQUE,
    network_name    VARCHAR(200) NOT NULL,
    config_data     JSON,
    compliance_terms JSON,
    is_active       BOOLEAN     DEFAULT TRUE,
    last_sync       TIMESTAMP,
    created_at      TIMESTAMP   DEFAULT now(),
    updated_at      TIMESTAMP   DEFAULT now()
);

CREATE UNIQUE INDEX ix_affiliate_configs_network_id ON affiliate_configs (network_id);

-- ============================================================
-- TABLE: compliance_logs
-- ============================================================
CREATE TABLE compliance_logs (
    id              SERIAL      PRIMARY KEY,
    deal_id         VARCHAR(36) REFERENCES deals(id),
    network_id      VARCHAR(50),
    compliance_check JSON,
    is_compliant    BOOLEAN,
    issues_found    JSON,
    created_at      TIMESTAMP   DEFAULT now()
);

-- ============================================================
-- TABLE: task_logs
-- ============================================================
CREATE TABLE task_logs (
    id              SERIAL      PRIMARY KEY,
    task_name       VARCHAR(100) NOT NULL,
    result_data     TEXT,
    executed_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: sessions (Express session store)
-- ============================================================
CREATE TABLE sessions (
    sid     VARCHAR     PRIMARY KEY,
    sess    JSON        NOT NULL,
    expire  TIMESTAMP   NOT NULL
);

-- ============================================================
-- FOREIGN KEY SUMMARY
-- ============================================================
-- audit_logs.admin_id        -> admin_users.id
-- compliance_logs.deal_id    -> deals.id
-- deal_clicks.deal_id        -> deals.id
-- short_urls.deal_id         -> deals.id
-- social_shares.deal_id      -> deals.id
