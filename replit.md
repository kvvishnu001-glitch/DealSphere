# Overview

DealSphere is an AI-powered deals and coupons platform that aggregates product deals from various stores and uses artificial intelligence to validate and categorize them. The platform features a public-facing deals browser and an admin dashboard for managing deal submissions, approvals, and analytics. Built as a full-stack application with React frontend and Express backend, it leverages OpenAI for deal validation and uses Replit's authentication system for admin access.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with conditional rendering based on authentication
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and data fetching
- **Authentication Flow**: Conditional routing that redirects unauthenticated users to a landing page and authenticated users to the main application

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Authentication**: Replit's OpenID Connect (OIDC) authentication system with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL using connect-pg-simple
- **API Structure**: RESTful endpoints organized by feature (deals, auth, admin) with middleware for logging and error handling
- **File Organization**: Modular structure with separate files for routes, services, storage, and database configuration

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