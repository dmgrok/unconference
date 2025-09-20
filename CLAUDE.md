# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Basic Development
- `npm run dev` - Start development server with environment file (.env)
- `npm run build` - Build the application for production
- `npm run preview` - Preview production build locally
- `npm install` - Install dependencies

### Documentation Management
- `npm run docs:update` - Update all documentation (organize, README, changelog)
- `npm run docs:organize` - Organize docs folder structure and create category READMEs
- `npm run docs:readme` - Update main README with latest information
- `npm run docs:changelog` - Generate changelog entries from conventional commits
- `npm run docs:setup` - Set up git hooks for automated documentation updates

### Specialized Build Commands
- `npm run build:azure` - Build for Azure deployment
- `npm run build:docker` - Build Docker image
- `docker build -t unconference .` - Manual Docker build
- `npm run docker` - Run Docker container with volume mounts and environment

### Testing
- Tests are configured with Vitest (`@nuxt/test-utils`, `@vue/test-utils`)
- No test files currently exist in the project structure

## Documentation System

This project uses an automated documentation system that:

### 🔄 **Automated Updates**
- **Git Hooks Integration**: Pre-commit hooks automatically update documentation
- **Conventional Commits**: Changelog generation from conventional commit messages
- **README Sync**: Automatic README updates with latest project information
- **Organization**: Auto-organized docs folder with category-based structure

### 📚 **Documentation Structure**
- `docs/business/` - Business strategy, pricing, and market analysis
- `docs/deployment/` - Deployment guides and production setup
- `docs/testing/` - Testing procedures and validation results
- `docs/guides/` - User guides and setup documentation
- `docs/features/` - Feature specifications and architecture documents
- `docs/api/` - API documentation and examples
- `docs/security/` - Security configuration and monitoring documentation
- `docs/improvements/` - Development improvements and update logs
- `docs/reviews/` - Experience reviews and assessments
- `docs/archive/` - Historical documentation and implementation logs

### 🎯 **Key Features**
- **Changelog Automation**: Generates changelog entries from git commits using conventional commit format
- **README Generation**: Creates comprehensive README with badges, quick start, and documentation links
- **Cross-referencing**: Automatic linking between related documentation
- **Category READMEs**: Each documentation category has its own index and quick links

### 💻 **Commit Message Format**
Use conventional commits for automatic changelog generation:
- `feat: add new feature` - New features
- `fix: resolve issue` - Bug fixes  
- `docs: update documentation` - Documentation changes
- `style: formatting changes` - Code style changes
- `refactor: code refactoring` - Code restructuring
- `perf: performance improvements` - Performance optimizations
- `test: add tests` - Testing additions
- `build: build system changes` - Build/deploy changes
- `ci: CI/CD changes` - Continuous integration
- `chore: maintenance tasks` - General maintenance

## Architecture Overview

### Framework & Stack
- **Nuxt 3** application with Vue 3 and TypeScript
- **Vuetify** UI framework with Material Design Icons
- **Winston** logging system
- **Zod** schema validation
- **nuxt-auth-utils** for authentication (GitHub OAuth support)

### Core Data Models
- **DiscussionTopic** (`types/topic.ts`): Topics with voting system, badges, round selection, and round tracking
- **User** (`types/user.ts`): Users with Admin/User roles
- **RoundHistory** (`types/topic.ts`): Historical round data with selected topics and participants
- **ActiveRound** (`types/topic.ts`): Current round state with timer and topic selection
- **TopicSelection** (`types/topic.ts`): Topic selection interface for round management

### Application Structure
- **Pages**: Dashboard, settings, admin interfaces with automatic authentication middleware
- **Authentication**: Multi-provider OAuth integration (Google, GitHub) with role-based access (SuperAdmin/Admin/User)
- **Middleware**: Automatic authentication enforcement for non-public pages
- **Database**: Prisma ORM with SQLite/PostgreSQL support (file-based JSON storage deprecated)

