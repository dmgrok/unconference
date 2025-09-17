#!/bin/bash
# Quick Production Deployment Script for Unconference Platform
# Automates the deployment process with safety checks

set -e  # Exit on any error

echo "🚀 Unconference Platform - Production Deployment"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function for colored output
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if we're in the correct directory
if [ ! -f "package.json" ] || ! grep -q "unconference" package.json; then
    log_error "Please run this script from the unconference project root directory"
    exit 1
fi

log_info "Detected Nuxt 3 project with following deployment options:"
echo "1. Vercel (Recommended - serverless, automatic scaling)"
echo "2. Netlify (Alternative - good for static sites)" 
echo "3. Docker (Self-hosted - full control)"
echo "4. Manual server deployment"
echo ""

# Check for existing deployment tools
VERCEL_AVAILABLE=false
NETLIFY_AVAILABLE=false
DOCKER_AVAILABLE=false

if command -v vercel &> /dev/null; then
    VERCEL_AVAILABLE=true
    log_success "Vercel CLI detected"
fi

if command -v netlify &> /dev/null; then
    NETLIFY_AVAILABLE=true
    log_success "Netlify CLI detected"
fi

if command -v docker &> /dev/null; then
    DOCKER_AVAILABLE=true
    log_success "Docker detected"
fi

echo ""
log_info "Pre-deployment checks..."

# Check Node.js version
NODE_VERSION=$(node --version)
log_info "Node.js version: $NODE_VERSION"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    log_warning "Dependencies not found. Installing..."
    npm install
    log_success "Dependencies installed"
fi

# Check if Prisma is set up
if [ ! -d "node_modules/@prisma" ]; then
    log_warning "Prisma client not found. Generating..."
    npm run db:generate
    log_success "Prisma client generated"
fi

# Environment check
log_info "Checking environment configuration..."

if [ ! -f ".env" ]; then
    log_warning "No .env file found. You'll need to configure environment variables."
else
    log_success "Environment file found"
fi

# Build test
log_info "Testing production build..."
if npm run build; then
    log_success "Build successful!"
else
    log_error "Build failed. Please fix build errors before deploying."
    exit 1
fi

echo ""
echo "🎯 Choose deployment method:"
echo "1. Vercel (Recommended)"
echo "2. Netlify" 
echo "3. Docker"
echo "4. Manual instructions"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        if [ "$VERCEL_AVAILABLE" = true ]; then
            log_info "Deploying to Vercel..."
            
            # Check if already linked to project
            if [ ! -f ".vercel/project.json" ]; then
                log_info "Linking to Vercel project..."
                vercel link
            fi
            
            # Deploy to production
            log_info "Deploying to production..."
            vercel --prod
            
            log_success "Deployed to Vercel!"
            log_warning "Don't forget to:"
            echo "  1. Configure environment variables in Vercel dashboard"
            echo "  2. Set up your custom domain"
            echo "  3. Configure Stripe webhooks"
        else
            log_warning "Vercel CLI not installed. Installing..."
            npm install -g vercel
            log_info "Please run the script again after installation"
        fi
        ;;
        
    2)
        if [ "$NETLIFY_AVAILABLE" = true ]; then
            log_info "Building for Netlify..."
            npm run generate  # Static generation for Netlify
            
            log_info "Deploying to Netlify..."
            netlify deploy --prod --dir=.output/public
            
            log_success "Deployed to Netlify!"
        else
            log_warning "Netlify CLI not installed. Installing..."
            npm install -g netlify-cli
            log_info "Please run the script again after installation"
        fi
        ;;
        
    3)
        if [ "$DOCKER_AVAILABLE" = true ]; then
            log_info "Building Docker image..."
            npm run build:docker
            
            log_info "Docker image built successfully!"
            echo ""
            log_info "To run your container:"
            echo "docker run -d -p 3000:3000 --env-file .env.production unconference"
            echo ""
            log_warning "Make sure to create .env.production with your production environment variables"
        else
            log_error "Docker not installed. Please install Docker first."
            exit 1
        fi
        ;;
        
    4)
        log_info "Manual deployment instructions:"
        echo ""
        echo "1. Upload your built application to your server"
        echo "2. Install Node.js 18+ on your server"
        echo "3. Run: npm install --production"
        echo "4. Run: npm run db:generate"
        echo "5. Set up your production environment variables"
        echo "6. Start with: npm start or use PM2"
        echo ""
        log_warning "See DEPLOYMENT_GUIDE.md for detailed instructions"
        ;;
        
    *)
        log_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
log_success "Deployment process completed!"
echo ""
log_info "Post-deployment checklist:"
echo "✓ Test your live site"
echo "✓ Configure Stripe webhooks" 
echo "✓ Set up monitoring"
echo "✓ Test payment processing"
echo "✓ Verify mobile experience"
echo ""
log_info "Your unconference platform is now live! 🎉"
echo "Remember: You're now competing with Sessionize at 95% lower cost ($29/$99 vs €500)"
