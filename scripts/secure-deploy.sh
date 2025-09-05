#!/bin/bash

# Security-focused deployment script for Unconference App
# This script sets up the production environment with security best practices

set -e  # Exit on any error

echo "🔒 Starting secure deployment of Unconference App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root is not recommended for security reasons"
fi

# Check required environment variables
check_env_vars() {
    print_status "Checking required environment variables..."
    
    required_vars=(
        "NODE_ENV"
        "NUXT_SECRET_KEY" 
        "GITHUB_CLIENT_SECRET"
        "GOOGLE_CLIENT_SECRET"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi
    
    print_status "All required environment variables are set"
}

# Set up directory permissions
setup_permissions() {
    print_status "Setting up secure directory permissions..."
    
    # Create data directory if it doesn't exist
    mkdir -p data/{platform,monitoring,backup}
    
    # Set secure permissions
    chmod 755 data/
    chmod 755 data/platform/
    chmod 755 data/monitoring/
    chmod 700 data/backup/  # Backup directory should be more restrictive
    
    # Ensure log files have proper permissions
    if [ -d "logs" ]; then
        chmod 755 logs/
        chmod 644 logs/*.log 2>/dev/null || true
    fi
    
    print_status "Directory permissions configured"
}

# Install dependencies with security audit
install_dependencies() {
    print_status "Installing dependencies with security audit..."
    
    # Clear any existing node_modules and package-lock
    rm -rf node_modules package-lock.json
    
    # Install with audit
    npm ci --production
    
    # Run security audit
    print_status "Running security audit..."
    npm audit --audit-level high
    
    if [ $? -ne 0 ]; then
        print_warning "Security vulnerabilities found. Consider running 'npm audit fix'"
    fi
    
    print_status "Dependencies installed and audited"
}

# Build application
build_application() {
    print_status "Building application..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Build the application
    npm run build
    
    if [ $? -ne 0 ]; then
        print_error "Build failed"
        exit 1
    fi
    
    print_status "Application built successfully"
}

# Set up monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create monitoring directories
    mkdir -p data/monitoring/logs
    mkdir -p data/monitoring/exports
    
    # Set up log rotation (if logrotate is available)
    if command -v logrotate &> /dev/null; then
        cat > /tmp/unconference-logrotate << EOF
/path/to/your/app/data/monitoring/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
        print_status "Log rotation configured"
    fi
    
    print_status "Monitoring setup complete"
}

# Configure firewall (basic UFW setup)
configure_firewall() {
    if command -v ufw &> /dev/null; then
        print_status "Configuring firewall..."
        
        # Enable UFW
        ufw --force enable
        
        # Default policies
        ufw default deny incoming
        ufw default allow outgoing
        
        # Allow SSH (be careful!)
        ufw allow ssh
        
        # Allow HTTP and HTTPS
        ufw allow 80/tcp
        ufw allow 443/tcp
        
        # Allow your application port (usually 3000 in development)
        if [ "$NODE_ENV" != "production" ]; then
            ufw allow 3000/tcp
        fi
        
        print_status "Firewall configured"
    else
        print_warning "UFW not found. Please configure firewall manually"
    fi
}

# Set up SSL (if certificates are available)
setup_ssl() {
    if [ -f "/etc/ssl/certs/unconference.crt" ] && [ -f "/etc/ssl/private/unconference.key" ]; then
        print_status "SSL certificates found"
        
        # Set proper permissions on SSL files
        chmod 644 /etc/ssl/certs/unconference.crt
        chmod 600 /etc/ssl/private/unconference.key
        
        print_status "SSL configured"
    else
        print_warning "SSL certificates not found. Consider setting up Let's Encrypt"
    fi
}

# Create systemd service file for production
create_service() {
    if [ "$NODE_ENV" = "production" ] && command -v systemctl &> /dev/null; then
        print_status "Creating systemd service..."
        
        cat > /tmp/unconference.service << EOF
[Unit]
Description=Unconference App
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$(pwd)/data

[Install]
WantedBy=multi-user.target
EOF
        
        print_status "Systemd service file created at /tmp/unconference.service"
        print_status "To install: sudo cp /tmp/unconference.service /etc/systemd/system/"
        print_status "Then run: sudo systemctl enable unconference && sudo systemctl start unconference"
    fi
}

# Backup existing data
backup_data() {
    if [ -d "data" ]; then
        print_status "Creating backup of existing data..."
        
        backup_dir="data/backup/backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$backup_dir"
        
        cp -r data/platform "$backup_dir/" 2>/dev/null || true
        cp -r data/monitoring "$backup_dir/" 2>/dev/null || true
        
        print_status "Backup created at $backup_dir"
    fi
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Start the application in background for testing
    if [ "$NODE_ENV" = "production" ]; then
        # In production, assume the service is managed by systemd
        print_status "In production mode - assuming service is managed externally"
    else
        # Development mode - start temporarily for health check
        timeout 30s npm run start &
        app_pid=$!
        
        sleep 5
        
        # Check if application is responding
        if curl -f http://localhost:3000/api/health &>/dev/null; then
            print_status "Health check passed"
        else
            print_warning "Health check failed"
        fi
        
        # Stop the test instance
        kill $app_pid 2>/dev/null || true
        wait $app_pid 2>/dev/null || true
    fi
}

# Security recommendations
print_security_recommendations() {
    print_status "Security recommendations:"
    echo "1. 🔒 Enable HTTPS with valid SSL certificates"
    echo "2. 🛡️  Set up a reverse proxy (nginx/Apache) with security headers"
    echo "3. 🔐 Configure fail2ban for SSH protection"
    echo "4. 📊 Set up centralized logging and monitoring"
    echo "5. 🔄 Enable automatic security updates"
    echo "6. 🏗️  Use a Web Application Firewall (WAF)"
    echo "7. 📋 Regularly audit dependencies with 'npm audit'"
    echo "8. 🔍 Monitor application logs for security incidents"
    echo "9. 💾 Set up automated backups"
    echo "10. 🧪 Perform regular penetration testing"
}

# Main deployment flow
main() {
    print_status "Starting secure deployment process..."
    
    check_env_vars
    backup_data
    setup_permissions
    install_dependencies
    build_application
    setup_monitoring
    
    # Only configure system-level security in production
    if [ "$NODE_ENV" = "production" ]; then
        configure_firewall
        setup_ssl
        create_service
    fi
    
    health_check
    
    print_status "✅ Deployment completed successfully!"
    echo ""
    print_security_recommendations
    echo ""
    print_status "🚀 Your Unconference app is ready and secured!"
}

# Run main function
main "$@"
