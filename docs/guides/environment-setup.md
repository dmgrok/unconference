# Environment Configuration

This document describes the required environment variables for the Unconference application.

## Required Variables

### Application Settings
```bash
APP_ENV=development
NUXT_TOPICS_FILE_PATH=data/topics-sample.json
NUXT_USERS_FILE_PATH=data/users-sample.json
NUXT_MAX_VOTES_PER_TOPIC=12
NUXT_TOP_TOPICS_COUNT=10
```

### OAuth Configuration

#### Google OAuth
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

#### GitHub OAuth
```bash
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

### Session Configuration
```bash
NUXT_SESSION_PASSWORD=your_session_secret_here_32_chars_min
```

## Optional Variables

### Custom OAuth URLs (for enterprise/self-hosted)
```bash
GITHUB_API_URL=https://api.github.com
AUTH_GITHUB_URL=https://github.com/login/oauth/authorize
GITHUB_TOKEN_URL=https://github.com/login/oauth/access_token
```

## Setup Instructions

1. Copy the variables above to a `.env` file in your project root
2. Replace placeholder values with your actual configuration
3. See [OAuth Setup Guide](./oauth-setup.md) for detailed OAuth configuration

## Security Notes

- Never commit `.env` files to version control
- Use different OAuth apps for development and production
- Generate a strong session password (minimum 32 characters)
- Keep OAuth secrets secure and rotate them regularly
