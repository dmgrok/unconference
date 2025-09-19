// Unified Prisma Client singleton for both local dev and Vercel serverless
// This file is the single source of truth. Other helper files should re-export from here.
import { PrismaClient } from '@prisma/client'

// Augment global type to avoid TS complaints in dev HMR
declare global {
  // eslint-disable-next-line no-var
  var __PRISMA__INSTANCE__: PrismaClient | undefined
}

const createClient = () => new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // Ensure proper connection for Vercel
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL
    }
  }
})

// Re-use client across HMR reloads in development to prevent connection leaks
export const prisma: PrismaClient =
  globalThis.__PRISMA__INSTANCE__ ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__PRISMA__INSTANCE__ = prisma
}

export default prisma
