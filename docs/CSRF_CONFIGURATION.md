# CSRF Protection Configuration

## Overview

The CSRF (Cross-Site Request Forgery) protection has been configured to be development-friendly while maintaining security in production.

## How It Works

### Development Mode (`NODE_ENV=development`)
- ✅ **CSRF tokens are generated** but not enforced
- ✅ **Requests are allowed** even without proper CSRF tokens
- ✅ **Warnings are logged** for missing tokens (for debugging)
- ✅ **No blocking** of legitimate development requests

### Production Mode (`NODE_ENV=production`)
- 🔒 **CSRF tokens are required** for all POST/PUT/DELETE/PATCH requests
- 🔒 **Requests are blocked** if tokens are missing or invalid
- 🔒 **Strict cookie settings** (sameSite=strict, secure=true)
- 🔒 **Full protection** against CSRF attacks

## Current Behavior

The warning you saw:
```
WARN  CSRF violation from IP: 127.0.0.1, URL: /api/admin/settings, Method: POST
```

This is **expected in development mode** and indicates:
1. ✅ The CSRF system is working and monitoring requests
2. ✅ The request was **allowed to proceed** despite missing token
3. ✅ This is normal behavior for development

## Configuration

The CSRF protection is configured in:
- **Server**: `/server/middleware/csrf.ts`
- **Client**: `/plugins/csrf.client.ts`
- **Config**: `/server/utils/securityConfig.ts`

## Manual CSRF Token Usage

If you need to manually include CSRF tokens in development for testing:

```javascript
// Get CSRF token
const token = useCookie('csrf-token').value

// Use in request headers
const response = await $fetch('/api/admin/settings', {
  method: 'POST',
  headers: {
    'x-csrf-token': token
  },
  body: { /* your data */ }
})
```

## Rate Limiting Adjustments

Rate limiting has also been made more lenient in development:

| Endpoint Type | Development | Production |
|---------------|-------------|------------|
| General API   | 1000/min    | 100/min    |
| Authentication| 100/min     | 10/min     |
| Voting        | 200/min     | 20/min     |
| Admin         | 2000/min    | 200/min    |

## Environment Variables

To control security behavior:

```bash
# Development (lenient security)
NODE_ENV=development

# Production (strict security)
NODE_ENV=production
```

## Summary

- 🟢 **Development**: Security monitoring enabled, but non-blocking
- 🔴 **Production**: Full security enforcement
- 📝 **Warnings**: Normal in development, help with debugging
- 🚀 **Ready**: Your app is protected when deployed to production

The CSRF warnings in development are informational only and don't block functionality.
