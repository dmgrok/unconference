import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestData() {
  console.log('Creating test data...')
  
  try {
    // Create test users
    const user1 = await prisma.user.upsert({
      where: { email: 'test-user-1@example.com' },
      update: {},
      create: {
        id: 'test-user-1',
        email: 'test-user-1@example.com',
        name: 'Test User 1'
      }
    })
    
    const user2 = await prisma.user.upsert({
      where: { email: 'test-user-2@example.com' },
      update: {},
      create: {
        id: 'test-user-2',
        email: 'test-user-2@example.com',
        name: 'Test User 2'
      }
    })
    
    // Create test event
    const event = await prisma.event.upsert({
      where: { code: 'TEST_EVENT_123' },
      update: {},
      create: {
        id: 'test-event',
        title: 'Test Event',
        description: 'A test event for trying features',
        code: 'TEST_EVENT_123',
        owner: {
          connect: { id: user1.id }
        }
      }
    })
    
    console.log('✅ Test data created:')
    console.log('- User 1:', user1.name)
    console.log('- User 2:', user2.name) 
    console.log('- Event:', event.title)
    
  } catch (error) {
    console.error('❌ Error creating test data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestData()
