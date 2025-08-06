# Overview

DealSphere is an AI-powered deals and coupons platform that aggregates product deals from various stores and uses artificial intelligence to validate and categorize them. The platform now features a public-facing deals browser that shows all deal types (top deals, hot deals, latest deals) without requiring authentication, and an admin dashboard for managing deal submissions, approvals, and analytics. Built as a full-stack application with React frontend and Express backend, it leverages OpenAI for deal validation. A Python backend implementation has also been developed as an alternative.

## Recent Changes (2025-08-06)
- **Complete TypeScript Removal**: Deleted all TypeScript server code, shared schemas, and auth dependencies
- **Pure Python Backend**: FastAPI application with async SQLAlchemy and PostgreSQL
- **AWS Production Ready**: Complete deployment guide with ECS, RDS, ALB configuration
- **Simplified Architecture**: React frontend serves static files through Python backend
- **Docker Optimized**: Multi-stage build with production-ready container configuration
- **Documentation**: Comprehensive README.md and AWS-DEPLOYMENT-GUIDE.md with step-by-step instructions
- **Health Checks**: Built-in endpoints for AWS load balancer health monitoring
- **Cost Optimized**: Detailed cost breakdown and optimization strategies for AWS deployment
- **Admin Portal Complete**: Fixed React component rendering issues and built full admin dashboard
- **Authentication Working**: JWT-based admin login with bcrypt password encryption functional
- **Admin Features**: Dashboard with real metrics, deals management with approve/reject functionality

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with public access for deals browsing
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and data fetching
- **Build**: Optimized production build served statically by Python backend

## Backend Architecture
- **Framework**: FastAPI with Python 3.11 for high-performance async API
- **Database**: PostgreSQL with SQLAlchemy async ORM and asyncpg driver
- **API Structure**: RESTful endpoints with automatic OpenAPI documentation
- **Static Files**: Serves built React frontend and handles all routing
- **Performance**: Async/await throughout for optimal concurrent request handling

## Database Design
- **ORM**: Drizzle ORM with PostgreSQL as the primary database
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
- **UI Components**: Radix UI for accessible, unstyled components with Shadcn/ui styling
- **Development Tools**: Vite for fast development builds and hot module replacement
- **Session Storage**: PostgreSQL-backed session storage for authentication persistence