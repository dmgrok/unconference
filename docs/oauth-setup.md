# OAuth Authentication Setup

This document explains how to set up OAuth authentication for the Unconference application.

## Supported Providers

The application supports multiple OAuth providers:
- **Google** - Gmail/Google Workspace accounts
- **GitHub** - GitHub accounts
- **Email/Password** - Traditional login for existing users

## OAuth Provider Configuration

### Google OAuth Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Google+ API

2. **Configure OAuth Consent Screen**
   - Go to APIs & Services > OAuth consent screen
   - Choose "External" user type
   - Fill in required fields:
     - Application name: "Unconference"
     - User support email: Your email
     - Developer contact: Your email

3. **Create OAuth Credentials**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/google` (development)
     - `https://yourdomain.com/api/auth/google` (production)

4. **Environment Variables**
   ```bash
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

### GitHub OAuth Setup

1. **Create GitHub OAuth App**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Click "New OAuth App"
   - Fill in application details:
     - Application name: "Unconference"
     - Homepage URL: Your application URL
     - Authorization callback URL:
       - `http://localhost:3000/api/auth/github` (development)
       - `https://yourdomain.com/api/auth/github` (production)

2. **Environment Variables**
   ```bash
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

## OAuth Flow

### User Experience

1. **Login Page**
   - Users can choose between OAuth providers or email/password
   - OAuth buttons redirect to provider authorization
   - Event codes are preserved during OAuth flow

2. **OAuth Callback**
   - Provider redirects back to `/api/auth/{provider}`
   - User information is retrieved from provider
   - Account is created or linked if user doesn't exist
   - Session is established and user is redirected

3. **Account Creation**
   - New OAuth users are automatically registered
   - Email from OAuth provider is used as identifier
   - No password required for OAuth users
   - Default role is "User"

### Technical Flow

```
1. User clicks OAuth button
   ↓
2. Redirect to provider authorization URL
   ↓
3. User authorizes application
   ↓
4. Provider redirects to callback URL
   ↓
5. Exchange authorization code for access token
   ↓
6. Fetch user information from provider
   ↓
7. Create/update user in database
   ↓
8. Set user session
   ↓
9. Redirect to application
```

## Security Considerations

### State Parameter
- Event codes are passed via OAuth state parameter
- Prevents CSRF attacks
- Preserves context during OAuth flow

### User Identification
- Email is primary identifier across providers
- GitHub users without email get `{username}@github.local`
- Duplicate prevention across provider types

### Session Management
- Sessions use secure cookies
- JWT tokens with expiration
- Role-based access control

## Error Handling

### OAuth Errors
- Provider authorization denied → Redirect to login with error
- Invalid credentials → Redirect to login with error message
- Network/API errors → Log error and show generic message

### User Creation Errors
- Email conflicts → Link to existing account
- Missing required fields → Use provider defaults
- File system errors → Log and show error message

## Development vs Production

### Development
- Use localhost URLs for redirects
- HTTP allowed for local development
- Relaxed CORS policies

### Production
- HTTPS required for OAuth redirects
- Secure cookie settings
- Proper domain configuration
- Rate limiting considerations

## Testing

### Manual Testing
1. Test each OAuth provider
2. Test new user creation
3. Test existing user login
4. Test error scenarios
5. Test event code preservation

### Automated Testing
- Mock OAuth responses
- Test callback handlers
- Test user creation logic
- Test session management

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**
   - Check OAuth app configuration
   - Verify redirect URIs match exactly
   - Include protocol (http/https)

2. **Invalid Client Credentials**
   - Verify environment variables
   - Check client ID/secret values
   - Ensure credentials are for correct environment

3. **Permission Errors**
   - Check OAuth app permissions/scopes
   - Verify consent screen approval
   - Check API enablement

4. **Session Issues**
   - Check cookie settings
   - Verify session secret configuration
   - Check HTTPS/secure settings

### Debug Information
- Check server logs for OAuth errors
- Use browser dev tools for network requests
- Test with OAuth provider debug tools
