# Overview

DealSphere is an AI-powered deals and coupons platform that aggregates product deals from various stores and uses artificial intelligence to validate and categorize them. The platform features a public-facing deals browser showing all deal types (top deals, hot deals, latest deals) without requiring authentication, and an admin dashboard for managing deal submissions, approvals, and analytics. **Completely converted to pure Python using ReactPy** - maintaining React-like component architecture while eliminating all Node.js dependencies for streamlined deployment.

## Recent Changes (2025-09-28)
- **COMPLETE CONVERSION TO PURE PYTHON**: Removed all Node.js code and dependencies
- **ReactPy Frontend**: Converted React components to ReactPy (React in Python) maintaining familiar syntax
- **Python-Only Deployment**: Updated Dockerfile and apprunner.yaml to use only Python runtime
- **Streamlined Architecture**: Single-language stack eliminates build complexity and deployment issues
- **Maintained React Paradigm**: All React features (hooks, state management, component structure) preserved in Python

## Previous Changes (2025-08-13)
- **Rich Social Media Sharing**: Complete Open Graph meta tags integration for Facebook, WhatsApp, Twitter with dynamic deal images and descriptions
- **Short URL System**: Generate shareable short URLs (e.g., /s/ABC123) that redirect to deal pages with full social media previews
- **AI Review Column in CSV**: Added `needs_ai_review` column to CSV uploads - false = auto-approved, true = requires AI screening
- **Enhanced Deal Click Tracking**: Fixed JSON parsing errors, now properly redirects users to affiliate URLs with click tracking
- **Social Media Preview Cards**: Deal pages now display rich previews with images, titles, descriptions, and pricing when shared
- **Complete US Affiliate Network Support**: Built comprehensive system supporting Amazon Associates, Commission Junction, ClickBank, ShareASale, Rakuten, Impact, Partnerize, AvantLink, AWIN, and more
- **Compliance Management System**: Full FTC compliance validation, network-specific terms enforcement, and automatic violation detection
- **Admin Affiliate Portal**: Complete UI for configuring all affiliate networks with API credentials, testing connections, and monitoring compliance
- **Multi-Protocol Support**: API-based (REST), FTP feeds, and CSV import capabilities for different affiliate network types
- **Terms & Conditions Enforcement**: Automatic validation against affiliate operating agreements with real-time compliance monitoring
- **Database-Driven Configuration**: All affiliate network settings, API credentials, and compliance rules stored securely in database
- **Automated Deal Fetching**: Integrated system fetching from all configured networks with AI validation and compliance checking
- **Real-Time Status Monitoring**: Live configuration health checks, connection testing, and automated compliance reporting
- **Production-Ready Compliance**: Built-in FTC disclosure requirements, network-specific attribution, and legal compliance features
- **File Upload System**: Comprehensive bulk deal upload system for networks without API access (CJ FTP exports, initial Amazon phases)
- **Sample File Templates**: Downloadable sample CSV files for Amazon, CJ, ShareASale with proper field formatting and examples
- **Smart Field Mapping**: Automatic field mapping and validation for different affiliate network export formats
- **Multi-Format Support**: CSV, Excel, XML, JSON, and text file processing with drag-and-drop upload interface

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: ReactPy (React components written in Python) - NO Node.js required!
- **Component Structure**: React-like syntax with hooks (use_state, use_effect) in pure Python
- **UI Framework**: Tailwind CSS for styling via CDN (no build process needed)
- **State Management**: ReactPy hooks for local state, direct API calls for server data
- **Build**: No build process required - ReactPy renders components server-side

## Backend Architecture
- **Framework**: FastAPI with Python 3.11 for high-performance async API
- **Frontend Rendering**: ReactPy integrated directly into FastAPI - single server process
- **Database**: PostgreSQL with SQLAlchemy async ORM and asyncpg driver
- **API Structure**: RESTful endpoints with automatic OpenAPI documentation
- **Performance**: Async/await throughout, ReactPy server-side rendering for optimal performance

## Database Design
- **ORM**: SQLAlchemy async ORM with PostgreSQL as the primary database
- **Connection**: Neon serverless PostgreSQL with connection pooling
- **Schema**: 
  - Users table for authentication (required by Replit Auth)
  - Deals table with comprehensive product information including AI scores and approval status
  - Analytics tables for tracking deal clicks and social shares
  - Sessions table for authentication session storage

## AI Integration
- **Service**: OpenAI GPT-4o for deal validation and categorization
- **Functionality**: Analyzes deal submissions to determine validity, assign categories, suggest deal types, and provide quality scores
- **Automation**: Auto-approves high-scoring deals (8.5+) while flagging lower-quality submissions for manual review

## External Dependencies

- **Database**: Neon serverless PostgreSQL for data persistence
- **Authentication**: Replit's OIDC authentication service for secure admin access
- **AI Services**: OpenAI API for deal validation and content enhancement
- **UI Styling**: Tailwind CSS via CDN for component styling
- **Development Tools**: ReactPy for React-like development in pure Python
- **Session Storage**: PostgreSQL-backed session storage for authentication persistence