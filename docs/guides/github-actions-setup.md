# GitHub Actions Deployment Setup

This guide explains how to set up automated deployments to Vercel using GitHub Actions.

## Overview

The unconference app uses two GitHub Actions workflows:

1. **`deploy-vercel.yml`** - Handles Vercel application deployments
2. **`deploy-database.yml`** - Manages database migrations and seeding

## Required Secrets

You need to configure these secrets in your GitHub repository:

### Repository Settings → Secrets → Actions

#### Vercel Integration Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | [Vercel Dashboard](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Your Vercel team/org ID | `vercel whoami` or Vercel project settings |
| `VERCEL_PROJECT_ID` | Your project ID | Vercel project settings → General |

#### Database Secrets

| Secret Name | Description | Value |
|-------------|-------------|-------|
| `DATABASE_URL` | Production database URL | Your Prisma Accelerate connection string |
| `STAGING_DATABASE_URL` | Staging database URL (optional) | Separate staging database |
| `PRODUCTION_DATABASE_URL` | Production database URL | Same as DATABASE_URL |

## Setup Instructions

### 1. Get Vercel Integration Details

Run these commands in your project directory:

```bash
# Install Vercel CLI
npm install -g vercel@latest

# Login to Vercel
vercel login

# Link your project
vercel link

# Get your org and project IDs
vercel whoami
```

### 2. Create Vercel API Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name it "GitHub Actions"
4. Set scope to your team/account
5. Copy the token

### 3. Add Secrets to GitHub

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret:

```
VERCEL_TOKEN=vercel_xxx...
VERCEL_ORG_ID=team_xxx...
VERCEL_PROJECT_ID=prj_xxx...
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=xxx...
```

### 4. Configure Environment Variables

The workflows will automatically set the DATABASE_URL in Vercel environments. You can also manually configure additional environment variables:

```bash
# Set additional Vercel environment variables
vercel env add GITHUB_CLIENT_ID production
vercel env add GITHUB_CLIENT_SECRET production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
```

## Workflow Triggers

### Automatic Triggers

- **Push to `main`** → Production deployment
- **Push to feature branches** → Preview deployment
- **Pull requests** → Preview deployment with PR comment

### Manual Triggers

- **Workflow Dispatch** → Choose environment (preview/production)
- **Database deployment** → Separate database operations

## Deployment Process

### Preview Deployments

1. Validates build and tests
2. Sets up preview database (with `db push`)
3. Builds and deploys to Vercel preview URL
4. Runs health checks
5. Comments on PR with preview URL

### Production Deployments

1. Validates build and tests
2. Applies database migrations/schema changes
3. Builds and deploys to production
4. Runs health checks
5. Cleans up old deployments

## Health Checks

The workflow uses the `/api/health` endpoint to verify deployments:

```bash
# Manual health check
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-19T19:00:00.000Z",
  "checks": {
    "filesystem": true,
    "dataAccess": true,
    "auth": true,
    "database": true
  },
  "userCount": 4,
  "responseTime": 150
}
```

## Troubleshooting

### Common Issues

#### 1. "Vercel token expired"
- Create a new token in Vercel dashboard
- Update the `VERCEL_TOKEN` secret in GitHub

#### 2. "Database connection failed"
- Verify `DATABASE_URL` secret is correct
- Check Prisma Accelerate API key validity
- Ensure database permissions are set correctly

#### 3. "Build failures"
- Check Node.js version compatibility
- Verify all dependencies are in `package.json`
- Review build logs for specific errors

#### 4. "Environment variable not found"
- Ensure all required secrets are set in GitHub
- Check secret names match exactly (case-sensitive)
- Verify environment scope (production/preview/development)

### Debug Commands

```bash
# Check Vercel project status
vercel ls

# Check environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local

# Test database connection
npm run db:check

# Manual deployment
vercel deploy --prod
```

## Security Considerations

1. **Never commit secrets** to your repository
2. **Use environment-specific secrets** for staging vs production
3. **Rotate tokens regularly** (every 90 days recommended)
4. **Limit token permissions** to only what's needed
5. **Monitor deployment logs** for suspicious activity

## Next Steps

After setup is complete:

1. Push a commit to trigger your first automated deployment
2. Test the preview deployment workflow with a pull request
3. Verify health checks are passing
4. Set up monitoring for production deployments

## Support

- **Vercel Documentation**: https://vercel.com/docs
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Project Issues**: Create an issue in this repository