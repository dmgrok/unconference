import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  // Require user session (accessible to all authenticated users)
  const { user } = await requireUserSession(event)
  
  try {
    const groupsPath = join(process.cwd(), 'data', 'current-groups.json')
    
    try {
      const groupsData = await fs.readFile(groupsPath, 'utf-8')
      const groupsInfo = JSON.parse(groupsData)
      
      return {
        success: true,
        hasGroups: true,
        ...groupsInfo
      }
    } catch (error) {
      // File doesn't exist or can't be read
      return {
        success: true,
        hasGroups: false,
        groups: []
      }
    }
  } catch (error) {
    logger.error('Error reading groups:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve group assignments'
    })
  }
})