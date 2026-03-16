const fs = require('fs');
const path = require('path');

const requiredTemplates = [
  'session-reminder.hbs',
  'new-message.hbs',
  'connection-request.hbs',
  'connection-accepted.hbs'
];

const templatesDir = path.join(__dirname, '../services/templates/email');

// Create templates directory if it doesn't exist
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Check and create missing templates
requiredTemplates.forEach(template => {
  const templatePath = path.join(templatesDir, template);
  if (!fs.existsSync(templatePath)) {
    console.log(`Creating missing template: ${template}`);
    // Create a basic template if it doesn't exist
    const basicTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .content {
            padding: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>{{title}}</h2>
        </div>
        <div class="content">
            {{{message}}}
        </div>
        <div class="footer">
            <p>This email was sent by IFCA</p>
            <p>If you received this email by mistake, please ignore it.</p>
        </div>
    </div>
</body>
</html>`;
    fs.writeFileSync(templatePath, basicTemplate);
  }
});

console.log('Template check completed'); 