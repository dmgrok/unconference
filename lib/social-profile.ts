import { z } from 'zod'
import prisma from './database'

// Schema for social profile import
export const socialProfileImportSchema = z.object({
  linkedin: z.object({
    headline: z.string().optional(),
    summary: z.string().optional(),
    industry: z.string().optional(),
    location: z.string().optional(),
    skills: z.array(z.string()).optional(),
    experience: z.array(z.object({
      title: z.string(),
      company: z.string(),
      duration: z.string().optional(),
      description: z.string().optional()
    })).optional()
  }).optional(),
  twitter: z.object({
    bio: z.string().optional(),
    location: z.string().optional(),
    website: z.string().optional(),
    followerCount: z.number().optional(),
    tweetCount: z.number().optional()
  }).optional(),
  github: z.object({
    bio: z.string().optional(),
    location: z.string().optional(),
    company: z.string().optional(),
    blog: z.string().optional(),
    publicRepos: z.number().optional(),
    followers: z.number().optional()
  }).optional()
})

export class SocialProfileService {
  /**
   * Import LinkedIn profile data using OAuth token
   */
  static async importLinkedInProfile(accessToken: string, userId: string) {
    try {
      // Fetch basic profile
      const profileResponse = await fetch('https://api.linkedin.com/v2/people/~', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch LinkedIn profile')
      }

      const profile = await profileResponse.json()

      // Fetch skills if available
      let skills: string[] = []
      try {
        const skillsResponse = await fetch('https://api.linkedin.com/v2/people/~/skills', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json()
          skills = skillsData.elements?.map((skill: any) => skill.name) || []
        }
      } catch (error) {
        console.warn('Could not fetch LinkedIn skills:', error)
      }

      // Update user profile with LinkedIn data
      const updateData: any = {}

      if (profile.headline) {
        updateData.bio = profile.headline
      }

      if (skills.length > 0) {
        updateData.skills = skills.join(', ')
      }

      if (profile.location?.name) {
        // Store location in interests for now since we don't have a location field
        const currentInterests = await prisma.user.findUnique({
          where: { id: userId },
          select: { interests: true }
        })

        const interests = currentInterests?.interests ?
          `${currentInterests.interests}, Location: ${profile.location.name}` :
          `Location: ${profile.location.name}`

        updateData.interests = interests
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: updateData
        })
      }

      return {
        success: true,
        imported: Object.keys(updateData),
        profile: {
          headline: profile.headline,
          location: profile.location?.name,
          skills: skills
        }
      }
    } catch (error: any) {
      console.error('LinkedIn profile import error:', error)
      throw new Error('Failed to import LinkedIn profile')
    }
  }

  /**
   * Import Twitter profile data using OAuth token
   */
  static async importTwitterProfile(accessToken: string, userId: string) {
    try {
      // Fetch Twitter user profile
      const response = await fetch('https://api.twitter.com/2/users/me?user.fields=description,location,url,public_metrics', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Twitter profile')
      }

      const data = await response.json()
      const user = data.data

      // Update user profile with Twitter data
      const updateData: any = {}

      if (user.description && !updateData.bio) {
        updateData.bio = user.description
      }

      if (user.url) {
        updateData.websiteUrl = user.url
      }

      if (user.location) {
        // Store location in interests since we don't have a dedicated location field
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { interests: true }
        })

        const locationInfo = `Location: ${user.location}`
        const interests = currentUser?.interests ?
          `${currentUser.interests}, ${locationInfo}` :
          locationInfo

        updateData.interests = interests
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: updateData
        })
      }

      return {
        success: true,
        imported: Object.keys(updateData),
        profile: {
          description: user.description,
          location: user.location,
          website: user.url,
          metrics: user.public_metrics
        }
      }
    } catch (error: any) {
      console.error('Twitter profile import error:', error)
      throw new Error('Failed to import Twitter profile')
    }
  }

  /**
   * Import GitHub profile data using OAuth token
   */
  static async importGitHubProfile(accessToken: string, userId: string) {
    try {
      // Fetch GitHub user profile
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch GitHub profile')
      }

      const profile = await response.json()

      // Update user profile with GitHub data
      const updateData: any = {}

      if (profile.bio && !updateData.bio) {
        updateData.bio = profile.bio
      }

      if (profile.blog) {
        updateData.websiteUrl = profile.blog
      }

      if (profile.location || profile.company) {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { interests: true }
        })

        let locationInfo = ''
        if (profile.location) locationInfo += `Location: ${profile.location}`
        if (profile.company) {
          locationInfo += locationInfo ? `, Company: ${profile.company}` : `Company: ${profile.company}`
        }

        const interests = currentUser?.interests ?
          `${currentUser.interests}, ${locationInfo}` :
          locationInfo

        updateData.interests = interests
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: updateData
        })
      }

      return {
        success: true,
        imported: Object.keys(updateData),
        profile: {
          bio: profile.bio,
          location: profile.location,
          company: profile.company,
          website: profile.blog,
          publicRepos: profile.public_repos,
          followers: profile.followers
        }
      }
    } catch (error: any) {
      console.error('GitHub profile import error:', error)
      throw new Error('Failed to import GitHub profile')
    }
  }

  /**
   * Get user's connected social accounts
   */
  static async getConnectedAccounts(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        githubId: true,
        googleId: true,
        linkedinId: true,
        twitterId: true
      }
    })

    return {
      github: !!user?.githubId,
      google: !!user?.googleId,
      linkedin: !!user?.linkedinId,
      twitter: !!user?.twitterId
    }
  }

  /**
   * Generate profile import suggestions based on connected accounts
   */
  static async getImportSuggestions(userId: string) {
    const connectedAccounts = await this.getConnectedAccounts(userId)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        bio: true,
        skills: true,
        interests: true,
        websiteUrl: true
      }
    })

    const suggestions: string[] = []

    if (connectedAccounts.linkedin && !user?.skills) {
      suggestions.push('Import skills from LinkedIn')
    }

    if (connectedAccounts.github && !user?.bio) {
      suggestions.push('Import bio from GitHub')
    }

    if (connectedAccounts.twitter && !user?.websiteUrl) {
      suggestions.push('Import website from Twitter')
    }

    if ((connectedAccounts.linkedin || connectedAccounts.github) && !user?.interests) {
      suggestions.push('Import location and company info')
    }

    return suggestions
  }
}