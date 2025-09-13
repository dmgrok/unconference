// Test script for achievement system
async function testAchievements() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('Testing Achievement System...');
  
  try {
    // Test 1: Get user achievements
    console.log('\n1. Getting user achievements...');
    const userResponse = await fetch(`${baseUrl}/api/achievements/user/test-user-1`);
    const userAchievements = await userResponse.json();
    console.log('User achievements:', userAchievements);
    
    // Test 2: Create a connection to trigger achievements
    console.log('\n2. Creating a test connection...');
    const connectionResponse = await fetch(`${baseUrl}/api/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUserId: 'test-user-1',
        toUserId: 'test-user-2',
        eventId: 'test-event',
        type: 'MUTUAL_INTEREST',
        metadata: { topic: 'AI and Technology' }
      })
    });
    const connection = await connectionResponse.json();
    console.log('Connection created:', connection);
    
    // Test 3: Check if achievements were triggered
    console.log('\n3. Checking for new achievements...');
    const updatedUserResponse = await fetch(`${baseUrl}/api/achievements/user/test-user-1`);
    const updatedUserAchievements = await updatedUserResponse.json();
    console.log('Updated user achievements:', updatedUserAchievements);
    
    // Test 4: Get achievement leaderboard
    console.log('\n4. Getting achievement leaderboard...');
    const leaderboardResponse = await fetch(`${baseUrl}/api/achievements/leaderboard`);
    const leaderboard = await leaderboardResponse.json();
    console.log('Achievement leaderboard:', leaderboard);
    
    // Test 5: Generate event summary
    console.log('\n5. Generating event summary...');
    const summaryResponse = await fetch(`${baseUrl}/api/summary/test-event`);
    const summary = await summaryResponse.json();
    console.log('Event summary:', summary);
    
    console.log('\n✅ Achievement system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAchievements();
