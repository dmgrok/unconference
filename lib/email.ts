import nodemailer from 'nodemailer'

// For development, we'll log to console. In production, use real SMTP
const transporter = process.env.NODE_ENV === 'production' 
  ? nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  : nodemailer.createTestAccount().then(account => 
      nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: account.user,
          pass: account.pass
        }
      })
    )

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

  private static async getTransporter() {
    if (typeof transporter === 'object') {
      return transporter
    }
    return await transporter
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
}