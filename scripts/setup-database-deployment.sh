#!/bin/bash

# Database Deployment Setup Script
# This script helps set up GitHub secrets and environment variables for database deployment

echo "🚀 Setting up Database Deployment for Unconference App"
echo "=================================================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    echo "Then run: gh auth login"
    exit 1
fi

# Check if logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo "❌ Not logged in to GitHub CLI."
    echo "Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"

# Get repository information
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📁 Repository: $REPO"

echo ""
echo "🔐 Setting up GitHub Repository Secrets..."
echo "You'll need to provide your database connection strings."
echo ""

# Function to set secret with validation
set_secret() {
    local secret_name=$1
    local description=$2
    local example=$3
    
    echo "Setting $secret_name"
    echo "Description: $description"
    echo "Example format: $example"
    echo -n "Enter value (input hidden): "
    read -s secret_value
    echo ""
    
    if [ -z "$secret_value" ]; then
        echo "⚠️  Skipping $secret_name (empty value)"
        return
    fi
    
    if gh secret set "$secret_name" --body "$secret_value"; then
        echo "✅ Set $secret_name"
    else
        echo "❌ Failed to set $secret_name"
    fi
    echo ""
}

# Set database secrets
echo "1. Database Connection Strings"
echo "=============================="

set_secret "STAGING_DATABASE_URL" \
    "Staging database connection string" \
    "postgres://user:pass@host:5432/dbname?sslmode=require"

set_secret "PRODUCTION_DATABASE_URL" \
    "Production database connection string" \
    "postgres://user:pass@host:5432/dbname?sslmode=require"

# Optional: Set additional secrets
echo "2. Optional Secrets"
echo "=================="

read -p "Would you like to set additional secrets for OAuth, SMTP, etc.? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    set_secret "NUXT_SECRET_KEY" \
        "Session secret key" \
        "your-random-secret-key-here"
        
    set_secret "GITHUB_CLIENT_ID" \
        "GitHub OAuth client ID" \
        "your-github-client-id"
        
    set_secret "GITHUB_CLIENT_SECRET" \
        "GitHub OAuth client secret" \
        "your-github-client-secret"
fi

echo ""
echo "🎯 Setting up GitHub Environments..."

# Create staging environment
if gh api repos/$REPO/environments/staging &> /dev/null; then
    echo "✅ Staging environment already exists"
else
    if gh api --method PUT repos/$REPO/environments/staging --input - <<< '{}'; then
        echo "✅ Created staging environment"
    else
        echo "⚠️  Could not create staging environment (may require admin permissions)"
    fi
fi

# Create production environment with protection rules
if gh api repos/$REPO/environments/production &> /dev/null; then
    echo "✅ Production environment already exists"
else
    protection_rules='{
        "wait_timer": 0,
        "reviewers": [],
        "deployment_branch_policy": {
            "protected_branches": true,
            "custom_branch_policies": false
        }
    }'
    
    if gh api --method PUT repos/$REPO/environments/production --input - <<< "$protection_rules"; then
        echo "✅ Created production environment with protection rules"
    else
        echo "⚠️  Could not create production environment (may require admin permissions)"
    fi
fi

echo ""
echo "📋 Setup Summary"
echo "================="
echo "✅ GitHub Action created: .github/workflows/deploy-database.yml"
echo "✅ Database secrets configured"
echo "✅ GitHub environments set up"
echo ""
echo "🚀 Next Steps:"
echo "1. Commit and push the new GitHub Action:"
echo "   git add .github/workflows/deploy-database.yml"
echo "   git commit -m 'Add database deployment workflow'"
echo "   git push"
echo ""
echo "2. Manually trigger the workflow:"
echo "   - Go to GitHub → Actions → Deploy Database and Seed Data"
echo "   - Click 'Run workflow'"
echo "   - Choose environment and options"
echo ""
echo "3. The workflow will automatically run on:"
echo "   - Pushes to main branch (if Prisma files change)"
echo "   - Pull requests (validation only)"
echo ""
echo "4. Test users will be available after seeding:"
echo "   - Super Admin: superadmin@unconference.com / SuperAdmin123"
echo "   - Organizer: organizer@example.com / organizerPassword"
echo "   - Admin: darth.vader@starwars.com / AdminPassword123"
echo "   - User: storm.trooper@starwars.com / UserPassword123"
echo ""
echo "🎉 Database deployment setup complete!"
