# DealSphere API Documentation

DealSphere provides a RESTful API built with FastAPI (Python). All endpoints return JSON unless otherwise noted.

**Base URL:** `https://your-domain.com`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Public Endpoints](#public-endpoints)
   - [Health Check](#health-check)
   - [Deals](#deals---public)
   - [Categories & Stores](#categories--stores)
   - [Banners](#banners---public)
   - [SEO](#seo)
   - [Short URLs](#short-urls)
3. [Admin Endpoints](#admin-endpoints)
   - [Admin Auth](#admin-auth)
   - [User Management](#user-management)
   - [Audit Logs](#audit-logs)
   - [Dashboard Metrics](#dashboard-metrics)
   - [Deal Management](#deal-management---admin)
   - [Bulk Operations](#bulk-operations)
   - [JSON Import](#json-import)
   - [File Upload](#file-upload)
   - [URL Health](#url-health)
   - [Banner Management](#banner-management---admin)
   - [Affiliate Management](#affiliate-management)
   - [Automation](#automation)
   - [Sample Files](#sample-files)
4. [Enabling Swagger / OpenAPI Docs](#enabling-swagger--openapi-docs)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Data Models](#data-models)

---

## Authentication

Admin endpoints require a **Bearer token** obtained via the login endpoint.

**Header format:**
```
Authorization: Bearer <access_token>
```

Tokens are JWT-based, signed with `HS256`, and expire after **24 hours**.

### Permission System

| Permission | Description |
|---|---|
| `manage_deals` | Create, edit, delete deals |
| `approve_deals` | Approve or reject deals |
| `manage_users` | Create and manage admin users |
| `view_analytics` | View dashboard metrics |
| `manage_affiliates` | Configure affiliate networks |
| `manage_automation` | Control automation scheduler |
| `upload_deals` | Upload deal files (CSV/Excel) |

Users with the `super_admin` role bypass all permission checks.

---

## Public Endpoints

### Health Check

#### `GET /api/health`
Returns API health status. Not rate-limited.

**Response:**
```json
{
  "status": "healthy",
  "message": "DealSphere Python API is running"
}
```

---

### Deals - Public

#### `GET /api/deals`
Get deals with optional filtering. Returns only active, approved deals.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `deal_type` | string | null | Filter by type: `top`, `hot`, `latest` |
| `category` | string | null | Filter by category name |
| `store` | string | null | Filter by store name |
| `search` | string | null | Search across title, description, store, category |
| `limit` | int | 20 | Results per page (1-100) |
| `offset` | int | 0 | Number of results to skip |

**Response:** Array of Deal objects
```json
[
  {
    "id": "uuid-string",
    "title": "Product Name",
    "description": "Product description",
    "originalPrice": "29.99",
    "salePrice": "19.99",
    "discountPercentage": 33,
    "imageUrl": "https://...",
    "affiliateUrl": "https://...",
    "store": "Amazon",
    "category": "Electronics",
    "dealType": "hot",
    "rating": "4.5",
    "reviewCount": 120,
    "clickCount": 50,
    "shareCount": 10,
    "createdAt": "2025-01-15T10:30:00",
    "updatedAt": "2025-01-15T12:00:00"
  }
]
```

#### `GET /api/deals/search`
Search deals with pagination.

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `q` | string | Yes | Search query (min 1 char) |
| `category` | string | No | Filter by category |
| `store` | string | No | Filter by store |
| `limit` | int | No | Results per page (default 50, max 500) |
| `offset` | int | No | Offset for pagination |

**Response:**
```json
{
  "deals": [ /* Deal objects */ ],
  "total": 150,
  "query": "laptop"
}
```

#### `GET /api/deals/count`
Get count of active, approved deals.

**Response:**
```json
{ "count": 1234 }
```

#### `GET /api/deals/stats`
Get real-time hero section statistics.

**Response:**
```json
{
  "active_deals": 1234,
  "total_savings": "$45K+",
  "total_savings_raw": 45000.0,
  "ai_verified_pct": 95
}
```

#### `GET /api/deals/latest-count`
Get count of latest/regular deals with complete data.

**Response:**
```json
{ "count": 800 }
```

#### `GET /api/deals/{deal_id}`
Get a specific deal by ID.

**Response:** Single Deal object or `404` if not found.

#### `POST /api/deals/{deal_id}/click`
Track a deal click. Returns the affiliate URL for redirect.

**Response:**
```json
{ "affiliateUrl": "https://amazon.com/dp/..." }
```

#### `POST /api/deals/{deal_id}/share`
Create a short URL for social sharing.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `platform` | string | Platform name: `facebook`, `twitter`, `whatsapp`, `general` |

**Response:**
```json
{ "shortUrl": "https://your-domain.com/s/AbCd1234" }
```

---

### Categories & Stores

#### `GET /api/categories`
Get all available deal categories.

**Response:** Array of category name strings.

#### `GET /api/stores`
Get all available store names.

**Response:** Array of store name strings.

#### `GET /api/seo/categories`
Get categories with deal counts for SEO.

**Response:**
```json
[
  { "name": "Electronics", "slug": "electronics", "count": 150 },
  { "name": "Home & Garden", "slug": "home-garden", "count": 80 }
]
```

---

### Banners - Public

#### `GET /api/banners`
Get active banners for display.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `position` | string | Filter by position: `hero`, `sidebar`, `footer`, `inline` |

**Response:** Array of Banner objects (only currently active within date range).

#### `POST /api/banners/{banner_id}/impression`
Track a banner impression.

#### `POST /api/banners/{banner_id}/click`
Track a banner click.

---

### SEO

#### `GET /sitemap.xml`
Auto-generated XML sitemap with all deals, categories, and static pages.

#### `GET /robots.txt`
Search engine crawler directives. Blocks `/admin` and `/api/` paths.

---

### Short URLs

#### `GET /s/{short_code}`
Resolves a short URL. Serves the deal page HTML with Open Graph meta tags for social media crawlers, then redirects browsers via JavaScript to the full deal page.

---

## Admin Endpoints

All admin endpoints require `Authorization: Bearer <token>` header.

### Admin Auth

#### `POST /api/admin/login`
Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "admin": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@example.com",
    "role": "super_admin",
    "permissions": ["manage_deals", "approve_deals", ...],
    "is_active": true,
    "created_at": "2025-01-01T00:00:00"
  }
}
```

#### `GET /api/admin/me`
Get current authenticated admin info.

**Permission:** Any authenticated admin.

**Response:** AdminUser object.

#### `GET /api/admin/permissions`
Get list of all available permissions.

**Response:**
```json
{
  "permissions": [
    "manage_deals", "approve_deals", "manage_users",
    "view_analytics", "manage_affiliates", "manage_automation", "upload_deals"
  ]
}
```

---

### User Management

**Permission required:** `manage_users`

#### `GET /api/admin/users`
List all admin users.

**Response:** Array of AdminUser objects.

#### `POST /api/admin/users`
Create a new admin user.

**Request Body:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "secure_password",
  "role": "admin",
  "permissions": ["manage_deals", "approve_deals"]
}
```

**Roles:** `super_admin`, `admin`, `editor`, `viewer`

#### `PUT /api/admin/users/{user_id}`
Update an admin user.

**Request Body (all fields optional):**
```json
{
  "email": "new@example.com",
  "role": "editor",
  "permissions": ["manage_deals"],
  "is_active": true
}
```

#### `PATCH /api/admin/users/{user_id}/toggle-active`
Toggle user active/inactive status. Cannot disable your own account or super_admin (unless you are super_admin).

**Response:**
```json
{ "message": "User enabled", "is_active": true }
```

---

### Audit Logs

**Permission required:** `manage_users`

#### `GET /api/admin/audit-logs`
Get admin action audit trail.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `skip` | int | 0 | Offset |
| `limit` | int | 50 | Max results |
| `admin_id` | string | null | Filter by admin user |
| `action` | string | null | Filter by action type |

**Response:** Array of AuditLog objects with timestamps, IP addresses, and action details.

---

### Dashboard Metrics

**Permission required:** `view_analytics`

#### `GET /api/admin/metrics`
Get comprehensive dashboard statistics.

**Response:**
```json
{
  "total_deals": 5000,
  "ai_approved_deals": 4500,
  "pending_deals": 200,
  "total_clicks": 15000,
  "total_shares": 3000,
  "revenue_estimate": 750.0,
  "issues_count": 25,
  "top_categories": [
    { "category": "Electronics", "deals_count": 800, "clicks": 5000 }
  ],
  "top_stores": [
    { "store": "Amazon", "deals_count": 2000, "clicks": 8000 }
  ],
  "recent_activity": [
    { "id": "uuid", "title": "...", "store": "Amazon", "created_at": "...", "clicks": 50, "ai_approved": true }
  ]
}
```

---

### Deal Management - Admin

**Permission required:** `manage_deals` (or `approve_deals` for approve/reject)

#### `GET /api/admin/deals`
Get all deals with server-side pagination and filtering.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | int | 1 | Page number |
| `per_page` | int | 25 | Results per page (max 1000) |
| `search` | string | "" | Search by title, store, or category |
| `category` | string | "" | Filter by category |
| `deal_status` | string | "" | Filter: `approved`, `pending`, `rejected`, `needs_review` |

**Response:**
```json
{
  "deals": [ /* Deal objects */ ],
  "total": 5000,
  "page": 1,
  "per_page": 25,
  "total_pages": 200
}
```

#### `POST /api/admin/deals`
Create a new deal.

**Request Body:**
```json
{
  "title": "Amazing Product",
  "description": "Great deal on this product",
  "original_price": 49.99,
  "sale_price": 29.99,
  "image_url": "https://...",
  "affiliate_url": "https://...",
  "store": "Amazon",
  "category": "Electronics",
  "deal_type": "hot",
  "coupon_code": "SAVE20",
  "coupon_required": true
}
```

#### `PUT /api/admin/deals/{deal_id}`
Update an existing deal. Same body as create.

#### `DELETE /api/admin/deals/{deal_id}`
Soft-delete a deal (marks as deleted and inactive).

#### `PATCH /api/admin/deals/{deal_id}/approve`
Approve a deal. Makes it live on the website.

**Permission required:** `approve_deals`

#### `PATCH /api/admin/deals/{deal_id}/reject`
Reject a deal. Removes it from the website.

**Permission required:** `approve_deals`

#### `GET /api/admin/deals/search`
Search deals in admin context (includes all statuses).

**Query Parameters:** `q`, `category`, `store`, `deal_status`, `skip`, `limit`

#### `GET /api/admin/deals/categories`
Get list of all distinct categories.

#### `GET /api/admin/deals/stores`
Get list of all distinct stores.

---

### Bulk Operations

#### `POST /api/admin/deals/bulk`
Perform bulk actions on multiple deals.

**Request Body:**
```json
{
  "deal_ids": ["uuid1", "uuid2", "uuid3"],
  "action": "approve"
}
```

**Actions:** `approve`, `reject`, `delete`

**Response:**
```json
{ "message": "Successfully approved 3 deals", "affected": 3 }
```

---

### JSON Import

#### `POST /api/admin/deals/json-import`
Import deals via JSON array.

**Permission required:** `manage_deals`

**Request Body:**
```json
{
  "deals": [
    {
      "title": "Product Name",
      "original_price": 49.99,
      "sale_price": 29.99,
      "store": "Amazon",
      "category": "Electronics",
      "affiliate_url": "https://...",
      "image_url": "https://...",
      "description": "Optional description",
      "deal_type": "hot",
      "coupon_code": "SAVE10",
      "source_api": "manual",
      "rating": 4.5,
      "review_count": 100
    }
  ]
}
```

**Required fields per deal:** `title`, `original_price`, `sale_price`, `store`, `category`, `affiliate_url`

**Response:**
```json
{
  "created": 5,
  "errors": 1,
  "error_details": ["Deal 3: missing affiliate_url"]
}
```

---

### File Upload

**Permission required:** `upload_deals`

#### `POST /api/admin/upload-deals`
Upload deals via CSV file.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | file | Yes | CSV file with deal data |
| `network` | string | Yes | Affiliate network name |
| `description` | string | No | Upload description |

**CSV columns:** `title`, `description`, `original_price`, `sale_price`, `discount_percentage`, `image_url`, `affiliate_url`, `store`, `category`, `rating`, `deal_type`, `coupon_code`, `coupon_required`, `needs_ai_review`

- `needs_ai_review`: Set to `false` to auto-approve, `true` to require AI screening.

**Response:**
```json
{
  "success": true,
  "message": "Successfully uploaded 50 deals from deals.csv",
  "file_size": 15000,
  "network": "amazon",
  "processed_deals": 52,
  "valid_deals": 50
}
```

#### `GET /api/admin/upload-status`
Get file upload system status and supported formats.

---

### URL Health

**Permission required:** `manage_deals`

#### `GET /api/admin/url-health`
Get URL health check statistics and progress.

**Response:**
```json
{
  "total_deals": 5000,
  "healthy": 4800,
  "unhealthy": 50,
  "unchecked": 100,
  "flagged": 50,
  "check_progress": { "checked": 4900, "total": 5000, "percent": 98 }
}
```

#### `POST /api/admin/url-health/check`
Trigger a manual URL health check on all deals.

#### `POST /api/admin/url-health/cleanup`
Clean up stale flagged deals (broken URLs for 24+ hours).

#### `POST /api/admin/url-health/data-quality-cleanup`
Remove deals with missing required fields or invalid pricing.

#### `POST /api/admin/cleanup/rejected-deals`
Clean up rejected deals older than 24 hours.

---

### Banner Management - Admin

**Permission required:** `manage_deals`

#### `GET /api/admin/banners`
Get all banners (including inactive).

#### `POST /api/admin/banners`
Create a new banner.

**Request Body:**
```json
{
  "title": "Summer Sale Banner",
  "image_url": "https://...",
  "link_url": "https://...",
  "position": "hero",
  "sort_order": 1,
  "is_active": true,
  "start_date": "2025-06-01T00:00:00",
  "end_date": "2025-08-31T23:59:59"
}
```

**Positions:** `hero`, `sidebar`, `footer`, `inline`

#### `PUT /api/admin/banners/{banner_id}`
Update a banner. All fields optional.

#### `DELETE /api/admin/banners/{banner_id}`
Permanently delete a banner.

---

### Affiliate Management

**Permission required:** `manage_affiliates`

**Base path:** `/api/admin/affiliates`

#### `GET /api/admin/affiliates/networks`
Get all available affiliate networks with configuration status.

#### `GET /api/admin/affiliates/networks/{network_id}`
Get configuration for a specific network (sensitive fields masked).

**Network IDs:** `amazon`, `cj`, `clickbank`, `shareasale`, `rakuten`, `impact`, `partnerize`, `avantlink`, `awin`

#### `POST /api/admin/affiliates/networks/{network_id}/configure`
Configure or update a network.

**Request Body:** Key-value pairs specific to each network. Example for Amazon:
```json
{
  "aws_access_key_id": "AKIA...",
  "aws_secret_access_key": "...",
  "associate_tag": "mytag-20"
}
```

#### `POST /api/admin/affiliates/networks/{network_id}/test`
Test connection to a network.

**Response:**
```json
{
  "status": "success",
  "connection": "working",
  "deals_found": 25,
  "test_timestamp": "2025-01-15T10:30:00"
}
```

#### `POST /api/admin/affiliates/networks/{network_id}/toggle`
Enable or disable a network.

**Query Parameter:** `enable` (boolean)

#### `DELETE /api/admin/affiliates/networks/{network_id}`
Delete network configuration.

#### `GET /api/admin/affiliates/compliance/{network_id}`
Get compliance information and best practices.

#### `GET /api/admin/affiliates/compliance/logs`
Get compliance check history.

**Query Parameter:** `limit` (int, default 100)

#### `POST /api/admin/affiliates/bulk-configure`
Configure multiple networks at once.

**Request Body:**
```json
{
  "amazon": { "aws_access_key_id": "...", "aws_secret_access_key": "...", "associate_tag": "..." },
  "shareasale": { "affiliate_id": "...", "token": "...", "secret_key": "..." }
}
```

---

### Automation

**Permission required:** `manage_automation`

**Base path:** `/api/admin/automation`

#### `GET /api/admin/automation/status`
Get current automation scheduler status and API configuration health.

**Response:**
```json
{
  "is_running": true,
  "last_run": "2025-01-15T10:00:00",
  "next_run": "2025-01-15T12:00:00",
  "api_configurations": {
    "amazon_configured": true,
    "cj_configured": false,
    "clickbank_configured": false,
    "openai_configured": true
  }
}
```

#### `POST /api/admin/automation/fetch-deals`
Manually trigger deal fetching from all configured sources.

#### `POST /api/admin/automation/start-scheduler`
Start the automated deal fetching scheduler.

#### `POST /api/admin/automation/stop-scheduler`
Stop the automation scheduler.

#### `POST /api/admin/automation/cleanup-rejected`
Manually trigger cleanup of rejected deals.

#### `GET /api/admin/automation/configuration-help`
Get setup instructions for all supported affiliate APIs including sign-up URLs and required environment variables.

---

### Sample Files

**Base path:** `/api/admin/sample-files`

#### `GET /api/admin/sample-files/download/{network}`
Download a sample CSV template for a specific network.

**Networks:** `amazon`, `cj`, `shareasale`

#### `GET /api/admin/sample-files/formats`
Get information about all available sample file formats, fields, and upload tips.

---

## Enabling Swagger / OpenAPI Docs

By default, Swagger UI, ReDoc, and the OpenAPI schema are disabled in production for security.

To enable them for development, edit `python_backend/simple_server.py` and change the FastAPI initialization:

```python
# BEFORE (production - docs disabled):
app = FastAPI(
    title="DealSphere API",
    description="AI-powered deals and coupons platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None
)

# AFTER (development - docs enabled):
app = FastAPI(
    title="DealSphere API",
    description="AI-powered deals and coupons platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",           # Swagger UI at /docs
    redoc_url="/redoc",         # ReDoc at /redoc
    openapi_url="/openapi.json" # OpenAPI schema at /openapi.json
)
```

Also remove or comment out the route that blocks these paths:

```python
# Remove this block:
@app.get("/docs")
@app.get("/redoc")
@app.get("/openapi.json")
async def block_docs():
    raise HTTPException(status_code=404, detail="Not found")
```

After restarting the server:
- **Swagger UI:** `https://your-domain.com/docs`
- **ReDoc:** `https://your-domain.com/redoc`
- **OpenAPI JSON:** `https://your-domain.com/openapi.json`

---

## Error Handling

All errors return JSON with an appropriate HTTP status code:

```json
{
  "detail": "Error message describing what went wrong"
}
```

| Status Code | Meaning |
|---|---|
| 400 | Bad Request - Invalid input or missing fields |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource does not exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| `POST /api/admin/login` | 5 requests | 5 minutes |
| All other `/api/*` endpoints | 100 requests | 1 minute |
| `GET /api/health` | No limit | - |

Rate limiting is per client IP. When exceeded, a `429` response is returned.

---

## Data Models

### Deal Object

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Unique identifier |
| `title` | string | Product title |
| `description` | string | Product description |
| `original_price` | decimal | Original price |
| `sale_price` | decimal | Sale/discounted price |
| `discount_percentage` | int | Calculated discount % |
| `image_url` | string | Product image URL |
| `affiliate_url` | string | Affiliate link |
| `store` | string | Store name |
| `store_logo_url` | string | Store logo URL |
| `category` | string | Deal category |
| `deal_type` | string | `top`, `hot`, `latest`, `regular` |
| `rating` | decimal | Product rating |
| `review_count` | int | Number of reviews |
| `coupon_code` | string | Coupon code if applicable |
| `coupon_required` | boolean | Whether coupon is needed |
| `status` | string | `pending`, `approved`, `rejected`, `deleted` |
| `is_active` | boolean | Whether deal is live |
| `is_ai_approved` | boolean | AI validation status |
| `ai_score` | decimal | AI quality score (0-10) |
| `ai_reasons` | string | AI validation reasoning |
| `click_count` | int | Total clicks |
| `share_count` | int | Total social shares |
| `popularity` | int | Popularity score |
| `source_api` | string | Source affiliate network |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |

### AdminUser Object

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Unique identifier |
| `username` | string | Login username |
| `email` | string | Email address |
| `role` | string | `super_admin`, `admin`, `editor`, `viewer` |
| `permissions` | string[] | List of granted permissions |
| `is_active` | boolean | Account active status |
| `created_at` | datetime | Creation timestamp |

### Banner Object

| Field | Type | Description |
|---|---|---|
| `id` | string (UUID) | Unique identifier |
| `title` | string | Banner title |
| `image_url` | string | Banner image URL |
| `link_url` | string | Click destination URL |
| `position` | string | `hero`, `sidebar`, `footer`, `inline` |
| `sort_order` | int | Display order |
| `is_active` | boolean | Active status |
| `start_date` | datetime | Start showing date |
| `end_date` | datetime | Stop showing date |
| `impression_count` | int | Total impressions |
| `click_count` | int | Total clicks |
