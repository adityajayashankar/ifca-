const nodemailer = require('nodemailer')
const handlebars = require('handlebars')
const fs = require('fs')
const path = require('path')

class EmailService {
  constructor() {
    // Check if email configuration is available
    if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email configuration missing. EMAIL and EMAIL_PASSWORD environment variables are required.');
      console.warn('⚠️ Email functionality will be disabled.');
      this.transporter = null;
    } else {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      })
    }

    // Initialize templates
    this.templates = {}
    this.loadTemplates()
  }

  loadTemplates() {
    const templatesDir = path.join(__dirname, 'templates', 'email')
    console.log('Loading templates from:', templatesDir)

    try {
      // Register custom Handlebars helpers
      handlebars.registerHelper('eq', function(a, b) {
        return a === b;
      });

      // Register base template as a partial
      const baseTemplatePath = path.join(templatesDir, 'base.hbs')
      if (fs.existsSync(baseTemplatePath)) {
        const baseTemplateContent = fs.readFileSync(baseTemplatePath, 'utf-8')
        handlebars.registerPartial('base', baseTemplateContent)
        console.log('Successfully registered base template as partial')
      } else {
        console.error('Base template not found:', baseTemplatePath)
      }

      const templateDefinitions = {
        'welcome-email': {
          subject: 'Welcome to IFCA',
          template: 'welcome.hbs'
        },
        'session-reminder': {
          subject: 'IFCA Session Reminder',
          template: 'session-reminder.hbs'
        },
        'session-registration': {
          subject: 'Session Registration Confirmed',
          template: 'session-registration.hbs'
        },
        'new-message': {
          subject: 'New IFCA Message',
          template: 'new-message.hbs'
        },
        'connection-request': {
          subject: 'New IFCA Connection Request',
          template: 'connection-request.hbs'
        },
        'connection-accepted': {
          subject: 'IFCA Connection Request Accepted',
          template: 'connection-accepted.hbs'
        },
        'connection-rejected': {
          subject: 'IFCA Connection Request Update',
          template: 'connection-rejected.hbs'
        },
        'event-registration': {
          subject: 'IFCA Event Registration Confirmation',
          template: 'event-registration.hbs'
        },
        'event-reminder': {
          subject: 'IFCA Event Reminder',
          template: 'event-reminder.hbs'
        },
        'contact-form': {
          subject: 'Thank You for Contacting IFCA',
          template: 'contact-form.hbs'
        },
        'newsletter': {
          subject: 'IFCA Newsletter',
          template: 'newsletter.hbs'
        },
        'password-reset': {
          subject: 'Reset your IFCA password',
          template: 'password-reset.hbs'
        },
        'password-reset-direct': {
          subject: 'Your IFCA Password Has Been Reset',
          template: 'password-reset-direct.hbs'
        },
        'password-changed': {
          subject: 'Your IFCA password was changed',
          template: 'password-changed.hbs'
        },
        'post-like': {
          subject: 'New Like on Your Post',
          template: 'post-like.hbs'
        },
        'post-comment': {
          subject: 'New Comment on Your Post',
          template: 'post-comment.hbs'
        },
        'role-change': {
          subject: 'Your role in the community has changed',
          template: 'role-change.hbs'
        }
      }

      // Load all templates
      for (const [name, config] of Object.entries(templateDefinitions)) {
        try {
          const templatePath = path.join(templatesDir, config.template)
          console.log('Attempting to load template:', templatePath)

          if (fs.existsSync(templatePath)) {
            const templateContent = fs.readFileSync(templatePath, 'utf-8')
            // Compile the template with handlebars
            this.templates[name] = {
              subject: config.subject,
              template: handlebars.compile(templateContent)
            }
            console.log(`Successfully loaded template: ${name}`)
          } else {
            console.error(`Template file not found: ${templatePath}`)
          }
        } catch (error) {
          console.error(`Failed to load template ${name}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to initialize templates:', error)
      throw error
    }
  }

  async sendEmail({ to, subject, text, template = null, context = {}, actionUrl = null }) {
    try {
      if (!to || !subject) {
        throw new Error('Email recipient and subject are required');
      }

      // Check if email service is configured
      if (!this.transporter) {
        console.warn('⚠️ Email service not configured. Skipping email send.');
        console.log('📧 Would have sent email:', { to, subject, template });
        return { messageId: 'email-disabled', status: 'skipped' };
      }

      let html = text;
      let emailSubject = subject;

      if (template && this.templates[template]) {
        const templateData = this.templates[template];
        const fullContext = {
          ...context,
          title: subject || templateData.subject,
          actionUrl: actionUrl || context.actionUrl,
          currentYear: new Date().getFullYear(),
          socialLinks: {
            facebook: process.env.FACEBOOK_URL || 'https://facebook.com/ifcaindia',
            twitter: process.env.TWITTER_URL || 'https://twitter.com/ifcaindia',
            linkedin: process.env.LINKEDIN_URL || 'https://linkedin.com/company/ifcaindia'
          }
        };

        html = templateData.template(fullContext);
        emailSubject = subject || templateData.subject;
      } else if (template) {
        console.warn(`Template '${template}' not found, falling back to plain text`);
        html = text || 'Please enable HTML to view this email properly.';
      }

      const mailOptions = {
        from: `IFCA <${process.env.EMAIL}>`,
        to,
        subject: emailSubject,
        text: text || 'Please enable HTML to view this email properly.',
        html: html
      };

      console.log('Sending email with options:', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        template: template || 'plain text'
      });

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendNotificationEmail(emailData) {
    try {
      if (!emailData || !emailData.to) {
        console.error('Invalid email data provided')
        return null
      }

      const template = emailData.template || this.getTemplateForNotificationType(emailData.type)
      if (!template) {
        console.warn(`No template found for notification type: ${emailData.type}`)
        return null
      }

      // Add IFCA-specific branding for session registration
      if (template === 'session-registration') {
        emailData.subject = emailData.subject || 'IFCA Session Registration Confirmed'
        emailData.context = {
          ...emailData.context,
          recipientName: emailData.context.recipientName || 'Valued Member'
        }
      }

      return await this.sendEmail({
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        template,
        context: emailData.context,
        actionUrl: emailData.actionUrl
      })
    } catch (error) {
      console.error('Error sending notification email:', error)
      throw error
    }
  }

  getTemplateForNotificationType(type) {
    const templateMap = {
      SESSION_REMINDER: 'session-reminder',
      SESSION_REGISTRATION: 'session-registration',
      NEW_MESSAGE: 'new-message',
      CONNECTION_REQUEST: 'connection-request',
      CONNECTION_ACCEPTED: 'connection-accepted',
      CONNECTION_REJECTED: 'connection-rejected',
      EVENT_REMINDER: 'event-reminder',
      EVENT_REGISTRATION: 'event-registration',
      CONTACT_FORM: 'contact-form',
      WELCOME_EMAIL: 'welcome-email',
      NEWSLETTER: 'newsletter',
      POST_COMMENT: 'post-comment',
      NEW_POST: 'post-like',
      ROLE_CHANGE: 'role-change'
    }

    return templateMap[type] || null
  }

  getActionUrlForNotification(notification) {
    const baseUrl = process.env.FRONTEND_URL || 'https://pvl.ifcaindia.com'

    switch (notification.type) {
      case 'SESSION_REMINDER':
      case 'SESSION_REGISTRATION':
        // Use actionUrl from metadata if available, otherwise construct classDetails URL
        return notification.metadata?.actionUrl || `${baseUrl}/classDetails/${notification.sessionId}`
      case 'NEW_MESSAGE':
        return `${baseUrl}/messages/${notification.messageId}`
      case 'CONNECTION_REQUEST':
      case 'CONNECTION_ACCEPTED':
      case 'CONNECTION_REJECTED':
        return `${baseUrl}/user/${notification.senderId}`
      case 'EVENT_REMINDER':
      case 'EVENT_REGISTRATION':
        return `${baseUrl}/events/${notification.eventId}`
      case 'WELCOME_EMAIL':
        return `${baseUrl}/profile/complete`
      case 'POST_COMMENT':
      case 'NEW_POST':
        return `${baseUrl}/thread/${notification.postId}`
      default:
        return baseUrl
    }
  }
}

module.exports = new EmailService() 