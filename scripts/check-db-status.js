#!/usr/bin/env node

/**
 * Database Status Checker
 * Run this to verify database connection and table existence
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabaseStatus() {
  console.log('🔍 Checking database connection...')

  try {
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Check if users table exists by trying to count users
    try {
      const userCount = await prisma.user.count()
      console.log(`✅ Users table exists with ${userCount} users`)
    } catch (error) {
      console.log('❌ Users table does not exist:', error.message)
      return false
    }

    // Check other critical tables
    const tables = [
      { name: 'events', model: prisma.event },
      { name: 'topics', model: prisma.topic },
      { name: 'votes', model: prisma.vote }
    ]

    for (const table of tables) {
      try {
        const count = await table.model.count()
        console.log(`✅ ${table.name} table exists with ${count} records`)
      } catch (error) {
        console.log(`❌ ${table.name} table issue:`, error.message)
      }
    }

    return true

  } catch (error) {
    console.log('❌ Database connection failed:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// Run the check
checkDatabaseStatus()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })