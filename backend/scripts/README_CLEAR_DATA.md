# Database Data Clearing Scripts

## clearDataExceptAdminRewards.js

This script clears all database data while preserving admin accounts and reward rules.

### What it clears:
- All user data (regular users, partners, experts)
- All community data
- All session data
- All transaction and payment data
- All form data and responses
- All blog posts and content
- All events and attendance
- All messages and chat data
- All media assets
- All notifications
- All connections and relationships
- All competition data
- All course data
- All project data
- All thread data
- All poll data
- All order data
- All subscription data
- All wallet data
- All tickets
- All tags
- All user activities and user rewards
- All unified users (except admin ones)

### What it preserves:
- Admin accounts (Admin table)
- Reward rules (RewardRule table)
- Admin unified users

### Usage:

```bash
# Using npm script
npm run db:clear-except-admin

# Or directly
node scripts/clearDataExceptAdminRewards.js
```

### Safety Features:
- Uses database transactions for atomicity
- Preserves admin accounts and reward rules
- Detailed logging of each step
- Error handling with rollback

### Prerequisites:
- Database connection (DATABASE_URL in .env)
- Prisma client installed
- Proper database permissions

### Warning:
⚠️ **This operation is irreversible!** Make sure to backup your database before running this script.

### Example Output:
```
🚀 Starting data clearing process (preserving admin accounts and rewards)...
📊 Clearing data in the following order:
1. Clearing user activities and user rewards...
2. Clearing notifications...
3. Clearing connections...
...
36. Clearing unified users (except admin ones)...
✅ All data cleared successfully!
📋 Preserved:
   - Admin accounts
   - Reward rules
   - Admin unified users
🎉 Data clearing completed successfully!
``` 