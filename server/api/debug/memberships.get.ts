import { promises as fs } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    const userId = (user as any).id || (user as any).email
    
    const membershipsPath = join(process.cwd(), 'data', 'platform', 'memberships.json')
    const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
    const memberships = JSON.parse(membershipsData)
    
    const userMemberships = memberships.filter((m: any) => m.userId === userId)
    const allUserIds = [...new Set(memberships.map((m: any) => m.userId))]
    
    return {
      success: true,
      currentUserId: userId,
      userMemberships,
      allUserIds,
      totalMemberships: memberships.length,
      debug: {
        userExists: userMemberships.length > 0,
        membershipCount: userMemberships.length
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})
