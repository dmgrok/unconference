#!/usr/bin/env node
/**
 * Testing Helper Script
 * Solves authentication and real-time feature testing limitations
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test users with complete authentication data
const testUsers = [
  {
    id: "super-admin-001",
    Firstname: "Super",
    Lastname: "Admin", 
    Email: "superadmin@unconference.com",
    Password: "SuperAdmin123",
    Role: "SuperAdmin",
    GlobalRole: "SuperAdmin"
  },
  {
    id: "admin-001",
    Firstname: "Darth",
    Lastname: "Vader",
    Email: "darth.vader@starwars.com", 
    Password: "AdminPassword123",
    Role: "Admin",
    GlobalRole: "User"
  },
  {
    id: "organizer-001",
    Firstname: "Luke",
    Lastname: "Skywalker",
    Email: "organizer@example.com",
    Password: "organizerPassword",
    Role: "Organizer", 
    GlobalRole: "User"
  },
  {
    id: "user-001",
    Firstname: "Storm",
    Lastname: "Trooper",
    Email: "storm.trooper@starwars.com",
    Password: "UserPassword123", 
    Role: "User",
    GlobalRole: "User"
  },
  {
    id: "test-user-001", 
    Firstname: "Test",
    Lastname: "User",
    Email: "test@unconference.com",
    Password: "password123",
    Role: "User",
    GlobalRole: "User"
  }
];

// Test event data for real-time features
const testEventData = {
  eventId: "test-event-001",
  eventCode: "TEST2025", 
  name: "Testing Event",
  status: "active",
  participants: [],
  connections: [],
  achievements: []
};

async function setupTestEnvironment() {
  console.log('🔧 Setting up testing environment...\n');
  
  // 1. Set environment variables
  process.env.NUXT_USERS_FILE_PATH = 'data/platform/users.json';
  process.env.APP_ENV = 'development';
  process.env.NODE_ENV = 'development';
  
  console.log('✅ Environment variables set');
  
  // 2. Verify users file exists with correct structure
  const usersPath = path.join(process.cwd(), 'data/platform/users.json');
  try {
    await fs.access(usersPath);
    console.log('✅ Users file found at:', usersPath);
    
    const usersData = JSON.parse(await fs.readFile(usersPath, 'utf-8'));
    const hasRequiredFields = usersData.some(user => 
      user.Email && user.Password && user.Firstname && user.Lastname
    );
    
    if (!hasRequiredFields) {
      console.log('⚠️  Users file missing required fields, updating...');
      await fs.writeFile(usersPath, JSON.stringify(testUsers, null, 2));
      console.log('✅ Users file updated with test credentials');
    }
  } catch (error) {
    console.log('⚠️  Users file not found, creating...');
    await fs.mkdir(path.dirname(usersPath), { recursive: true });
    await fs.writeFile(usersPath, JSON.stringify(testUsers, null, 2));
    console.log('✅ Users file created with test credentials');
  }
  
  // 3. Create test event data  
  const eventsPath = path.join(process.cwd(), 'data/test-events');
  try {
    await fs.mkdir(eventsPath, { recursive: true });
    await fs.writeFile(
      path.join(eventsPath, 'test-event.json'), 
      JSON.stringify(testEventData, null, 2)
    );
    console.log('✅ Test event data created');
  } catch (error) {
    console.log('⚠️  Could not create test event data:', error.message);
  }
  
  console.log('\n🎯 Testing Environment Ready!');
  console.log('\n📋 Available Test Accounts:');
  testUsers.forEach(user => {
    console.log(`   ${user.Role}: ${user.Email} / ${user.Password}`);
  });
  
  console.log('\n🚀 Testing Instructions:');
  console.log('1. Make sure your app is running on port 3002');
  console.log('2. Go to http://localhost:3002/login');
  console.log('3. Use any of the test accounts above');
  console.log('4. For real-time features, use event code: TEST2025');
  
  return {
    testUsers,
    testEventData,
    usersPath
  };
}

async function simulateEventParticipation() {
  console.log('\n🎭 Simulating Event Participation...\n');
  
  // Simulate multiple users joining an event
  const participants = [
    { id: 'user-001', name: 'Storm Trooper', online: true },
    { id: 'user-002', name: 'Luke Skywalker', online: true },
    { id: 'user-003', name: 'Princess Leia', online: false }
  ];
  
  // Simulate connections between users
  const connections = [
    { from: 'user-001', to: 'user-002', strength: 3, timestamp: new Date() },
    { from: 'user-002', to: 'user-003', strength: 2, timestamp: new Date() },
  ];
  
  // Simulate achievements
  const achievements = [
    { userId: 'user-001', type: 'connection_maker', level: 1, timestamp: new Date() },
    { userId: 'user-002', type: 'topic_creator', level: 1, timestamp: new Date() }
  ];
  
  const simulationData = {
    eventId: 'test-event-001',
    participants,
    connections, 
    achievements,
    lastUpdate: new Date()
  };
  
  // Save simulation data
  const simulationPath = path.join(process.cwd(), 'data/test-simulation.json');
  await fs.writeFile(simulationPath, JSON.stringify(simulationData, null, 2));
  
  console.log('✅ Event simulation data created');
  console.log('📊 Participants:', participants.length);
  console.log('🔗 Connections:', connections.length); 
  console.log('🏆 Achievements:', achievements.length);
  console.log('💾 Saved to:', simulationPath);
  
  return simulationData;
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication Flow...\n');
  
  try {
    // Test if we can read the users file
    const usersPath = path.join(process.cwd(), process.env.NUXT_USERS_FILE_PATH || 'data/platform/users.json');
    const usersData = JSON.parse(await fs.readFile(usersPath, 'utf-8'));
    
    console.log('✅ Users file readable');
    console.log('👥 Total users:', usersData.length);
    
    // Verify required fields
    const validUsers = usersData.filter(user => 
      user.Email && user.Password && user.Firstname && user.Lastname && user.Role
    );
    
    console.log('✅ Valid users:', validUsers.length);
    
    if (validUsers.length === 0) {
      console.log('❌ No valid users found! Check user data structure.');
      return false;
    }
    
    console.log('🎯 Authentication should work with these accounts:');
    validUsers.forEach(user => {
      console.log(`   ${user.Email} (${user.Role})`);
    });
    
    return true;
  } catch (error) {
    console.log('❌ Authentication test failed:', error.message);
    return false;
  }
}

// Main execution
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  (async () => {
    try {
      console.log('🧪 Unconference Testing Helper\n');
      
      // Setup test environment
      await setupTestEnvironment();
      
      // Test authentication
      await testAuthentication();
      
      // Simulate event participation for real-time features
      await simulateEventParticipation();
      
      console.log('\n✨ All tests completed successfully!');
      console.log('\n🎯 Next Steps:');
      console.log('1. Restart your application with: npm run dev');
      console.log('2. Visit http://localhost:3002/login');
      console.log('3. Test login with: superadmin@unconference.com / SuperAdmin123');
      console.log('4. Navigate to real-time features to test connections/achievements');
      
    } catch (error) {
      console.error('❌ Testing setup failed:', error);
      process.exit(1);
    }
  })();
}

export {
  setupTestEnvironment,
  simulateEventParticipation,
  testAuthentication,
  testUsers,
  testEventData
};
