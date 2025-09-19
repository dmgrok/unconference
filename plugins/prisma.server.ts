// Server-only plugin to handle Prisma client initialization
// This ensures proper Prisma setup for both local and Vercel deployments

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA_CLIENT__: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // In production (including Vercel), create a new client
  prisma = new PrismaClient({
    log: ['error']
  })
} else {
  // In development, use global to prevent multiple instances during HMR
  if (!global.__PRISMA_CLIENT__) {
    global.__PRISMA_CLIENT__ = new PrismaClient({
      log: ['error', 'warn']
    })
  }
  prisma = global.__PRISMA_CLIENT__
}

export default defineNuxtPlugin(async () => {
  // Server-side only initialization
  if (process.server) {
    try {
      await prisma.$connect()
      console.log('✅ Prisma client connected successfully')
    } catch (error) {
      console.error('❌ Failed to connect to Prisma client:', error)
      // Don't throw in plugin to avoid breaking the app
    }
  }
})

// Export the client for use in API routes
export { prisma }
