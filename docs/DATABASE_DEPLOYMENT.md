# Database Deployment Guide

This guide explains how to set up and use the automated database deployment system for the Unconference app.

## 🚀 Quick Start

### 1. One-Time Setup

Run the setup script to configure GitHub secrets and environments:

```bash
./scripts/setup-database-deployment.sh
```

This script will:
- Set up GitHub repository secrets for database connections
- Create staging and production environments
- Configure necessary permissions

### 2. Required Secrets

You'll need to add these secrets to your GitHub repository:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `STAGING_DATABASE_URL` | Staging database connection | `postgres://user:pass@host:5432/staging_db?sslmode=require` |
| `PRODUCTION_DATABASE_URL` | Production database connection | `postgres://user:pass@host:5432/prod_db?sslmode=require` |

**For Prisma Cloud databases:**
```bash
# Direct PostgreSQL connection (recommended)
postgres://username:password@db.prisma.io:5432/postgres?sslmode=require

# Or with Prisma Accelerate (if not blocked by firewall)
prisma+postgres://accelerate.prisma-data.net/?api_key=your-api-key
```

## 🎯 Available Workflows

### 1. Quick Database Deploy (`quick-database-deploy.yml`)

**Manual trigger only** - Simple workflow for quick deployments.

**To use:**
1. Go to GitHub → Actions → "Quick Database Deploy"
2. Click "Run workflow"
3. Choose environment (staging/production)
4. Choose whether to seed test users
5. Click "Run workflow"

**Features:**
- Deploy database migrations
- Optionally seed test users
- Simple success/failure reporting

### 2. Full Database Deploy (`deploy-database.yml`)

**Automatic and manual triggers** - Comprehensive workflow with validations.

**Triggers automatically on:**
- Pushes to main branch (when Prisma files change)
- Pull requests (validation only)

**Manual trigger options:**
- Environment selection
- Force database reset (destructive)
- Seed data toggle

**Features:**
- Schema validation
- Migration deployment
- Database connection verification
- Test user seeding
- Detailed reporting
- Backup creation (production)

## 👥 Test Users Created

When seeding is enabled, these test users are created:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Super Admin | `superadmin@unconference.com` | `SuperAdmin123` | Full system access |
| Organizer | `organizer@example.com` | `organizerPassword` | Event management |
| Admin | `darth.vader@starwars.com` | `AdminPassword123` | Administrative functions |
| Regular User | `storm.trooper@starwars.com` | `UserPassword123` | Basic user access |

## 🛠️ Manual Database Operations

### Run Migrations Locally
```bash
# Set your database URL
export DATABASE_URL="your-database-connection-string"

# Deploy migrations
npx prisma migrate deploy

# Seed test users
npm run db:seed
```

### Check Database Status
```bash
# View pending migrations
npx prisma migrate status

# Check database connection
npx prisma db execute --command "SELECT 1"

# View current schema
npx prisma db pull --print
```

### Reset Database (Destructive)
```bash
# ⚠️ This will delete all data!
npx prisma migrate reset --force --skip-seed

# Then seed fresh data
npm run db:seed
```

## 🚨 Troubleshooting

### Common Issues

**1. "Can't reach database server"**
- Check if DATABASE_URL is correct in GitHub secrets
- Verify network connectivity to database host
- Check firewall rules (especially for corporate networks)

**2. "URL Filter Database blocked"**
- Your firewall is blocking Prisma Accelerate
- Use direct PostgreSQL connection instead
- Contact IT team to whitelist `*.prisma.io` and `*.prisma-data.net`

**3. "Migration failed"**
- Check for conflicting schema changes
- Ensure database user has sufficient permissions
- Review migration files in `prisma/migrations/`

**4. "Unauthorized" errors**
- Verify API keys and credentials in DATABASE_URL
- Check if database credentials have expired
- Ensure user has CREATE/ALTER permissions

### Debug Steps

1. **Test connection locally:**
   ```bash
   npx prisma db execute --command "SELECT version()"
   ```

2. **Check GitHub secrets:**
   - Go to Repository Settings → Secrets and variables → Actions
   - Verify all required secrets are set

3. **Review workflow logs:**
   - Go to Actions tab in GitHub
   - Click on failed workflow run
   - Expand failed steps to see detailed logs

4. **Validate schema:**
   ```bash
   npx prisma validate
   npx prisma format
   ```

## 📋 Environment Setup Checklist

- [ ] Database server is accessible from GitHub Actions
- [ ] Database user has CREATE/ALTER/INSERT permissions
- [ ] GitHub secrets are configured
- [ ] GitHub environments are set up
- [ ] Workflow files are committed to repository
- [ ] Prisma schema is valid
- [ ] Migration files exist in `prisma/migrations/`

## 🔄 Workflow Integration

### With Vercel Deployment
```yaml
# Add this to your Vercel deployment workflow
- name: Deploy Database
  uses: ./.github/workflows/quick-database-deploy.yml
  with:
    environment: production
    seed_users: false
```

### With Pull Request Testing
The full workflow automatically validates schema on PRs without deploying.

### With Branch Deployments
Trigger staging deployments on feature branch merges for testing.

---

## 🆘 Need Help?

1. Check the [GitHub Actions documentation](https://docs.github.com/en/actions)
2. Review [Prisma deployment guides](https://www.prisma.io/docs/guides/deployment)
3. Open an issue in this repository with workflow logs
