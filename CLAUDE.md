# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Basic Development
- `npm run dev` - Start development server with environment file (.env)
- `npm run build` - Build the application for production
- `npm run preview` - Preview production build locally
- `npm install` - Install dependencies

### Specialized Build Commands
- `npm run build:azure` - Build for Azure deployment
- `npm run build:docker` - Build Docker image
- `docker build -t unconference .` - Manual Docker build
- `npm run docker` - Run Docker container with volume mounts and environment

### Testing
- Tests are configured with Vitest (`@nuxt/test-utils`, `@vue/test-utils`)
- No test files currently exist in the project structure

## Architecture Overview

### Framework & Stack
- **Nuxt 3** application with Vue 3 and TypeScript
- **Vuetify** UI framework with Material Design Icons
- **Winston** logging system
- **Zod** schema validation
- **nuxt-auth-utils** for authentication (GitHub OAuth support)

### Core Data Models
- **DiscussionTopic** (`types/topic.ts`): Topics with voting system, badges, and round selection
- **User** (`types/user.ts`): Users with Admin/User roles

### Application Structure
- **Pages**: Dashboard, leaderboard, settings with automatic authentication middleware
- **Authentication**: GitHub OAuth integration with role-based access (Admin vs User)
- **Middleware**: Automatic authentication enforcement for non-public pages
- **File-based data storage**: JSON files for topics and users (configurable via env vars)

### Environment Configuration
Critical environment variables:
- `NUXT_TOPICS_FILE_PATH` / `NUXT_USERS_FILE_PATH` - Data file locations
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - OAuth configuration
- `NUXT_MAX_VOTES_PER_TOPIC` - Voting limits (default: 12)
- `NUXT_TOP_TOPICS_COUNT` - Leaderboard size (default: 10)
- `APP_ENV` - Controls dev mode and logging levels

### Key Features
- **Voting System**: Topics can accumulate votes and badges
- **Round Selection**: Topics can be selected/frozen for discussion rounds
- **Auto-save**: Visual feedback system for settings changes
- **Admin Functions**: Special pages and functionality for admin users
- **Logging**: Winston-based logging with file output in production

### File Organization
- `server/api/` - API routes for topics, authentication, voting
- `components/` - Vue components (AppTitle, LoginForm, UnconferenceHeader)
- `composables/` - Vue composables (useAppTheme, useEventConfig)
- `types/` - TypeScript type definitions
- `utils/` - Utility functions (logger)
- `data/` - Sample JSON data files

### Docker Support
- Dockerfile configured for containerized deployment
- Volume mounting for data persistence
- Environment file support for configuration