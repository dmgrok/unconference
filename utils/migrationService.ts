import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../utils/logger'
import type { Event } from '../types/event'
import type { User, UserEventRole } from '../types/user'

export class MigrationService {
  private dataPath = join(process.cwd(), 'data')
  private platformPath = join(this.dataPath, 'platform')
  private eventsPath = join(this.dataPath, 'events')

  async migrateToMultiEvent(): Promise<void> {
    logger.info('Starting migration to multi-event platform...')

    try {
      // Create new directory structure
      await this.createDirectories()

      // Migrate existing data to first event
      const defaultEvent = await this.createDefaultEvent()
      
      // Migrate users
      await this.migrateUsers()
      
      // Migrate event data
      await this.migrateEventData(defaultEvent.id)
      
      // Create default memberships
      await this.createDefaultMemberships(defaultEvent.id)

      logger.info('Migration completed successfully!')
    } catch (error) {
      logger.error('Migration failed:', error)
      throw error
    }
  }

  private async createDirectories(): Promise<void> {
    await fs.mkdir(this.platformPath, { recursive: true })
    await fs.mkdir(this.eventsPath, { recursive: true })
  }

  private async createDefaultEvent(): Promise<Event> {
    const defaultEvent: Event = {
      id: 'default_event_001',
      code: 'LEGACY01',
      name: 'Legacy Unconference Event',
      description: 'Migrated from single-event setup',
      organizerId: 'darth.vader@starwars.com', // Default admin from users-sample.json
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true,
      settings: {
        maxVotesPerTopic: 12,
        topTopicsCount: 10,
        showVoterNames: true,
        allowTopicSubmission: true,
        autoStartNewRound: false,
        allowGuestAccess: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Save to events list
    const eventsPath = join(this.platformPath, 'events.json')
    await fs.writeFile(eventsPath, JSON.stringify([defaultEvent], null, 2))

    // Create event directory with migrated data
    const eventDir = join(this.eventsPath, defaultEvent.id)
    await fs.mkdir(eventDir, { recursive: true })

    logger.info(`Created default event: ${defaultEvent.name} (${defaultEvent.id})`)
    return defaultEvent
  }

  private async migrateUsers(): Promise<void> {
    try {
      // Read existing users
      const usersFilePath = join(this.dataPath, 'users-sample.json')
      const usersData = await fs.readFile(usersFilePath, 'utf-8')
      const legacyUsers = JSON.parse(usersData)

      // Convert to new user format
      const users: User[] = legacyUsers.map((user: any) => ({
        id: user.Email,
        name: `${user.Firstname} ${user.Lastname}`,
        email: user.Email,
        globalRole: user.Role === 'Admin' ? 'SuperAdmin' : 'User',
        isActive: true,
        createdAt: new Date(),
        lastLoginAt: new Date()
      }))

      // Save to platform users
      const platformUsersPath = join(this.platformPath, 'users.json')
      await fs.writeFile(platformUsersPath, JSON.stringify(users, null, 2))

      logger.info(`Migrated ${users.length} users`)
    } catch (error) {
      logger.warn('No existing users file found, skipping user migration')
    }
  }

  private async migrateEventData(eventId: string): Promise<void> {
    const eventDir = join(this.eventsPath, eventId)
    
    // Files to migrate
    const filesToMigrate = [
      'admin-settings.json',
      'topics-sample.json',
      'rooms.json',
      'active-round.json',
      'round-history.json',
      'current-groups.json'
    ]

    for (const fileName of filesToMigrate) {
      try {
        const sourcePath = join(this.dataPath, fileName)
        const targetFileName = this.mapFileName(fileName)
        const targetPath = join(eventDir, targetFileName)

        // Check if source file exists
        const fileExists = await fs.access(sourcePath).then(() => true).catch(() => false)
        
        if (fileExists) {
          const data = await fs.readFile(sourcePath, 'utf-8')
          await fs.writeFile(targetPath, data)
          logger.info(`Migrated ${fileName} to ${targetFileName}`)
        } else {
          // Create empty file with default content
          const defaultContent = this.getDefaultContent(targetFileName)
          await fs.writeFile(targetPath, JSON.stringify(defaultContent, null, 2))
          logger.info(`Created default ${targetFileName}`)
        }
      } catch (error) {
        logger.error(`Failed to migrate ${fileName}:`, error)
      }
    }
  }

  private mapFileName(fileName: string): string {
    const mapping: Record<string, string> = {
      'admin-settings.json': 'settings.json',
      'topics-sample.json': 'topics.json',
      'rooms.json': 'rooms.json',
      'active-round.json': 'active-round.json',
      'round-history.json': 'round-history.json',
      'current-groups.json': 'current-groups.json'
    }
    return mapping[fileName] || fileName
  }

  private getDefaultContent(fileName: string): any {
    const defaults: Record<string, any> = {
      'settings.json': {
        maxVotesPerTopic: 12,
        topTopicsCount: 10,
        showVoterNames: true,
        allowTopicSubmission: true,
        autoStartNewRound: false,
        allowGuestAccess: true
      },
      'topics.json': [],
      'rooms.json': [],
      'active-round.json': null,
      'round-history.json': [],
      'current-groups.json': []
    }
    return defaults[fileName] || {}
  }

  private async createDefaultMemberships(eventId: string): Promise<void> {
    try {
      // Read platform users
      const usersPath = join(this.platformPath, 'users.json')
      const usersData = await fs.readFile(usersPath, 'utf-8')
      const users = JSON.parse(usersData) as User[]

      // Create memberships for all users
      const memberships: UserEventRole[] = users.map(user => ({
        userId: user.id,
        eventId,
        role: user.globalRole === 'SuperAdmin' ? 'Organizer' : 'Participant',
        permissions: [],
        joinedAt: new Date()
      }))

      // Save memberships
      const membershipsPath = join(this.platformPath, 'memberships.json')
      await fs.writeFile(membershipsPath, JSON.stringify(memberships, null, 2))

      logger.info(`Created ${memberships.length} default memberships`)
    } catch (error) {
      logger.warn('Failed to create default memberships:', error)
    }
  }

  async rollback(): Promise<void> {
    logger.warn('Rolling back migration...')
    
    try {
      // Remove platform and events directories
      await fs.rm(this.platformPath, { recursive: true, force: true })
      await fs.rm(this.eventsPath, { recursive: true, force: true })
      
      logger.info('Migration rollback completed')
    } catch (error) {
      logger.error('Rollback failed:', error)
      throw error
    }
  }
}

export const migrationService = new MigrationService()
