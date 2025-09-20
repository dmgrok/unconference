# Local Development Setup Guide

This guide helps you set up the unconference app for local development with proper database configuration.

## Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd unconference
npm install
```

### 2. Database Setup (Choose Option A or B)

#### Option A: PostgreSQL (Recommended)
1. Install PostgreSQL locally
2. Create development database:
   ```bash
   createdb unconference_dev
   ```
3. Copy environment template:
   ```bash
   cp environment.template .env
   ```
4. Edit `.env` with your PostgreSQL credentials:
   ```bash
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/unconference_dev"
   ```

#### Option B: SQLite (Quick Setup)
1. Copy environment template:
   ```bash
   cp environment.template .env
   ```
2. Edit `.env` to use SQLite:
   ```bash
   DATABASE_URL="file:./dev.db"
   ```

### 3. Start Development
```bash
npm run dev
```

This automatically:
- Generates Prisma client
- Runs database migrations
- Seeds test data
- Starts the development server

### 4. Access the App
- **Web App**: http://localhost:3000
- **Database GUI**: `npm run db:studio` (opens Prisma Studio)

## Development Commands

### Database Management
- `npm run db:studio` - Open database GUI
- `npm run db:seed` - Add test users
- `npm run db:reset` - Reset database (⚠️ destructive)
- `npm run db:migrate` - Apply schema changes

### Development Server
- `npm run dev` - Development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

### Required for Local Development
```bash
# Database connection (choose one)
DATABASE_URL="postgresql://user:pass@localhost:5432/db_name"
# OR
DATABASE_URL="file:./dev.db"

# OAuth (optional for local testing)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Test Accounts (Pre-seeded)
After running `npm run db:seed`:
- **Super Admin**: superadmin@unconference.com / SuperAdmin123
- **Admin**: darth.vader@starwars.com / AdminPassword123
- **User**: storm.trooper@starwars.com / UserPassword123

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db execute --command "SELECT 1"

# Regenerate client
npm run db:generate

# Reset everything
npm run db:reset
```

### Development Server Issues
```bash
# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Clear Nuxt cache
rm -rf .nuxt .output
npm run dev
```

## Production Deployment

Local development connects to local database. Production deployments use:
- **Staging**: GitHub Actions with `STAGING_DATABASE_URL` secret
- **Production**: GitHub Actions with `PRODUCTION_DATABASE_URL` secret

Never connect your local environment to production databases.
