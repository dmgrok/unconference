export interface EmailPreferences {
  eventSummaries: boolean
  collaborationReminders: boolean
  networkingFollowUp: boolean
  weeklyDigest: boolean
  eventInvitations: boolean
}

export const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
  eventSummaries: true,
  collaborationReminders: true,
  networkingFollowUp: true,
  weeklyDigest: true,
  eventInvitations: true
}

/**
 * Parse email preferences from database string format
 */
export function parseEmailPreferences(preferencesJson: string | null): EmailPreferences {
  if (!preferencesJson) {
    return DEFAULT_EMAIL_PREFERENCES
  }

  try {
    const parsed = JSON.parse(preferencesJson)
    return {
      eventSummaries: parsed.eventSummaries ?? DEFAULT_EMAIL_PREFERENCES.eventSummaries,
      collaborationReminders: parsed.collaborationReminders ?? DEFAULT_EMAIL_PREFERENCES.collaborationReminders,
      networkingFollowUp: parsed.networkingFollowUp ?? DEFAULT_EMAIL_PREFERENCES.networkingFollowUp,
      weeklyDigest: parsed.weeklyDigest ?? DEFAULT_EMAIL_PREFERENCES.weeklyDigest,
      eventInvitations: parsed.eventInvitations ?? DEFAULT_EMAIL_PREFERENCES.eventInvitations
    }
  } catch (error) {
    console.warn('Failed to parse email preferences:', error)
    return DEFAULT_EMAIL_PREFERENCES
  }
}

/**
 * Serialize email preferences to database string format
 */
export function serializeEmailPreferences(preferences: EmailPreferences): string {
  return JSON.stringify(preferences)
}

/**
 * Check if a user has opted into a specific email type
 */
export function canSendEmail(
  userPreferences: string | null | EmailPreferences,
  emailType: keyof EmailPreferences
): boolean {
  let preferences: EmailPreferences

  if (typeof userPreferences === 'string' || userPreferences === null) {
    preferences = parseEmailPreferences(userPreferences)
  } else {
    preferences = userPreferences
  }

  return preferences[emailType] === true
}

/**
 * Update specific email preference
 */
export function updateEmailPreference(
  currentPreferences: string | null,
  emailType: keyof EmailPreferences,
  value: boolean
): string {
  const preferences = parseEmailPreferences(currentPreferences)
  preferences[emailType] = value
  return serializeEmailPreferences(preferences)
}

/**
 * Get user-friendly labels for email preference types
 */
export function getEmailPreferenceLabels(): Record<keyof EmailPreferences, string> {
  return {
    eventSummaries: 'Post-event summaries with connections and achievements',
    collaborationReminders: 'Follow-up reminders for pending collaborations',
    networkingFollowUp: 'Networking opportunities and suggestions',
    weeklyDigest: 'Weekly digest of community activity',
    eventInvitations: 'Invitations to new events and unconferences'
  }
}

/**
 * Get user-friendly descriptions for email preference types
 */
export function getEmailPreferenceDescriptions(): Record<keyof EmailPreferences, string> {
  return {
    eventSummaries: 'Receive detailed summaries after events including your new connections, collaborations, and achievements',
    collaborationReminders: 'Get reminded about pending action items and opportunities to follow up with collaborators',
    networkingFollowUp: 'Receive suggestions for expanding your network and making new professional connections',
    weeklyDigest: 'Stay updated with weekly summaries of community activity, new events, and trending topics',
    eventInvitations: 'Be notified about new unconferences, workshops, and networking events in your areas of interest'
  }
}