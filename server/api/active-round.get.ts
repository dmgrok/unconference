import { promises as fs } from 'fs'
import { join } from 'path'
import type { ActiveRound } from '~/types/topic'

export default defineEventHandler(async (event) => {
  const activeRoundPath = join(process.cwd(), 'data', 'active-round.json')
  
  try {
    // Check if active round file exists
    const fileExists = await fs.access(activeRoundPath).then(() => true).catch(() => false)
    
    if (!fileExists) {
      return null
    }
    
    const activeRoundData = await fs.readFile(activeRoundPath, 'utf-8')
    const activeRound = JSON.parse(activeRoundData) as ActiveRound
    
    // Check if round is still active based on start time and duration
    const startTime = new Date(activeRound.startTime)
    const now = new Date()
    const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60)
    
    if (elapsedMinutes >= activeRound.duration) {
      // Round has expired, mark as inactive and re-enable voting
      activeRound.isActive = false
      activeRound.votingDisabled = false
      await fs.writeFile(activeRoundPath, JSON.stringify(activeRound, null, 2))
    }
    
    return activeRound
  } catch (error) {
    console.error('Error reading active round:', error)
    return null
  }
})
