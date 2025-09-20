---
description: Database setup and deployment pipeline guidance for local development and production environments.
applyTo: "**/*"
---

# Database Development & Deployment Guidelines

This document provides guidance for working with the Prisma database in local development and understanding the deployment pipeline.

## Local Development Database Setup

### 🔧 **Environment Configuration**

**Priority Order for Database Connection**:
1. `DATABASE_URL` (primary) 
2. `POSTGRES_URL` (PostgreSQL fallback)
3. `PRISMA_DATABASE_URL` (Prisma Accelerate)

**Recommended Local Setup**:
```bash
# Create .env file in project root
DATABASE_URL="postgresql://username:password@localhost:5432/unconference_dev"

# Alternative: SQLite for quick development
# DATABASE_URL="file:./dev.db"
```

### 🚀 **Development Commands**

**Essential Database Commands**:
- `npm run dev` - **Starts dev server** (auto-runs `db:setup`)
- `npm run db:setup` - **Full setup** (generate + migrate)
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Push schema to database
- `npm run db:seed` - Add test users
- `npm run db:studio` - **Open Prisma Studio GUI**
- `npm run db:reset` - Reset database ⚠️ **DESTRUCTIVE**

**Development Workflow**:
1. Install PostgreSQL locally OR use SQLite
2. Create `.env` with `DATABASE_URL`
3. Run `npm run dev` (automatically sets up database)
4. Use `npm run db:studio` to view/edit data

### 📊 **Database Client Architecture**

**Connection Logic** (`lib/prisma.ts`):
```typescript
// Prisma client with fallback URL hierarchy
datasources: {
  db: {
    url: process.env.DATABASE_URL || 
         process.env.POSTGRES_URL || 
         process.env.PRISMA_DATABASE_URL
  }
}
```

**Local Development Features**:
- Connection pooling with HMR reload protection
- Development logging enabled (`error`, `warn`)
- Global instance reuse to prevent connection leaks

## GitHub Actions Deployment Pipeline

### 🏗️ **Pipeline Structure**

**Workflow Triggers**:
- Push to `main` branch (Prisma schema changes)
- Pull requests (validation only)
- Manual dispatch (staging/production choice)

**Pipeline Stages**:
1. **Schema Validation** (`validate-schema`)
   - Validates Prisma schema syntax
   - Checks for schema drift
   - Runs on every PR/push

2. **Staging Deployment** (`deploy-staging`)
   - Uses `STAGING_DATABASE_URL` secret
   - Runs migrations with `prisma migrate deploy`
   - Seeds test data (configurable)
   - Verifies connection health

3. **Production Deployment** (`deploy-production`)
   - Uses `PRODUCTION_DATABASE_URL` secret
   - Manual approval required
   - Full backup verification
   - Seeds production data (optional)

### 🔒 **GitHub Secrets Configuration**

**Required Secrets**:
- `STAGING_DATABASE_URL` - Staging PostgreSQL connection
- `PRODUCTION_DATABASE_URL` - Production PostgreSQL connection
- `DATABASE_URL` - Schema validation fallback

**Secret Format**:
```
postgresql://username:password@host:5432/database_name
```

### ⚙️ **Deployment Features**

**Manual Workflow Options**:
- **Environment Selection**: Choose staging/production
- **Seed Data Toggle**: Enable/disable test users
- **Force Reset**: ⚠️ Destructive database reset

**Automated Safety Checks**:
- Schema drift detection
- Connection verification
- Migration rollback on failure
- Database statistics reporting

## Development Best Practices

### 🛡️ **Safety Guidelines**

**Local Development**:
- Always use separate local database
- Never connect to production database directly
- Use `npm run db:studio` for data inspection
- Run migrations locally before committing

**Schema Changes**:
- Test migrations on local database first
- Use descriptive migration names
- Consider backward compatibility
- Document breaking changes

**Production Safety**:
- Database migrations are irreversible
- Production deploys require manual approval
- Staging environment mirrors production setup
- Force reset only available via manual trigger

### 🔄 **Workflow Integration**

**Before Making Schema Changes**:
1. Create feature branch
2. Modify `prisma/schema.prisma`
3. Run `npm run db:migrate` locally
4. Test changes with `npm run db:studio`
5. Commit and push (triggers validation)

**Deployment Process**:
1. PR validation runs schema checks
2. Merge to `main` triggers staging deployment
3. Manual approval required for production
4. Monitor deployment logs and database health

### 🚨 **Troubleshooting**

**Common Issues**:
- **Connection Failures**: Check `DATABASE_URL` format and credentials
- **Migration Errors**: Verify schema syntax and foreign key constraints
- **Client Generation**: Run `npm run db:generate` after schema changes
- **HMR Issues**: Restart dev server if database connection hangs

**Debug Commands**:
```bash
# Test database connection
npx prisma db execute --command "SELECT 1"

# Check schema status
npx prisma validate

# View applied migrations
npx prisma migrate status
```

## Environment-Specific Configuration

### 🏠 **Local Development**
- Uses `.env` file in project root
- SQLite: `DATABASE_URL="file:./dev.db"`
- PostgreSQL: `DATABASE_URL="postgresql://localhost:5432/unconference_dev"`
- Automatic database setup with `npm run dev`

### 🧪 **Staging Environment**
- GitHub secret: `STAGING_DATABASE_URL`
- Automated deployment on main branch
- Test data seeding enabled by default
- Schema drift monitoring active

### 🏢 **Production Environment**  
- GitHub secret: `PRODUCTION_DATABASE_URL`
- Manual approval required
- Production data seeding (configurable)
- Full backup and recovery procedures
- Health monitoring and alerting

Follow these guidelines to ensure consistent database development practices and smooth deployment pipelines.
