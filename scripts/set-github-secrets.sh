#!/bin/bash

# Quick setup script for GitHub secrets
# Usage: ./scripts/set-github-secrets.sh

echo "🔐 Setting GitHub Secrets for Database Deployment"
echo "================================================"

# Check if in git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Get the remote URL and extract repo name
REMOTE_URL=$(git remote get-url origin)
REPO=$(echo $REMOTE_URL | sed 's/.*github.com[/:]//; s/\.git$//')

echo "📁 Repository: $REPO"
echo ""

# Your database URLs from earlier
STAGING_URL="postgres://e141b5214e3ac20500abaa880723b8c47d7c8b7a754013fc61cfc72d34154bb4:sk_V8olxJqgAlUHpBqYbhK1X@db.prisma.io:5432/postgres?sslmode=require"

echo "Setting up GitHub secrets using GitHub CLI..."
echo ""

# Check if gh is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Please install it:"
    echo "brew install gh"
    echo "Then run: gh auth login"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ Please authenticate with GitHub CLI:"
    echo "gh auth login"
    exit 1
fi

# Set the secrets
echo "🔄 Setting STAGING_DATABASE_URL..."
echo "$STAGING_URL" | gh secret set STAGING_DATABASE_URL

echo "🔄 Setting PRODUCTION_DATABASE_URL..."
echo "$STAGING_URL" | gh secret set PRODUCTION_DATABASE_URL

# Set a default secret key
SECRET_KEY=$(openssl rand -base64 32 2>/dev/null || date | md5sum | cut -d' ' -f1)
echo "🔄 Setting NUXT_SECRET_KEY..."
echo "$SECRET_KEY" | gh secret set NUXT_SECRET_KEY

echo ""
echo "✅ GitHub secrets have been set!"
echo ""
echo "🚀 Now you can:"
echo "1. Go to GitHub → Actions → 'Quick Database Deploy'"
echo "2. Click 'Run workflow'"
echo "3. Select 'staging' and enable 'Create test users'"
echo "4. Click 'Run workflow' to deploy!"
echo ""
echo "📋 Test users that will be created:"
echo "- Super Admin: superadmin@unconference.com / SuperAdmin123"
echo "- Organizer: organizer@example.com / organizerPassword" 
echo "- Admin: darth.vader@starwars.com / AdminPassword123"
echo "- User: storm.trooper@starwars.com / UserPassword123"
