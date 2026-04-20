import { Resend } from 'resend'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export interface MagicLinkOptions {
  to: string
  magicLink: string
  companyName?: string
}

export interface PasswordResetOptions {
  to: string
  resetLink: string
  companyName?: string
}

export interface UserInviteOptions {
  to: string
  inviterName: string
  companyName: string
  inviteLink: string
  role: string
}

export class EmailService {
  private static instance: EmailService
  private resend: Resend | null = null

  private getResend(): Resend {
    const apiKey = process.env.NEXT_RESEND_API_KEY
    if (!apiKey) {
      throw new Error(
        'Missing NEXT_RESEND_API_KEY. Add it to your environment to send email via Resend.'
      )
    }
    if (!this.resend) {
      this.resend = new Resend(apiKey)
    }
    return this.resend
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  async sendEmail(options: EmailOptions) {
    try {
      const resend = this.getResend()
      const { data, error } = await resend.emails.send({
        from: options.from || `${process.env.EMAIL_FROM_NAME || 'CRAVAB'} <${process.env.EMAIL_FROM || 'noreply@CRAVAB.com'}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      })

      if (error) {
        // Resend email error
        throw new Error(`Failed to send email: ${error.message}`)
      }

      // Email sent successfully
      return { success: true, messageId: data?.id }
    } catch (error) {
      // Email service error
      throw error
    }
  }

  async sendMagicLink(options: MagicLinkOptions) {
    const html = this.getMagicLinkTemplate(options)
    
    return this.sendEmail({
      to: options.to,
      subject: `Sign in to ${options.companyName || 'CRAVAB'}`,
      html,
    })
  }

  async sendPasswordReset(options: PasswordResetOptions) {
    const html = this.getPasswordResetTemplate(options)
    
    return this.sendEmail({
      to: options.to,
      subject: `Reset your password - ${options.companyName || 'CRAVAB'}`,
      html,
    })
  }

  async sendUserInvite(options: UserInviteOptions) {
    const html = this.getUserInviteTemplate(options)
    
    return this.sendEmail({
      to: options.to,
      subject: `You've been invited to join ${options.companyName}`,
      html,
    })
  }

  private getMagicLinkTemplate(options: MagicLinkOptions): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sign in to ${options.companyName || 'CRAVAB'}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${options.companyName || 'CRAVAB'}</h1>
            <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">Your business management platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Sign in to your account</h2>
            <p>Click the button below to sign in to your account. This link will expire in 1 hour for security.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${options.magicLink}" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                Sign In to ${options.companyName || 'CRAVAB'}
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${options.magicLink}" style="color: #667eea; word-break: break-all;">${options.magicLink}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              This email was sent by ${options.companyName || 'CRAVAB'}. If you didn't request this, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `
  }

  private getPasswordResetTemplate(options: PasswordResetOptions): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password - ${options.companyName || 'CRAVAB'}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
            <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">${options.companyName || 'CRAVAB'}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Reset your password</h2>
            <p>We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour for security.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${options.resetLink}" 
                 style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${options.resetLink}" style="color: #667eea; word-break: break-all;">${options.resetLink}</a>
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Security Note:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              This email was sent by ${options.companyName || 'CRAVAB'}. If you have any questions, please contact support.
            </p>
          </div>
        </body>
      </html>
    `
  }

  private getUserInviteTemplate(options: UserInviteOptions): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>You've been invited to join ${options.companyName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited!</h1>
            <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">Join ${options.companyName} on CRAVAB</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to the team!</h2>
            <p><strong>${options.inviterName}</strong> has invited you to join <strong>${options.companyName}</strong> as a <strong>${options.role}</strong>.</p>
            
            <p>CRAVAB is a comprehensive business management platform that helps teams manage appointments, clients, calls, and more.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${options.inviteLink}" 
                 style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${options.inviteLink}" style="color: #667eea; word-break: break-all;">${options.inviteLink}</a>
            </p>
            
            <div style="background: #e7f3ff; border: 1px solid #b3d9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #0066cc; font-size: 16px;">What you'll get access to:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #333;">
                <li>Appointment scheduling and management</li>
                <li>Client database and communication</li>
                <li>Call tracking and AI integration</li>
                <li>Document management</li>
                <li>Team collaboration tools</li>
              </ul>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              This invitation was sent by ${options.inviterName} from ${options.companyName}. If you didn't expect this invitation, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance()
