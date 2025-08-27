import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Check if user is super admin
  if ((user as any).globalRole !== 'SuperAdmin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Super admin access required'
    })
  }

  try {
    const backupDir = join(process.cwd(), 'backups')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = join(backupDir, `backup-${timestamp}`)
    
    // Ensure backup directory exists
    try {
      await fs.access(backupDir)
    } catch {
      await fs.mkdir(backupDir, { recursive: true })
    }

    // Create backup directory
    await fs.mkdir(backupPath, { recursive: true })

    // Copy data directory to backup
    const dataPath = join(process.cwd(), 'data')
    await copyDirectory(dataPath, join(backupPath, 'data'))

    // Create backup metadata
    const metadata = {
      backupDate: new Date().toISOString(),
      backupBy: (user as any).email,
      version: '1.0.0', // You could read this from package.json
      type: 'manual'
    }

    await fs.writeFile(
      join(backupPath, 'backup-metadata.json'), 
      JSON.stringify(metadata, null, 2)
    )

    logger.info(`Platform backup created by super admin ${(user as any).email} at ${backupPath}`)
    
    return {
      success: true,
      message: 'Backup created successfully',
      backupPath: backupPath,
      backupDate: metadata.backupDate
    }
  } catch (error) {
    logger.error('Error creating backup:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create backup'
    })
  }
})

// Helper function to recursively copy directories
async function copyDirectory(src: string, dest: string) {
  try {
    await fs.access(src)
  } catch {
    // Source doesn't exist, skip
    return
  }

  await fs.mkdir(dest, { recursive: true })
  
  const entries = await fs.readdir(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}
