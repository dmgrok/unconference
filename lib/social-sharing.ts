import { z } from 'zod'
import prisma from './database'

// Schema for social sharing content
export const shareContentSchema = z.object({
  eventId: z.string(),
  platform: z.enum(['linkedin', 'twitter', 'facebook']),
  template: z.enum(['event_summary', 'connections_made', 'key_learnings', 'collaboration_success', 'custom']),
  customMessage: z.string().optional(),
  includeMetrics: z.boolean().default(true),
  includeHashtags: z.boolean().default(true)
})

export interface ShareableContent {
  message: string
  hashtags: string[]
  mentions: string[]
  imageUrl?: string
  linkUrl?: string
}

export class SocialSharingService {
  /**
   * Generate LinkedIn post content for event sharing
   */
  static async generateLinkedInPost(eventId: string, userId: string, template: string, customMessage?: string): Promise<ShareableContent> {
    const event = await this.getEventWithStats(eventId, userId)

    let message = ''
    const hashtags = ['#unconference', '#networking', '#collaboration']
    const mentions: string[] = []

    switch (template) {
      case 'event_summary':
        message = `Just completed an amazing unconference session: "${event.title}"!

✨ Connected with ${event.connectionCount} new professionals
🎯 Participated in ${event.topicCount} engaging discussions
💡 Discovered valuable insights and potential collaborations

The power of bringing curious minds together is incredible. Looking forward to following up on the connections made and exploring the collaborative opportunities discussed.

${customMessage || ''}`
        break

      case 'connections_made':
        message = `Networking success at "${event.title}"!

🤝 Made ${event.connectionCount} meaningful connections
📈 Expanded my professional network with like-minded individuals
🌟 Each conversation opened new possibilities for collaboration

The quality of connections at unconferences is truly unmatched. When passionate professionals gather to share knowledge freely, magic happens.

${customMessage || ''}`
        break

      case 'key_learnings':
        message = `Key insights from "${event.title}":

🧠 Participated in ${event.topicCount} thought-provoking sessions
💬 Engaged with experts across ${event.skillAreas.join(', ')}
🔄 Shared knowledge while learning from others' experiences

The open, self-organizing format created space for genuine knowledge exchange. Grateful for the opportunity to both teach and learn.

${customMessage || ''}`
        break

      case 'collaboration_success':
        message = `Collaboration opportunities identified at "${event.title}":

🚀 Discovered ${event.collaborationCount} potential project partnerships
🎯 Connected with professionals who share similar goals
💡 Brainstormed solutions to common industry challenges

The unconference format naturally facilitates meaningful professional relationships. Excited to turn these conversations into concrete collaborations.

${customMessage || ''}`
        break

      case 'custom':
        message = customMessage || `Had a great time at "${event.title}"! Connected with amazing professionals and learned so much.`
        break
    }

    // Add event-specific hashtags
    if (event.topics) {
      const topicTags = event.topics.slice(0, 3).map(topic =>
        `#${topic.replace(/\s+/g, '').toLowerCase()}`
      )
      hashtags.push(...topicTags)
    }

    return {
      message,
      hashtags: [...new Set(hashtags)], // Remove duplicates
      mentions,
      linkUrl: event.url
    }
  }

  /**
   * Generate Twitter post content for event sharing
   */
  static async generateTwitterPost(eventId: string, userId: string, template: string, customMessage?: string): Promise<ShareableContent> {
    const event = await this.getEventWithStats(eventId, userId)

    let message = ''
    const hashtags = ['#unconference', '#networking']
    const mentions: string[] = []

    switch (template) {
      case 'event_summary':
        message = `Just wrapped up "${event.title}"! 🎉

✨ ${event.connectionCount} new connections
🎯 ${event.topicCount} amazing discussions
💡 Tons of insights & collaboration ideas

The power of unconferences! 🚀 ${customMessage || ''}`
        break

      case 'connections_made':
        message = `Network expansion success! 🤝

Connected with ${event.connectionCount} incredible professionals at "${event.title}"

Every conversation opened new doors 🚪✨

${customMessage || ''}`
        break

      case 'key_learnings':
        message = `Learning highlights from "${event.title}": 🧠

🔄 Knowledge shared across ${event.skillAreas.slice(0, 2).join(' & ')}
💬 ${event.topicCount} engaging sessions
🌟 So many "aha!" moments

${customMessage || ''}`
        break

      case 'collaboration_success':
        message = `Collaboration gold! ⚡

Found ${event.collaborationCount} potential partnerships at "${event.title}"

When passionate people connect, magic happens ✨

${customMessage || ''}`
        break

      case 'custom':
        message = customMessage || `Great experience at "${event.title}"! Amazing people, great conversations 🎉`
        break
    }

    // Add relevant hashtags based on topics
    if (event.topics) {
      const topicTags = event.topics.slice(0, 2).map(topic =>
        `#${topic.replace(/\s+/g, '').toLowerCase()}`
      )
      hashtags.push(...topicTags)
    }

    return {
      message,
      hashtags: [...new Set(hashtags)],
      mentions,
      linkUrl: event.url
    }
  }

