# Deployment Guide

This guide covers various deployment options for the Unconference application.

## 🚀 Quick Deployment Options

### Option 1: Docker (Recommended)
### Option 2: Azure Static Web Apps
### Option 3: Vercel/Netlify
### Option 4: Traditional Server

---

## 🐳 Docker Deployment

### Prerequisites
- Docker installed
- GitHub OAuth App configured

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/unconference.git
cd unconference

# Build the Docker image
docker build -t unconference .

# Run the container
docker run -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e GITHUB_CLIENT_ID=your_github_client_id \
  -e GITHUB_CLIENT_SECRET=your_github_client_secret \
  -e NUXT_SESSION_PASSWORD=your_secure_random_password \
  unconference
```

### Docker Compose Setup

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  unconference:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      # Required
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - NUXT_SESSION_PASSWORD=${NUXT_SESSION_PASSWORD}
      
      # Optional
      - NUXT_MAX_VOTES_PER_TOPIC=12
      - NUXT_TOP_TOPICS_COUNT=10
      - APP_ENV=production
      
      # File paths (optional)
      - NUXT_TOPICS_FILE_PATH=/app/data/topics.json
      - NUXT_USERS_FILE_PATH=/app/data/users.json
    restart: unless-stopped
    
  # Optional: Add nginx for SSL termination
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - unconference
```

### Environment Variables

Create a `.env` file:

```env
# Required - GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_app_client_id
GITHUB_CLIENT_SECRET=your_github_app_client_secret

# Required - Session Security (generate a secure random string)
NUXT_SESSION_PASSWORD=your_very_secure_random_password_at_least_32_chars

# Optional - Application Settings
NUXT_MAX_VOTES_PER_TOPIC=12
NUXT_TOP_TOPICS_COUNT=10
APP_ENV=production

# Optional - Data Storage Paths
NUXT_TOPICS_FILE_PATH=/app/data/topics.json
NUXT_USERS_FILE_PATH=/app/data/users.json

# Optional - Logging
LOG_LEVEL=info
```

### Production Docker Commands

```bash
# Build and run with compose
docker-compose up -d

# View logs
docker-compose logs -f unconference

# Update the application
docker-compose pull
docker-compose up -d --build

# Backup data
docker run --rm -v unconference_data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz /data

# Restore data
docker run --rm -v unconference_data:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /
```

---

## ☁️ Azure Static Web Apps Deployment

### Prerequisites
- Azure account
- GitHub repository
- Azure CLI (optional)

### Automatic Deployment

1. **Fork the repository** to your GitHub account

2. **Create Azure Static Web App**:
   - Go to Azure Portal
   - Create new Static Web App
   - Connect to your GitHub repository
   - Select "Nuxt.js" preset
   - Set build location to `/`

3. **Configure Environment Variables** in Azure Portal:
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   NUXT_SESSION_PASSWORD=your_session_password
   ```

4. **GitHub Actions** will automatically deploy on push to main branch

### Manual Azure Deployment

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Create resource group
az group create --name unconference-rg --location eastus

# Create static web app
az staticwebapp create \
  --name unconference-app \
  --resource-group unconference-rg \
  --source https://github.com/your-username/unconference \
  --location eastus \
  --branch main \
  --app-location "/" \
  --api-location "server/api" \
  --output-location ".output/public"
```

### Azure Configuration

The repository includes `.github/workflows/azure-static-web-apps-*.yml` for automatic deployment.

**Required App Settings**:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `NUXT_SESSION_PASSWORD`

---

## 🚀 Vercel Deployment

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/unconference)

### Manual Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add NUXT_SESSION_PASSWORD

# Deploy to production
vercel --prod
```

### Vercel Configuration

Create `vercel.json`:

```json
{
  "builds": [
    {
      "src": "nuxt.config.ts",
      "use": "@nuxtjs/vercel-builder"
    }
  ],
  "env": {
    "GITHUB_CLIENT_ID": "@github_client_id",
    "GITHUB_CLIENT_SECRET": "@github_client_secret",
    "NUXT_SESSION_PASSWORD": "@nuxt_session_password"
  }
}
```

---

## 🌐 Netlify Deployment

### Netlify Deploy

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod --dir=.output/public
```

### Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
```

---

## 🖥️ Traditional Server Deployment

### Prerequisites
- Node.js 18+
- PM2 (process manager)
- Nginx (reverse proxy)

### Server Setup

```bash
# Clone repository
git clone https://github.com/your-org/unconference.git
cd unconference

# Install dependencies
npm ci --production

# Build application
npm run build

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'unconference',
    script: '.output/server/index.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      GITHUB_CLIENT_ID: 'your_client_id',
      GITHUB_CLIENT_SECRET: 'your_client_secret',
      NUXT_SESSION_PASSWORD: 'your_session_password'
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
```

### Nginx Configuration

Create `/etc/nginx/sites-available/unconference`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location /_nuxt/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🔧 Configuration Management

### GitHub OAuth Setup

1. **Create GitHub OAuth App**:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Click "New OAuth App"
   - Set Application name: "Your Unconference"
   - Set Homepage URL: "https://your-domain.com"
   - Set Authorization callback URL: "https://your-domain.com/auth/github"

2. **Get Credentials**:
   - Note the Client ID
   - Generate and note the Client Secret

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth Client ID | `abc123def456` |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth Client Secret | `secret123` |
| `NUXT_SESSION_PASSWORD` | Yes | Session encryption key (32+ chars) | `your-secure-password` |
| `NUXT_MAX_VOTES_PER_TOPIC` | No | Max votes per topic | `12` |
| `NUXT_TOP_TOPICS_COUNT` | No | Number of top topics | `10` |
| `APP_ENV` | No | Environment | `production` |
| `NUXT_TOPICS_FILE_PATH` | No | Topics data file path | `./data/topics.json` |
| `NUXT_USERS_FILE_PATH` | No | Users data file path | `./data/users.json` |

---

## 📁 Data Management

### Data Persistence

The application stores data in JSON files. Ensure proper backup strategies:

```bash
# Create backup
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d-%H%M%S)
tar -czf "$BACKUP_DIR/unconference-backup-$DATE.tar.gz" data/
find "$BACKUP_DIR" -name "unconference-backup-*.tar.gz" -mtime +7 -delete
```

### Data Migration

When updating the application:

1. **Backup current data**
2. **Update application code**
3. **Run migration scripts** (if any)
4. **Verify data integrity**

---

## 🔍 Monitoring & Logging

### Health Checks

```bash
# Check application health
curl -f http://localhost:3000/api || exit 1

# Check disk space
df -h /app/data

# Check memory usage
free -m

# Check process status
pm2 status
```

### Log Management

```bash
# View logs
pm2 logs unconference

# Rotate logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### Monitoring Setup

Consider using:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Performance monitoring**: New Relic, DataDog
- **Log aggregation**: ELK Stack, Splunk

---

## 🛡️ Security Considerations

### SSL/TLS
- Use valid SSL certificates
- Enable HSTS headers
- Use strong cipher suites

### Application Security
- Keep dependencies updated
- Use environment variables for secrets
- Implement rate limiting
- Regular security audits

### Data Protection
- Regular backups
- Encrypt sensitive data
- Implement access controls
- Monitor for anomalies

---

## 🚨 Troubleshooting

### Common Issues

**Build Failures**:
```bash
# Clear cache and rebuild
rm -rf .nuxt .output node_modules
npm install
npm run build
```

**Permission Issues**:
```bash
# Fix data directory permissions
chmod -R 755 data/
chown -R app:app data/
```

**Memory Issues**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Support Resources

- Check application logs
- Review GitHub issues
- Consult documentation
- Contact support team

---

## 📈 Performance Optimization

### Production Optimizations

1. **Enable compression** (gzip/brotli)
2. **Use CDN** for static assets
3. **Enable caching** headers
4. **Optimize images** and assets
5. **Use process clustering** (PM2)
6. **Monitor performance** metrics

### Scaling Considerations

- **Horizontal scaling**: Load balancers
- **Database scaling**: Consider database for large events
- **Caching layer**: Redis for session storage
- **File storage**: S3 or similar for large deployments
