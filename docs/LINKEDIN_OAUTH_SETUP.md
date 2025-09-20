# LinkedIn OAuth Setup Guide

## Issue Fixed
The LinkedIn OAuth integration was looking for environment variables with the `NUXT_OAUTH_` prefix, but the configuration was using the old variable names. This has been fixed by updating both the environment template and Nuxt configuration.

## Required Environment Variables

Add these variables to your `.env` file:

```bash
# LinkedIn OAuth
NUXT_OAUTH_LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
NUXT_OAUTH_LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
```

## How to Get LinkedIn OAuth Credentials

### Step 1: Create a LinkedIn App
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Sign in with your LinkedIn account
3. Click "Create App"
4. Fill in the required information:
   - App name: "Unconference Platform" (or your preferred name)
   - LinkedIn Page: Your company/organization page (create one if needed)
   - App logo: Upload a logo for your app
   - Legal agreement: Accept the terms

### Step 2: Configure OAuth Settings
1. In your LinkedIn app dashboard, go to the "Auth" tab
2. Add your redirect URLs:
   - For local development: `http://localhost:3000/api/auth/linkedin`
   - For production: `https://yourdomain.com/api/auth/linkedin`
3. Note down your:
   - **Client ID** (visible on the Auth page)
   - **Client Secret** (click "Generate a client secret")

### Step 3: Configure Scopes
1. In the "Products" tab, request access to:
   - **Sign In with LinkedIn using OpenID Connect** (required for basic auth)
   - **Profile API** (for user profile information)
   - **Email Address** (for email access)
2. Wait for approval (usually instant for standard scopes)

### Step 4: Update Your Environment
1. Open your `.env` file
2. Replace the placeholder values:
```bash
NUXT_OAUTH_LINKEDIN_CLIENT_ID=your_actual_client_id_from_linkedin
NUXT_OAUTH_LINKEDIN_CLIENT_SECRET=your_actual_client_secret_from_linkedin
```

### Step 5: Restart Your Development Server
```bash
# Stop your current dev server (Ctrl+C)
npm run dev
```

## Testing LinkedIn OAuth

1. Go to your login page: `http://localhost:3000/login`
2. Click the "LinkedIn" button
3. You should be redirected to LinkedIn for authorization
4. After approving, you'll be redirected back to your app

## Troubleshooting

### Common Issues:

**"Redirect URI mismatch"**
- Ensure your redirect URL in LinkedIn app settings exactly matches: `http://localhost:3000/api/auth/linkedin`

**"Invalid client_id or client_secret"**
- Double-check your credentials in the `.env` file
- Make sure there are no extra spaces or quotes around the values

**"Insufficient privileges"**
- Make sure you've requested and been approved for the necessary scopes in LinkedIn

**Still getting NUXT_OAUTH error**
- Restart your development server after adding environment variables
- Check that your `.env` file is in the project root directory

## Production Deployment

For production, set these environment variables in your hosting platform:
- `NUXT_OAUTH_LINKEDIN_CLIENT_ID`
- `NUXT_OAUTH_LINKEDIN_CLIENT_SECRET`

And update your LinkedIn app's redirect URLs to include your production domain.

## Security Notes

- Never commit your actual client secrets to version control
- Use different LinkedIn apps for development and production environments
- Regularly rotate your client secrets in production