### Environment Configuration
Critical environment variables:
- `NUXT_TOPICS_FILE_PATH` / `NUXT_USERS_FILE_PATH` - Data file locations
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth configuration
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth configuration
- `NUXT_MAX_VOTES_PER_TOPIC` - Voting limits (default: 12)
- `APP_ENV` - Controls dev mode and logging levels

### Key Features
- **Voting System**: Topics can accumulate votes and badges with preference-based weighted voting
- **Round Management**: Advanced round system with topic selection, timers, and participant redistribution
- **Round Selection**: Topics can be selected/frozen for discussion rounds with manual admin control
- **Timer System**: Configurable round timers with real-time countdown and auto-expiration
- **Participant Assignment**: Automatic assignment of users to topics based on voting preferences
- **Round History**: Complete tracking of past rounds with detailed analytics
- **Auto-save**: Visual feedback system for settings changes
- **Admin Functions**: Special pages and functionality for admin users including round management
- **Logging**: Winston-based logging with file output in production

### File Organization
- `server/api/` - API routes for topics, authentication, voting, and round management
- `server/api/admin/` - Admin-specific API routes including round management
- `components/` - Vue components (AppTitle, LoginForm, UnconferenceHeader)
- `composables/` - Vue composables (useAppTheme, useEventConfig, useAdminSettings)
- `pages/admin/` - Admin-only pages including round management interface
- `types/` - TypeScript type definitions including round management types
- `utils/` - Utility functions (logger)
- `data/` - JSON data files including round history and active round state
- `docs/` - Documentation including round management guide

### Docker Support
- Dockerfile configured for containerized deployment
- Volume mounting for data persistence
- Environment file support for configuration

## Project Structure & Navigation

### Documentation Organization
- `docs/business/` - Business strategy, pricing, and market analysis
- `docs/deployment/` - Deployment guides and production setup
- `docs/testing/` - Testing procedures and results
- `docs/guides/` - User guides, setup, and OAuth configuration
- `docs/features/` - Feature specifications and architecture
- `docs/api/` - API documentation and examples
- `docs/security/` - Security configuration and monitoring
- `docs/improvements/` - Development improvements and updates
- `docs/reviews/` - Experience reviews and assessments
- `docs/archive/` - Historical documentation and implementation logs

### API Endpoint Structure
- `/api/topics` - Topic CRUD operations and voting
- `/api/auth/` - Authentication handlers (Google, GitHub)
- `/api/admin/` - Admin-only functionality (round management, user administration)
- `/api/rounds/` - Round management and timer operations
- `/api/users/` - User profile and preference management

### Database Schema (Prisma)
- **Event** - Main event entity with settings and configuration
- **Topic** - Discussion topics with voting and round assignment
- **User** - User profiles with roles and OAuth integration
- **Vote** - Voting relationships between users and topics
- **Round** - Round management with timer and participant tracking
- **RoomAssignment** - Topic-to-room mapping for events

## Development Workflow

### Common Development Tasks
1. **Adding Features**: Follow feature specification in `docs/features/`
2. **API Changes**: Update both implementation and `docs/api-documentation.md`
3. **Database Changes**: Create Prisma migrations and update schema docs
4. **Security Updates**: Document changes in `docs/security/`
5. **Testing**: Update test cases in `docs/testing/` and implement automated tests

### Code Quality Guidelines
- Use TypeScript strict mode
- Follow Vue 3 Composition API patterns
- Implement proper error handling with Winston logging
- Use Zod for API validation
- Follow conventional commit format for changelog automation

### Troubleshooting Common Issues
- **OAuth Setup**: Check `docs/guides/oauth-setup.md` for provider configuration
- **Database Issues**: Verify Prisma connection and migration status
- **Environment**: Ensure all required environment variables are set
- **Build Errors**: Check Node.js version (18+) and npm dependencies

## Task Master Integration
Task Master commands are available through the `.claude/` directory structure. Use specialized agents and commands for complex development workflows.
