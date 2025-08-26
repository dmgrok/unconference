import { migrationService } from '../utils/migrationService'
import logger from '../utils/logger'

async function runMigration() {
  try {
    logger.info('Starting migration to multi-event platform...')
    await migrationService.migrateToMultiEvent()
    logger.info('Migration completed successfully!')
    
    logger.info('Migration summary:')
    logger.info('- Created platform data structure')
    logger.info('- Migrated existing data to default event')
    logger.info('- Set up user memberships')
    logger.info('- Ready for multi-event operation')
    
  } catch (error) {
    logger.error('Migration failed:', error)
    
    const shouldRollback = process.argv.includes('--rollback-on-error')
    if (shouldRollback) {
      logger.info('Rolling back migration...')
      try {
        await migrationService.rollback()
        logger.info('Rollback completed')
      } catch (rollbackError) {
        logger.error('Rollback failed:', rollbackError)
      }
    }
    
    process.exit(1)
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
}

export { runMigration }
