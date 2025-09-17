import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import type { NuxtPage } from '@nuxt/schema'
import logger from './utils/logger'

logger.info('Starting Unconference application...')
logger.info('Environment:', process.env.APP_ENV)
logger.info('TOPICS_FILE_PATH:', process.env.TOPICS_FILE_PATH)
logger.info('USERS_FILE_PATH:', process.env.USERS_FILE_PATH)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  devServer: {
    port: 3001
  },
  build: {
    transpile: ['vuetify'],
  },
  alias: {
    '.prisma/client/index-browser': './node_modules/.prisma/client/index-browser.js'
  },
  hooks: {
    'pages:extend' (pages: NuxtPage[]) {
      function setMiddleware (pages: NuxtPage[]) {
        const publicPages = ['index', 'login', 'register', 'test-admin', 'demo-admin', 'organizer', 'super-admin-guide', 'quick-join', 'recap-demo']
        const adminPages = ['admin', 'settings'] // Add admin-only pages here
        
        for (const page of pages) {
          if (page.name && !publicPages.includes(page.name)) {
            logger.debug(`Setting authentication middleware for page: ${page.name}`)
            if (!page.meta) {
              page.meta = {}
            }
            page.meta.middleware = ['authenticated']
            
            // Add admin requirement for admin pages
            if (adminPages.includes(page.name)) {
              logger.debug(`Setting admin requirement for page: ${page.name}`)
              page.meta.requiresAdmin = true
            }
          }
          if (page.children) {
            setMiddleware(page.children)
          }
        }
      }
      setMiddleware(pages)
    }
  },
  modules: [
    // @ts-expect-error
    (_options, nuxt) => {
      nuxt.hooks.hook('vite:extendConfig', (config) => {
        config.plugins.push(vuetify({ autoImport: true }))
      })
    },
    'nuxt-auth-utils',
    '@nuxt/test-utils/module'
  ],
  runtimeConfig: {
    oauth: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        apiURL: process.env.GITHUB_API_URL ? process.env.GITHUB_API_URL : 'https://api.github.com',
        authorizationURL: process.env.AUTH_GITHUB_URL ? process.env.AUTH_GITHUB_URL : 'https://github.com/login/oauth/authorize',
        tokenURL: process.env.GITHUB_TOKEN_URL ? process.env.GITHUB_TOKEN_URL : 'https://github.com/login/oauth/access_token',
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        scope: ['openid', 'email', 'profile'],
        authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenURL: 'https://oauth2.googleapis.com/token',
        userInfoURL: 'https://www.googleapis.com/oauth2/v2/userinfo'
      },
      linkedin: {
        clientId: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        scope: ['profile', 'openid', 'email'],
        authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
        tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken'
      }
    },
    topicsFilePath: process.env.NUXT_TOPICS_FILE_PATH,
    usersFilePath: process.env.NUXT_USERS_FILE_PATH,
    public: {
      devMode: process.env.APP_ENV === 'development',
      authUrl: '/login', // Force to use /login instead of /auth/github
      maxVotesPerTopic: parseInt(process.env.NUXT_MAX_VOTES_PER_TOPIC || '12'),
      topTopicsCount: parseInt(process.env.NUXT_TOP_TOPICS_COUNT || '10')
    }
  },
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
    server: {
      allowedHosts: ['localhost', '.ngrok.dev'] 
    },
    // Fix Prisma build issues
    define: {
      global: 'globalThis',
    },
    optimizeDeps: {
      exclude: ['@prisma/client']
    }
  },
  nitro: {
    experimental: {
      wasm: true,
      websocket: true
    },
    plugins: ['~/server/plugins/websocket.ts'],
    // Ensure Prisma works in production
    externals: {
      inline: ['@prisma/client']
    }
  },
  // Security configuration
  ssr: true,
  // Add security headers via routeRules
  routeRules: {
    // Global security headers
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
      }
    },
    // API rate limiting will be handled by middleware
    '/api/**': {
      cors: true
    }
  }
})
