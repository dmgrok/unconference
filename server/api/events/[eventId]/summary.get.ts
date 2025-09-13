// Phase 1 API: Post-Event Connection & Collaboration Summary
import prisma from '~/lib/database'

const db = prisma as any

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const { eventId } = getRouterParams(event)
  const query = getQuery(event)
  
  if (method !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const { userId, format = 'json' } = query

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'userId is required'
    })
  }

  const summary = await generateEventSummary(eventId as string, userId as string)
  
  if (format === 'email') {
    return generateEmailSummary(summary)
  }
  
  return summary
})

async function generateEventSummary(eventId: string, userId: string) {
  // Get event details
  const eventDetails = await db.event.findUnique({
    where: { id: eventId },
    select: {
      name: true,
      description: true,
      date: true,
      location: true
    }
  })

  // Get user's connections from this event
  const connections = await db.eventConnection.findMany({
    where: {
      eventId,
      OR: [
        { participantAId: userId },
        { participantBId: userId }
      ]
    },
    include: {
      participantA: {
        select: { 
          id: true, 
          name: true, 
          avatar: true,
          linkedinUrl: true,
          twitterHandle: true,
          websiteUrl: true,
          bio: true,
          skills: true,
          interests: true,
          allowContactSharing: true
        }
      },
      participantB: {
        select: { 
          id: true, 
          name: true, 
          avatar: true,
          linkedinUrl: true,
          twitterHandle: true,
          websiteUrl: true,
          bio: true,
          skills: true,
          interests: true,
          allowContactSharing: true
        }
      }
    }
  })

  // Get collaborations the user participated in
  const collaborations = await db.collaborationSpace.findMany({
    where: {
      eventId,
      contributors: { contains: userId }
    },
    include: {
      resources: {
        select: {
          title: true,
          url: true,
          resourceType: true
        }
      },
      actionItems: {
        select: {
          task: true,
          assignedTo: true,
          status: true,
          dueDate: true
        }
      }
    }
  })

  // Get work showcases the user was involved in
  const workShowcases = await db.workShowcase.findMany({
    where: {
      eventId,
      contributors: { contains: userId }
    },
    select: {
      projectName: true,
      description: true,
      status: true,
      skillsUsed: true,
      skillsNeeded: true,
      contactEmail: true,
      repositoryUrl: true,
      demoUrl: true
    }
  })

  // Get achievements earned at this event
  const achievements = await db.userAchievement.findMany({
    where: {
      userId,
      eventId
    },
    select: {
      achievementType: true,
      earnedAt: true,
      metadata: true
    }
  })

  // Process connections data
  const processedConnections = connections.map(conn => {
    const otherPerson = conn.participantAId === userId ? conn.participantB : conn.participantA
    return {
      connectionId: conn.id,
      person: {
        id: otherPerson.id,
        name: otherPerson.name,
        avatar: otherPerson.avatar,
        bio: otherPerson.bio,
        skills: parseJsonField(otherPerson.skills),
        interests: parseJsonField(otherPerson.interests),
        contact: otherPerson.allowContactSharing ? {
          linkedin: otherPerson.linkedinUrl,
          twitter: otherPerson.twitterHandle,
          website: otherPerson.websiteUrl
        } : null
      },
      sharedTopics: parseJsonField(conn.sharedTopics),
      collaboratedOn: parseJsonField(conn.collaboratedOn),
      connectionStrength: conn.connectionStrength
    }
  })

  // Process collaborations
  const processedCollaborations = collaborations.map(collab => ({
    id: collab.id,
    name: collab.name,
    description: collab.description,
    contributors: parseJsonField(collab.contributors),
    resourcesCount: collab.resources.length,
    actionItemsCount: collab.actionItems.length,
    pendingActionItems: collab.actionItems.filter((item: any) => item.status !== 'COMPLETED').length
  }))

  // Process showcases
  const processedShowcases = workShowcases.map(showcase => ({
    projectName: showcase.projectName,
    description: showcase.description,
    status: showcase.status,
    skillsUsed: parseJsonField(showcase.skillsUsed),
    skillsNeeded: parseJsonField(showcase.skillsNeeded),
    contactEmail: showcase.contactEmail,
    repositoryUrl: showcase.repositoryUrl,
    demoUrl: showcase.demoUrl
  }))

  // Generate follow-up suggestions
  const followUpSuggestions = generateFollowUpSuggestions(
    processedConnections,
    processedCollaborations,
    processedShowcases
  )

  return {
    event: {
      name: eventDetails?.name || 'Unconference Event',
      date: eventDetails?.date,
      location: eventDetails?.location
    },
    summary: {
      connectionsCount: processedConnections.length,
      collaborationsCount: processedCollaborations.length,
      projectsCount: processedShowcases.length,
      achievementsCount: achievements.length
    },
    connections: processedConnections,
    collaborations: processedCollaborations,
    projects: processedShowcases,
    achievements: achievements.map(a => ({
      type: a.achievementType,
      earnedAt: a.earnedAt,
      metadata: parseJsonField(a.metadata)
    })),
    followUpSuggestions,
    generatedAt: new Date()
  }
}

