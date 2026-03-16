const path = require('path')
const pug = require('pug')

// user Onboarding email
const userOnboardingOtpEmailTemplate = (data) => {
  const html = pug.renderFile(
    path.join(__dirname, '../templates/layout.pug'),
    {
      ...data
    }
  )
  // console.log(html)
  return html
}

module.exports = userOnboardingOtpEmailTemplate