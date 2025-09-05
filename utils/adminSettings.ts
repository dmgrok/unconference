import { promises as fs } from 'fs'
import { join } from 'path'

export interface AdminSettings {
  maxVotesPerTopic: number
  topTopicsCount: number
  showVoterNames: boolean
  allowTopicSubmission: boolean
  autoStartNewRound: boolean
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const settingsPath = join(process.cwd(), 'data', 'admin-settings.json')
  
  try {
    const settingsData = await fs.readFile(settingsPath, 'utf-8')
    return JSON.parse(settingsData)
  } catch (error) {
    // Return default settings if file doesn't exist
    const config = useRuntimeConfig()
    return {
      maxVotesPerTopic: config.public.maxVotesPerTopic || 12,
      topTopicsCount: config.public.topTopicsCount || 10,
      showVoterNames: true,
      allowTopicSubmission: true,
      autoStartNewRound: false
    }
  }
}