function generateFollowUpSuggestions(connections: any[], collaborations: any[], showcases: any[]) {
  const suggestions = []

  // LinkedIn connection suggestions
  const contactableConnections = connections.filter(c => c.person.contact?.linkedin)
  if (contactableConnections.length > 0) {
    suggestions.push({
      type: 'linkedin-connections',
      title: `Connect with ${contactableConnections.length} new contacts on LinkedIn`,
      description: 'Send personalized connection requests mentioning your shared interests from the event',
      action: 'Connect on LinkedIn',
      count: contactableConnections.length
    })
  }

  // Follow up on collaborations
  const activeCollaborations = collaborations.filter(c => c.pendingActionItems > 0)
  if (activeCollaborations.length > 0) {
    suggestions.push({
      type: 'collaboration-followup',
      title: `Follow up on ${activeCollaborations.length} active collaborations`,
      description: 'Check in with team members and update progress on action items',
      action: 'Review Action Items',
      count: activeCollaborations.length
    })
  }

  // Share projects
  const completedProjects = showcases.filter(p => p.status === 'COMPLETED')
  if (completedProjects.length > 0) {
    suggestions.push({
      type: 'share-projects',
      title: `Share ${completedProjects.length} completed projects`,
      description: 'Post about your projects on social media to attract more collaborators',
      action: 'Share on Social Media',
      count: completedProjects.length
    })
  }

  // Skills-based follow-ups
  const skillsNeeded = showcases.flatMap(p => parseJsonField(p.skillsNeeded)).filter(Boolean)
  const uniqueSkillsNeeded = [...new Set(skillsNeeded)]
  if (uniqueSkillsNeeded.length > 0) {
    suggestions.push({
      type: 'find-skills',
      title: `Find experts in ${uniqueSkillsNeeded.slice(0, 3).join(', ')}`,
      description: 'Reach out to your network or join communities to find people with these skills',
      action: 'Network for Skills',
      skills: uniqueSkillsNeeded
    })
  }

  return suggestions
}

function generateEmailSummary(summary: any) {
  const { event, connections, collaborations, projects, achievements, followUpSuggestions } = summary

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Your ${event.name} Summary</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #667eea; background: #f9f9f9; }
        .connection { background: white; padding: 10px; margin: 10px 0; border-radius: 5px; border: 1px solid #ddd; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; }
        .stat h3 { color: #667eea; margin: 0; }
        .suggestion { background: #e8f4fd; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .cta { background: #667eea; color: white; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎉 Your ${event.name} Summary</h1>
        <p>Amazing things happen when great minds connect!</p>
      </div>

      <div class="stats">
        <div class="stat">
          <h3>${connections.length}</h3>
          <p>New Connections</p>
        </div>
        <div class="stat">
          <h3>${collaborations.length}</h3>
          <p>Collaborations</p>
        </div>
        <div class="stat">
          <h3>${projects.length}</h3>
          <p>Projects</p>
        </div>
        <div class="stat">
          <h3>${achievements.length}</h3>
          <p>Achievements</p>
        </div>
      </div>

      ${connections.length > 0 ? `
        <div class="section">
          <h2>🤝 Your New Connections</h2>
          ${connections.map(conn => `
            <div class="connection">
              <strong>${conn.person.name}</strong>
              ${conn.person.bio ? `<p>${conn.person.bio}</p>` : ''}
              ${conn.sharedTopics.length > 0 ? `<p><strong>Shared interests:</strong> ${conn.sharedTopics.join(', ')}</p>` : ''}
              ${conn.person.contact ? `
                <p><strong>Connect:</strong> 
                  ${conn.person.contact.linkedin ? `<a href="${conn.person.contact.linkedin}">LinkedIn</a>` : ''}
                  ${conn.person.contact.twitter ? ` | <a href="https://twitter.com/${conn.person.contact.twitter}">Twitter</a>` : ''}
                  ${conn.person.contact.website ? ` | <a href="${conn.person.contact.website}">Website</a>` : ''}
                </p>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${followUpSuggestions.length > 0 ? `
        <div class="section">
          <h2>📋 Follow-Up Actions</h2>
          ${followUpSuggestions.map(suggestion => `
            <div class="suggestion">
              <strong>${suggestion.title}</strong>
              <p>${suggestion.description}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="cta">
        <h3>Keep the momentum going!</h3>
        <p>Join our next unconference and continue building amazing connections.</p>
        <a href="https://unconference.app" style="color: white; text-decoration: none;">Find Your Next Event →</a>
      </div>
    </body>
    </html>
  `

  return {
    format: 'email',
    subject: `Your ${event.name} Summary - ${connections.length} connections, ${collaborations.length} collaborations`,
    html,
    text: generateTextSummary(summary)
  }
}

function generateTextSummary(summary: any) {
  const { event, connections, collaborations, projects, achievements } = summary
  
  return `
Your ${event.name} Summary

📊 Quick Stats:
- ${connections.length} new connections
- ${collaborations.length} collaborations started
- ${projects.length} projects involved in
- ${achievements.length} achievements unlocked

${connections.length > 0 ? `
🤝 New Connections:
${connections.map(conn => `
- ${conn.person.name}${conn.person.bio ? ` - ${conn.person.bio}` : ''}
  Shared interests: ${conn.sharedTopics.join(', ') || 'None specified'}
`).join('')}
` : ''}

Keep building amazing connections at your next unconference!
Visit: https://unconference.app
  `.trim()
}

function parseJsonField(field: string | null): any[] {
  if (!field) return []
  try {
    return JSON.parse(field)
  } catch {
    return []
  }
}
