import { promises as fs } from 'fs'
import { join } from 'path'

/**
 * Resolves a user object to the actual user ID from the database
 * @param user The user object from the session
 * @returns The user ID or null if not found
 */
export async function resolveUserId(user: any): Promise<string | null> {
  if (!user) return null
  
  // If user already has an ID that's not an email, use it
  const sessionUserId = user.id
  if (sessionUserId && !sessionUserId.includes('@')) {
    return sessionUserId
  }
  
  // Otherwise, look up by email
  const userEmail = user.email
  if (!userEmail) return null
  
  try {
    const usersPath = join(process.cwd(), 'data', 'platform', 'users.json')
    const usersData = await fs.readFile(usersPath, 'utf-8')
    const users = JSON.parse(usersData)
    
    const foundUser = users.find((u: any) => u.email === userEmail)
    return foundUser?.id || null
  } catch (error) {
    console.error('Error resolving user ID:', error)
    return null
  }
}
