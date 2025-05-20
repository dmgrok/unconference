import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const topicsPath = join(process.cwd(), config.topicsFilePath)
  try {
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    return JSON.parse(topicsData)
  } catch (error) {
    logger.error('Error reading topics:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch topics'
    })
  }
})
