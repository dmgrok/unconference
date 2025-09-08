#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function addTestUsers() {
  console.log('Adding test users to database...')

  try {
    // Hash the passwords
    const superAdminPassword = await bcrypt.hash('SuperAdmin123', 12)
    const organizerPassword = await bcrypt.hash('organizerPassword', 12)
    const adminPassword = await bcrypt.hash('AdminPassword123', 12)
    const userPassword = await bcrypt.hash('UserPassword123', 12)

    // Create Super Admin
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@unconference.com' },
      update: {},
      create: {
        email: 'superadmin@unconference.com',
        name: 'Super Admin',
        nickname: 'Super Admin',
        passwordHash: superAdminPassword,
        isEmailVerified: true,
        globalRole: 'SUPER_ADMIN'
      }
    })
    console.log('✓ Created Super Admin user')

    // Create Organizer
    const organizer = await prisma.user.upsert({
      where: { email: 'organizer@example.com' },
      update: {},
      create: {
        email: 'organizer@example.com',
        name: 'Luke Skywalker',
        nickname: 'Luke',
        passwordHash: organizerPassword,
        isEmailVerified: true,
        globalRole: 'USER'
      }
    })
    console.log('✓ Created Organizer user')

    // Create Admin
    const admin = await prisma.user.upsert({
      where: { email: 'darth.vader@starwars.com' },
      update: {},
      create: {
        email: 'darth.vader@starwars.com',
        name: 'Darth Vader',
        nickname: 'Darth',
        passwordHash: adminPassword,
        isEmailVerified: true,
        globalRole: 'USER'
      }
    })
    console.log('✓ Created Admin user')

    // Create Regular User
    const user = await prisma.user.upsert({
      where: { email: 'storm.trooper@starwars.com' },
      update: {},
      create: {
        email: 'storm.trooper@starwars.com',
        name: 'Storm Trooper',
        nickname: 'Storm',
        passwordHash: userPassword,
        isEmailVerified: true,
        globalRole: 'USER'
      }
    })
    console.log('✓ Created Regular user')

    console.log('\nTest users created successfully!')
    console.log('You can now login with:')
    console.log('- Super Admin: superadmin@unconference.com / SuperAdmin123')
    console.log('- Organizer: organizer@example.com / organizerPassword')
    console.log('- Admin: darth.vader@starwars.com / AdminPassword123')
    console.log('- User: storm.trooper@starwars.com / UserPassword123')
    console.log('')
    console.log('Note: Event-specific roles (ORGANIZER, MODERATOR, etc.) are assigned')
    console.log('when users join or create events, not at the user level.')

  } catch (error) {
    console.error('Error creating test users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addTestUsers()
