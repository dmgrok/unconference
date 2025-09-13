import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createMoreTestUsers() {
  console.log('Creating additional test users...')
  
  try {
    const users = []
    
    for (let i = 3; i <= 6; i++) {
      const user = await prisma.user.upsert({
        where: { email: `test-user-${i}@example.com` },
        update: {},
        create: {
          id: `test-user-${i}`,
          email: `test-user-${i}@example.com`,
          name: `Test User ${i}`
        }
      })
      users.push(user)
      console.log(`✅ Created: ${user.name}`)
    }
    
    console.log(`\n✅ Created ${users.length} additional test users`)
    
  } catch (error) {
    console.error('❌ Error creating test users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMoreTestUsers()
