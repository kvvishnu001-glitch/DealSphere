# Overview

DealSphere is an AI-powered deals and coupons platform that aggregates product deals from various stores and uses artificial intelligence to validate and categorize them. The platform now features a public-facing deals browser that shows all deal types (top deals, hot deals, latest deals) without requiring authentication, and an admin dashboard for managing deal submissions, approvals, and analytics. Built as a full-stack application with React frontend and Express backend, it leverages OpenAI for deal validation. A Python backend implementation has also been developed as an alternative.

## Recent Changes (2025-08-06)
- **Backend Migration**: Completely switched from TypeScript/Node.js to Python FastAPI backend
- **AWS Deployment Ready**: Created Docker configuration, ECS task definitions, and deployment guides
- **Public Access**: Removed authentication requirement for viewing deals - anyone can now browse all deals
- **Deal Types Display**: Homepage now shows all three deal categories (Top Deals, Hot Deals, Latest Deals) simultaneously  
- **Admin Dashboard**: Admin features are accessible only at `/admin` route, not visible to general public
- **Sample Data**: Added comprehensive sample deals across all categories with realistic pricing and product information
- **Code Cleanup**: Removed unnecessary TypeScript authentication code (useAuth.ts, authUtils.ts)
- **Social Sharing**: Added social share buttons to all deal card variants (compact, list, and full)
- **Production Ready**: Created Dockerfile, docker-compose.yml, and AWS deployment documentation

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