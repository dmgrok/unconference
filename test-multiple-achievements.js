// Test script for achievement system with multiple users
async function testMultipleConnections() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('Testing Multiple User Achievement System...\n');
  
  try {
    // Test creating connections with different users
    const users = [
      { id: 'test-user-1', name: 'Alice' },
      { id: 'test-user-3', name: 'Bob' },
      { id: 'test-user-4', name: 'Charlie' },
      { id: 'test-user-5', name: 'Diana' }
    ];

    // Create multiple connections for user 1 to trigger more achievements
    console.log('1. Creating connections to trigger achievements...');
    
    for (let i = 1; i < users.length; i++) {
      try {
        const connectionResponse = await fetch(`${baseUrl}/api/connections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromUserId: 'test-user-1',
            toUserId: `test-user-${i + 2}`, // Different user each time
            eventId: 'test-event',
            type: 'MUTUAL_INTEREST',
            metadata: { topic: `Topic ${i}` }
          })
        });
        
        const result = await connectionResponse.json();
        console.log(`   Connection ${i} result:`, result.success ? '✅ Success' : '❌ Failed');
        
      } catch (error) {
        console.log(`   Connection ${i} error:`, error.message);
      }
    }
    
    // Check achievements after all connections
    console.log('\n2. Checking final achievements for test-user-1...');
    const userResponse = await fetch(`${baseUrl}/api/achievements/user/test-user-1`);
    const userAchievements = await userResponse.json();
    
    if (userAchievements.success) {
      console.log(`   Total achievements: ${userAchievements.achievements.length}`);
      userAchievements.achievements.forEach((achievement, index) => {
        console.log(`   ${index + 1}. ${achievement.name} - ${achievement.description}`);
      });
    }
    
    // Check updated leaderboard
    console.log('\n3. Updated leaderboard:');
    const leaderboardResponse = await fetch(`${baseUrl}/api/achievements/leaderboard`);
    const leaderboard = await leaderboardResponse.json();
    
    if (leaderboard.success) {
      leaderboard.leaderboard.forEach((user, index) => {
        console.log(`   ${user.rank}. ${user.userName}: ${user.achievementCount} achievements`);
      });
    }
    
    console.log('\n✅ Multi-user achievement test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMultipleConnections();
