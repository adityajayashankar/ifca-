module.exports = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  },
  defaults: {
    from: `IFCA <${process.env.EMAIL}>` || 'IFCA <constact@houseofhospitality.com>',
  },
  templates: {
    baseDir: '../templates/email',
    defaultLayout: 'base',
    options: {
      logoUrl: process.env.EMAIL_LOGO_URL || 'https://pvl.ifcaindia.com/_next/image?url=%2Flogoifca.png&w=256&q=75',
      socialLinks: {
        facebook: process.env.SOCIAL_FACEBOOK || 'https://facebook.com/houseofhospitality',
        twitter: process.env.SOCIAL_TWITTER || 'https://twitter.com/houseofhospitality',
        linkedin: process.env.SOCIAL_LINKEDIN || 'https://linkedin.com/company/houseofhospitality',
      },
    },
  },
  // Time in milliseconds to wait between sending bulk emails
  rateLimitDelay: 1000,
  // Maximum number of emails to send per minute
  rateLimit: 60,
  // Default email options
  defaultOptions: {
    // Add tracking parameters to URLs
    trackLinks: true,
    // Add unsubscribe link to marketing emails
    addUnsubscribeLink: true,
  },
} 