import nodemailer from 'nodemailer'

// Create transporter based on environment
const createTransporter = async () => {
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  } else {
    // For development, use ethereal test account
    const testAccount = await nodemailer.createTestAccount()
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    })
  }
}

// Cache the transporter promise
let transporterPromise: Promise<nodemailer.Transporter> | null = null

const getTransporter = () => {
  if (!transporterPromise) {
    transporterPromise = createTransporter()
  }
  return transporterPromise
}

export class EmailService {
  /**
   * Send verification PIN to user's email
   */
  static async sendVerificationPin(email: string, pin: string, name?: string) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@unconference.app',
        to: email,
        subject: 'Verify your Unconference account - PIN inside',
        html: this.getVerificationEmailTemplate(pin, name),
        text: this.getVerificationEmailText(pin, name)
      }

      if (process.env.NODE_ENV !== 'production') {
        // In development, just log the PIN
        console.log(`
🔐 EMAIL VERIFICATION PIN for ${email}:
PIN: ${pin}
This email would be sent in production.
        `)
        return true
      }

      // In production, send actual email
      const transporter = await this.getTransporter()
      const result = await transporter.sendMail(mailOptions)
      console.log('Verification email sent:', result.messageId)
      return true
    } catch (error) {
      console.error('Failed to send verification email:', error)
      throw new Error('Failed to send verification email')
    }
  }

  /**
   * Send welcome email after successful verification
   */
  static async sendWelcomeEmail(email: string, name: string, nickname: string) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@unconference.app',
        to: email,
        subject: '🎉 Welcome to Unconference!',
        html: this.getWelcomeEmailTemplate(name, nickname),
        text: this.getWelcomeEmailText(name, nickname)
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(`Welcome email would be sent to ${email} (${name})`)
        return true
      }

      const transporter = await this.getTransporter()
      const result = await transporter.sendMail(mailOptions)
      console.log('Welcome email sent:', result.messageId)
      return true
    } catch (error) {
      console.error('Failed to send welcome email:', error)
      // Don't throw error for welcome emails
      return false
    }
  }

  /**
   * Send post-event summary email with connections and collaborations
   */
  static async sendEventSummary(email: string, summary: any) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@unconference.app',
        to: email,
        subject: `Your ${summary.event.name} Summary - ${summary.summary.connectionsCount} connections, ${summary.summary.collaborationsCount} collaborations`,
        html: this.getEventSummaryTemplate(summary),
        text: this.getEventSummaryText(summary)
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(`Event summary email would be sent to ${email} for event: ${summary.event.name}`)
        return true
      }

      const transporter = await this.getTransporter()
      const result = await transporter.sendMail(mailOptions)
      console.log('Event summary email sent:', result.messageId)
      return true
    } catch (error) {
      console.error('Failed to send event summary email:', error)
      throw new Error('Failed to send event summary email')
    }
  }

  /**
   * Send follow-up reminder email for pending collaborations
   */
  static async sendCollaborationReminder(email: string, name: string, collaborations: any[]) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@unconference.app',
        to: email,
        subject: `🤝 Follow-up: ${collaborations.length} collaboration${collaborations.length > 1 ? 's' : ''} waiting for your action`,
        html: this.getCollaborationReminderTemplate(name, collaborations),
        text: this.getCollaborationReminderText(name, collaborations)
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(`Collaboration reminder would be sent to ${email} for ${collaborations.length} collaborations`)
        return true
      }

      const transporter = await this.getTransporter()
      const result = await transporter.sendMail(mailOptions)
      console.log('Collaboration reminder sent:', result.messageId)
      return true
    } catch (error) {
      console.error('Failed to send collaboration reminder:', error)
      // Don't throw error for reminder emails
      return false
    }
  }

  /**
   * Send networking follow-up suggestions email
   */
  static async sendNetworkingFollowUp(email: string, name: string, suggestions: any[]) {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@unconference.app',
        to: email,
        subject: `🌟 ${name}, ${suggestions.length} networking opportunities await!`,
        html: this.getNetworkingFollowUpTemplate(name, suggestions),
        text: this.getNetworkingFollowUpText(name, suggestions)
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(`Networking follow-up would be sent to ${email} with ${suggestions.length} suggestions`)
        return true
      }

      const transporter = await this.getTransporter()
      const result = await transporter.sendMail(mailOptions)
      console.log('Networking follow-up sent:', result.messageId)
      return true
    } catch (error) {
      console.error('Failed to send networking follow-up:', error)
      return false
    }
  }

  private static async getTransporter() {
    return await getTransporter()
  }

  private static getVerificationEmailTemplate(pin: string, name?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .pin-box { background: #F8FAFC; border: 2px solid #6366F1; padding: 20px; text-align: center; border-radius: 12px; margin: 30px 0; }
          .pin { font-size: 36px; font-weight: bold; color: #6366F1; letter-spacing: 4px; }
          .footer { color: #64748B; font-size: 14px; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Verify Your Account</h1>
            <p>Welcome to the Unconference community!</p>
          </div>
          <div class="content">
            <h2>Hi${name ? ` ${name}` : ''}! 👋</h2>
            <p>Thanks for joining Unconference! To complete your registration and start organizing amazing community events, please verify your email address.</p>
            
            <div class="pin-box">
              <p><strong>Your verification PIN is:</strong></p>
              <div class="pin">${pin}</div>
            </div>
            
            <p>Enter this PIN in the verification form to activate your account. The PIN will expire in 15 minutes.</p>
            
            <p>Once verified, you'll be able to:</p>
            <ul>
              <li>🏢 Create and manage events up to 50 participants (free tier)</li>
              <li>🗳️ Set up voting and discussion rounds</li>
              <li>📊 Access basic analytics for your events</li>
              <li>📱 Generate QR codes for easy participant access</li>
            </ul>
            
            <p>If you didn't create this account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>This PIN was generated for your security and will expire in 15 minutes.</p>
            <p>© ${new Date().getFullYear()} Unconference - Making community events more engaging</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private static getVerificationEmailText(pin: string, name?: string): string {
    return `
Hi${name ? ` ${name}` : ''}!

Thanks for joining Unconference! To complete your registration, please verify your email address.

Your verification PIN is: ${pin}

Enter this PIN in the verification form to activate your account. The PIN will expire in 15 minutes.

Once verified, you'll be able to create and manage community events, set up voting rounds, and access basic analytics.

If you didn't create this account, you can safely ignore this email.

© ${new Date().getFullYear()} Unconference - Making community events more engaging
    `
  }

  private static getWelcomeEmailTemplate(name: string, nickname: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Unconference!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .cta-button { display: inline-block; background: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          .footer { color: #64748B; font-size: 14px; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Unconference!</h1>
            <p>Your account is now active</p>
          </div>
          <div class="content">
            <h2>Hi ${name}! 👋</h2>
            <p>Your account has been successfully verified! You're now ready to start creating engaging community events.</p>
            
            <p><strong>Your event nickname:</strong> ${nickname}</p>
            <p><small>This is how you'll appear to other participants. You can change this anytime in your settings.</small></p>
            
            <h3>🚀 What you can do now:</h3>
            <ul>
              <li><strong>Create your first event</strong> - Up to 50 participants on the free tier</li>
              <li><strong>Set up voting rounds</strong> - Let participants shape the agenda</li>
              <li><strong>Generate QR codes</strong> - Easy access for attendees</li>
              <li><strong>View analytics</strong> - Track engagement and participation</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NUXT_PUBLIC_SITE_URL || 'https://unconference.app'}/groups" class="cta-button">
                Start Creating Events →
              </a>
            </div>
            
            <h3>💡 Tips for Success:</h3>
            <ul>
              <li>Start with topics that matter to your community</li>
              <li>Encourage voting to build engagement before events</li>
              <li>Use room assignments to keep discussions organized</li>
              <li>Try the timer feature to keep rounds focused</li>
            </ul>
            
            <p>Need help? Reply to this email or check out our getting started guide.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Unconference - Making community events more engaging</p>
            <p>Designed for meetup organizers, workshop facilitators, and community builders</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private static getWelcomeEmailText(name: string, nickname: string): string {
    return `
Hi ${name}!

Welcome to Unconference! Your account has been successfully verified.

Your event nickname: ${nickname}
(You can change this anytime in your settings)

What you can do now:
- Create your first event (up to 50 participants on free tier)
- Set up voting rounds to let participants shape the agenda
- Generate QR codes for easy attendee access
- View analytics to track engagement

Tips for Success:
- Start with topics that matter to your community
- Encourage voting to build engagement before events
- Use room assignments to keep discussions organized
- Try the timer feature to keep rounds focused

Get started: ${process.env.NUXT_PUBLIC_SITE_URL || 'https://unconference.app'}/groups

Need help? Reply to this email or check out our getting started guide.

© ${new Date().getFullYear()} Unconference - Making community events more engaging
    `
  }

  private static getEventSummaryTemplate(summary: any): string {
    const { event, connections, collaborations, projects, achievements, followUpSuggestions } = summary

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your ${event.name} Summary</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .stats { display: flex; justify-content: space-around; margin: 30px 0; flex-wrap: wrap; }
          .stat { text-align: center; margin: 10px; }
          .stat h3 { color: #667eea; margin: 0; font-size: 32px; }
          .stat p { margin: 5px 0 0 0; font-size: 14px; color: #64748B; }
          .section { margin: 30px 0; }
          .connection { background: #F8FAFC; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
          .suggestion { background: #EFF6FF; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #3B82F6; }
          .cta { background: #667eea; color: white; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px; }
          .cta a { color: white; text-decoration: none; font-weight: bold; }
          .footer { color: #64748B; font-size: 14px; text-align: center; margin-top: 20px; }
          .achievements-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
          .achievement { background: #FEF3C7; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #F59E0B; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Your ${event.name} Summary</h1>
          <p>Amazing things happen when great minds connect!</p>
          ${event.date ? `<p><small>Event Date: ${new Date(event.date).toLocaleDateString()}</small></p>` : ''}
        </div>

        <div class="content">
          <div class="stats">
            <div class="stat">
              <h3>${summary.summary.connectionsCount}</h3>
              <p>New Connections</p>
            </div>
            <div class="stat">
              <h3>${summary.summary.collaborationsCount}</h3>
              <p>Collaborations</p>
            </div>
            <div class="stat">
              <h3>${summary.summary.projectsCount}</h3>
              <p>Projects</p>
            </div>
            <div class="stat">
              <h3>${summary.summary.achievementsCount}</h3>
              <p>Achievements</p>
            </div>
          </div>

          ${connections.length > 0 ? `
            <div class="section">
              <h2>🤝 Your New Connections</h2>
              ${connections.slice(0, 5).map((conn: any) => `
                <div class="connection">
                  <strong>${conn.person.name}</strong>
                  ${conn.person.bio ? `<p style="margin: 10px 0; color: #64748B;">${conn.person.bio}</p>` : ''}
                  ${conn.sharedTopics?.length > 0 ? `<p><strong>Shared interests:</strong> ${conn.sharedTopics.join(', ')}</p>` : ''}
                  ${conn.person.contact ? `
                    <p style="margin-top: 15px;"><strong>Connect:</strong>
                      ${conn.person.contact.linkedin ? `<a href="${conn.person.contact.linkedin}" style="color: #667eea; margin-right: 10px;">LinkedIn</a>` : ''}
                      ${conn.person.contact.twitter ? `<a href="https://twitter.com/${conn.person.contact.twitter}" style="color: #667eea; margin-right: 10px;">Twitter</a>` : ''}
                      ${conn.person.contact.website ? `<a href="${conn.person.contact.website}" style="color: #667eea;">Website</a>` : ''}
                    </p>
                  ` : ''}
                </div>
              `).join('')}
              ${connections.length > 5 ? `<p style="text-align: center; color: #64748B;"><em>...and ${connections.length - 5} more connections!</em></p>` : ''}
            </div>
          ` : ''}

          ${achievements.length > 0 ? `
            <div class="section">
              <h2>🏆 Achievements Unlocked</h2>
              <div class="achievements-grid">
                ${achievements.map((achievement: any) => `
                  <div class="achievement">
                    <h4 style="margin: 0 0 10px 0; color: #92400E;">${achievement.type.replace(/_/g, ' ').toUpperCase()}</h4>
                    <p style="margin: 0; font-size: 14px; color: #78716C;">Earned ${new Date(achievement.earnedAt).toLocaleDateString()}</p>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${followUpSuggestions.length > 0 ? `
            <div class="section">
              <h2>📋 Your Next Steps</h2>
              ${followUpSuggestions.map((suggestion: any) => `
                <div class="suggestion">
                  <h4 style="margin: 0 0 10px 0; color: #1E40AF;">${suggestion.title}</h4>
                  <p style="margin: 0; color: #475569;">${suggestion.description}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="cta">
            <h3 style="margin: 0 0 15px 0;">Keep the momentum going!</h3>
            <p style="margin: 0 0 20px 0;">Join our next unconference and continue building amazing connections.</p>
            <a href="${process.env.NUXT_PUBLIC_SITE_URL || 'https://unconference.app'}/events">Find Your Next Event →</a>
          </div>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Unconference - Making community events more engaging</p>
          <p>You're receiving this because you participated in ${event.name}</p>
        </div>
      </body>
      </html>
    `
  }

  private static getEventSummaryText(summary: any): string {
    const { event, connections, collaborations, projects, achievements, followUpSuggestions } = summary

    return `
Your ${event.name} Summary
${event.date ? `Event Date: ${new Date(event.date).toLocaleDateString()}` : ''}

📊 Quick Stats:
- ${summary.summary.connectionsCount} new connections
- ${summary.summary.collaborationsCount} collaborations started
- ${summary.summary.projectsCount} projects involved in
- ${summary.summary.achievementsCount} achievements unlocked

${connections.length > 0 ? `
🤝 New Connections:
${connections.slice(0, 5).map((conn: any) => `
- ${conn.person.name}${conn.person.bio ? ` - ${conn.person.bio}` : ''}
  Shared interests: ${conn.sharedTopics?.join(', ') || 'None specified'}
  ${conn.person.contact?.linkedin ? `LinkedIn: ${conn.person.contact.linkedin}` : ''}
`).join('')}${connections.length > 5 ? `\n...and ${connections.length - 5} more connections!` : ''}
` : ''}

${achievements.length > 0 ? `
🏆 Achievements:
${achievements.map((achievement: any) => `- ${achievement.type.replace(/_/g, ' ')}`).join('\n')}
` : ''}

${followUpSuggestions.length > 0 ? `
📋 Your Next Steps:
${followUpSuggestions.map((suggestion: any) => `- ${suggestion.title}: ${suggestion.description}`).join('\n')}
` : ''}

Keep building amazing connections at your next unconference!
Visit: ${process.env.NUXT_PUBLIC_SITE_URL || 'https://unconference.app'}/events

© ${new Date().getFullYear()} Unconference - Making community events more engaging
    `.trim()
  }

  private static getCollaborationReminderTemplate(name: string, collaborations: any[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Collaboration Follow-Up</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .collaboration { background: #F0FDF4; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #10B981; }
          .action-items { margin: 15px 0; padding-left: 20px; }
          .footer { color: #64748B; font-size: 14px; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Collaboration Follow-Up</h1>
            <p>Your partnerships are waiting for action!</p>
          </div>
          <div class="content">
            <h2>Hi ${name}! 👋</h2>
            <p>You have <strong>${collaborations.length}</strong> collaboration${collaborations.length > 1 ? 's' : ''} with pending action items that could use your attention:</p>

            ${collaborations.map(collab => `
              <div class="collaboration">
                <h3 style="margin: 0 0 15px 0; color: #065F46;">${collab.name}</h3>
                <p style="margin: 10px 0; color: #374151;">${collab.description}</p>
                <div class="action-items">
                  <p><strong>📋 Pending Actions:</strong> ${collab.pendingActionItems}</p>
                  <p><strong>👥 Contributors:</strong> ${collab.contributors.length}</p>
                  <p><strong>📚 Resources:</strong> ${collab.resourcesCount}</p>
                </div>
              </div>
            `).join('')}

            <p>Great collaborations don't happen by accident - they need consistent follow-up and communication. Consider reaching out to your team members to:</p>
            <ul>
              <li>Check on progress of assigned tasks</li>
              <li>Schedule regular check-ins</li>
              <li>Share resources and updates</li>
              <li>Celebrate milestones together</li>
            </ul>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Unconference - Making community events more engaging</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private static getCollaborationReminderText(name: string, collaborations: any[]): string {
    return `
Hi ${name}!

You have ${collaborations.length} collaboration${collaborations.length > 1 ? 's' : ''} with pending action items:

${collaborations.map(collab => `
📁 ${collab.name}
   Description: ${collab.description}
   Pending Actions: ${collab.pendingActionItems}
   Contributors: ${collab.contributors.length}
   Resources: ${collab.resourcesCount}
`).join('')}

Great collaborations need consistent follow-up. Consider:
- Checking on progress of assigned tasks
- Scheduling regular check-ins
- Sharing resources and updates
- Celebrating milestones together

© ${new Date().getFullYear()} Unconference - Making community events more engaging
    `.trim()
  }

  private static getNetworkingFollowUpTemplate(name: string, suggestions: any[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Networking Follow-Up</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .suggestion { background: #FAF5FF; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #8B5CF6; }
          .cta-button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 10px 5px; }
          .footer { color: #64748B; font-size: 14px; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌟 Networking Opportunities</h1>
            <p>Your connections are ready to grow!</p>
          </div>
          <div class="content">
            <h2>Hi ${name}! 👋</h2>
            <p>Based on your recent unconference participation, we've identified <strong>${suggestions.length}</strong> great networking opportunities:</p>

            ${suggestions.map(suggestion => `
              <div class="suggestion">
                <h3 style="margin: 0 0 15px 0; color: #6B21A8;">${suggestion.title}</h3>
                <p style="margin: 10px 0; color: #374151;">${suggestion.description}</p>
                ${suggestion.action ? `<p style="margin: 15px 0;"><strong>Recommended Action:</strong> ${suggestion.action}</p>` : ''}
                ${suggestion.count ? `<p style="margin: 15px 0; color: #8B5CF6;"><strong>Potential Impact:</strong> ${suggestion.count} opportunities</p>` : ''}
              </div>
            `).join('')}

            <div style="text-align: center; margin: 30px 0;">
              <h3>Ready to expand your network?</h3>
              <a href="${process.env.NUXT_PUBLIC_SITE_URL || 'https://unconference.app'}/events" class="cta-button">Find Your Next Event</a>
              <a href="${process.env.NUXT_PUBLIC_SITE_URL || 'https://unconference.app'}/dashboard" class="cta-button">View Your Connections</a>
            </div>

            <p><strong>Pro tip:</strong> The best time to follow up on connections is within 48 hours while the conversation is still fresh in everyone's mind!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Unconference - Making community events more engaging</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private static getNetworkingFollowUpText(name: string, suggestions: any[]): string {
    return `
Hi ${name}!

Based on your recent unconference participation, here are ${suggestions.length} networking opportunities:

${suggestions.map(suggestion => `
🌟 ${suggestion.title}
   ${suggestion.description}
   ${suggestion.action ? `Action: ${suggestion.action}` : ''}
   ${suggestion.count ? `Potential Impact: ${suggestion.count} opportunities` : ''}
`).join('')}

Ready to expand your network?
- Find your next event: ${process.env.NUXT_PUBLIC_SITE_URL || 'https://unconference.app'}/events
- View your connections: ${process.env.NUXT_PUBLIC_SITE_URL || 'https://unconference.app'}/dashboard

Pro tip: The best time to follow up is within 48 hours while conversations are fresh!

© ${new Date().getFullYear()} Unconference - Making community events more engaging
    `.trim()
  }
}