  /**
   * Generate Facebook post content for event sharing
   */
  static async generateFacebookPost(eventId: string, userId: string, template: string, customMessage?: string): Promise<ShareableContent> {
    const event = await this.getEventWithStats(eventId, userId)

    let message = ''
    const hashtags = ['#unconference', '#professionalnetworking']
    const mentions: string[] = []

    switch (template) {
      case 'event_summary':
        message = `What an incredible experience at "${event.title}"!

I had the opportunity to connect with ${event.connectionCount} amazing professionals and participate in ${event.topicCount} thought-provoking discussions. The unconference format really allows for genuine, organic conversations that lead to meaningful connections.

Some highlights:
• Met experts in ${event.skillAreas.slice(0, 3).join(', ')}
• Discovered ${event.collaborationCount} potential collaboration opportunities
• Shared knowledge while learning from others' unique perspectives

There's something special about gathering with like-minded individuals who are passionate about learning and sharing. Looking forward to following up on all the great connections made!

${customMessage || ''}`
        break

      case 'connections_made':
        message = `Networking success story!

Just completed "${event.title}" and made ${event.connectionCount} fantastic new professional connections. The quality of conversations at unconferences is truly unmatched - when you bring together curious, engaged people in an open format, real relationships form naturally.

Each conversation opened up new perspectives and possibilities. I'm already planning follow-ups with several new connections who share similar interests and goals.

${customMessage || ''}`
        break

      case 'key_learnings':
        message = `Learning and growth at "${event.title}"!

Participated in ${event.topicCount} sessions covering topics like ${event.skillAreas.slice(0, 3).join(', ')}. The beauty of unconferences is the two-way knowledge exchange - I learned so much while also being able to share my own experiences.

Key takeaways:
• Fresh perspectives on familiar challenges
• New approaches to problem-solving
• Valuable insights from diverse backgrounds

The collaborative learning environment really brings out the best in everyone.

${customMessage || ''}`
        break

      case 'collaboration_success':
        message = `Collaboration opportunities galore!

"${event.title}" delivered on its promise of bringing together professionals ready to collaborate. I identified ${event.collaborationCount} potential partnerships and project opportunities.

The unconference format naturally creates space for:
• Open discussion of challenges and solutions
• Honest sharing of resources and expertise
• Genuine interest in mutual support

Excited to turn these conversations into concrete collaborations!

${customMessage || ''}`
        break

      case 'custom':
        message = customMessage || `Had an amazing time at "${event.title}"! So grateful for the opportunity to connect with incredible professionals and learn from their experiences. The unconference format really facilitates meaningful conversations.`
        break
    }

    return {
      message,
      hashtags,
      mentions,
      linkUrl: event.url
    }
  }

  /**
   * Get event statistics for content generation
   */
  private static async getEventWithStats(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        topics: {
          select: { title: true }
        },
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: { skills: true }
            }
          }
        }
      }
    })

    if (!event) {
      throw new Error('Event not found')
    }

    // Get user's connections from this event
    const connections = await prisma.eventConnection.count({
      where: {
        eventId: eventId,
        OR: [
          { participantAId: userId },
          { participantBId: userId }
        ]
      }
    })

    // Get collaboration count
    const collaborations = await prisma.connectionCollaboration.count({
      where: {
        connection: {
          eventId: eventId,
          OR: [
            { participantAId: userId },
            { participantBId: userId }
          ]
        }
      }
    })

    // Extract unique skills from all participants
    const allSkills = event.memberships
      .map(m => m.user.skills)
      .filter(Boolean)
      .flatMap(skills => skills!.split(',').map(s => s.trim()))

    const uniqueSkills = [...new Set(allSkills)].slice(0, 5)

    return {
      title: event.title,
      url: `/events/${event.id}`,
      connectionCount: connections,
      collaborationCount: collaborations,
      topicCount: event.topics.length,
      topics: event.topics.map(t => t.title),
      skillAreas: uniqueSkills
    }
  }

  /**
   * Generate share URLs for different platforms
   */
  static generateShareUrls(content: ShareableContent, platform: string): string {
    const encodedMessage = encodeURIComponent(content.message)
    const encodedHashtags = encodeURIComponent(content.hashtags.join(' '))
    const encodedUrl = content.linkUrl ? encodeURIComponent(content.linkUrl) : ''

    switch (platform) {
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedMessage}`

      case 'twitter':
        const twitterText = `${content.message} ${content.hashtags.join(' ')}`
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodedUrl}`

      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`

      default:
        throw new Error('Unsupported platform')
    }
  }

  /**
   * Get sharing analytics for an event
   */
  static async getSharingStats(eventId: string) {
    // This would track sharing activities if we implement analytics
    // For now, return placeholder data
    return {
      totalShares: 0,
      platformBreakdown: {
        linkedin: 0,
        twitter: 0,
        facebook: 0
      },
      engagementRate: 0
    }
  }
}