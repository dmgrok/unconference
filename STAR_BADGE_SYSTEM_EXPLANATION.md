# ⭐ Star Badge System Explanation

## What Are the Stars?

The **stars** (⭐) in the unconference app represent **achievement badges** that topics earn based on their performance in voting rounds. They are **NOT related to mentoring** - there is no mentoring system currently implemented in the app.

## How the Star Badge System Works

### 🏆 **Badge Earning Process**
1. **Voting Round**: Users vote on topics throughout a round
2. **Round End**: Admin starts a "New Round" from Settings page
3. **Top Topics Identified**: System finds the top-performing topics by vote count
4. **Badge Award**: Top topics (default: top 10) each receive **1 star badge**
5. **Round Reset**: All votes are reset to 0, but badges are permanent

### ⭐ **Badge Display**
- **Location**: Displayed next to topic titles in both Dashboard and Leaderboard
- **Appearance**: Yellow/warning colored chip with star icon
- **Number**: Shows total badges earned (e.g., "2" means won 2 rounds)
- **Persistence**: Badges accumulate over multiple rounds

### 🔄 **Badge Accumulation**
- **First Round Win**: Topic gets 1 star badge
- **Second Round Win**: Same topic gets 2 star badges (cumulative)
- **Third Round Win**: Same topic gets 3 star badges (cumulative)
- **And so on...**

## Current Badge Configuration

### 📊 **Default Settings**
- **Top Topics Count**: 10 (configurable in admin settings)
- **Badge Limit**: No limit - topics can earn unlimited badges
- **Reset Behavior**: Badges never reset, only votes reset each round

### 🎯 **Badge Criteria**
- **Based on**: Final vote count at round end
- **Tie Handling**: Topics with same votes all get badges
- **Minimum Votes**: No minimum required (even 0 votes can win if it's top 10)

## What You See in the Interface

### 🎪 **Dashboard View**
```
Topic Title ⭐ 2
- Shows topic title with badge chip
- Number indicates how many rounds this topic has won
```

### 🏅 **Leaderboard View**
```
#1 Topic Title ⭐ 2 ✅ Selected for round
- Ranking position
- Topic title
- Badge count (star with number)
- Additional status chips
```

### ⚙️ **Settings Configuration**
- **Top Topics Count**: How many topics get badges each round
- **New Round Action**: Triggers badge awarding process

## Example Scenario

### Round 1:
- "Copilot and MCP servers" gets 15 votes → Wins badge (⭐ 1)
- "GitHub Actions" gets 10 votes → Wins badge (⭐ 1)
- "TDO for IT" gets 5 votes → Wins badge (⭐ 1)

### Round 2:
- "Copilot and MCP servers" gets 20 votes → Wins again (⭐ 2)
- "GitHub Actions" gets 8 votes → Wins again (⭐ 2)
- "New Topic" gets 12 votes → First win (⭐ 1)

## Purpose of Badge System

### 🎯 **Recognition**
- **Topic Quality**: Identifies consistently popular discussion topics
- **Historical Performance**: Shows which topics have been successful over time
- **Community Favorites**: Highlights topics the community finds valuable

### 📈 **Gamification**
- **Achievement**: Gives topics a sense of accomplishment
- **Competition**: Encourages topic creators to submit quality topics
- **Status**: Creates prestige for highly-badged topics

### 📊 **Analytics**
- **Trend Tracking**: See which topics remain popular over time
- **Success Metrics**: Measure topic engagement across rounds
- **Historical Data**: Understand community preferences

## No Mentoring System

**Important**: The star badges are **NOT** related to mentoring. There is currently **no mentoring functionality** in the app. The stars purely represent voting achievement badges earned by topics that perform well in voting rounds.

If mentoring functionality is desired, it would need to be implemented separately with different icons and logic.
