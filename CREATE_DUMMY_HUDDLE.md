# How to Create a Dummy Huddle

This guide will help you create a test huddle with all AI activities to test the Dynamic AI Activity Generation System.

## Method 1: Using the Script (Recommended)

### Step 1: Update Configuration

Edit `backend/scripts/createDummyHuddle.js` and update these values:

```javascript
const COMMUNITY_ID = 1;      // Change to an existing community ID
const CREATOR_ID = 1;        // Change to an existing user ID
const LEADER_ID = 1;         // Change to an existing user ID or null
```

### Step 2: Find Valid IDs

If you don't know the IDs, you can query your database:

```sql
-- Find communities
SELECT id, title FROM "Community" LIMIT 10;

-- Find users
SELECT id, email FROM "unifiedUser" LIMIT 10;
```

### Step 3: Run the Script

```bash
cd backend
node scripts/createDummyHuddle.js
```

The script will:
- ✅ Verify community and user exist
- ✅ Create a huddle with all 11 activity types
- ✅ Trigger AI generation in the background
- ✅ Show activity status

---

## Method 2: Using API (Postman/Thunder Client)

### Endpoint
```
POST http://localhost:5000/api/v1/huddle/create
Content-Type: application/json
```

### Request Body

```json
{
  "title": "AI-Powered Test Huddle",
  "description": "Test huddle with all AI activities",
  "communityId": 1,
  "creatorId": 1,
  "frequency": "WEEKLY",
  "scheduledTime": "2025-12-25T10:00:00.000Z",
  "timezone": "UTC",
  "selectedActivities": [
    "AI_SLIDESHOW",
    "AI_VIDEO_MESSAGE",
    "DISCUSSION_TOPIC",
    "QUIZ",
    "DEBATE",
    "CONTEST",
    "VOTING_SURVEY",
    "REFLECTION",
    "GUIDED_SESSION",
    "STORY_SPOTLIGHT",
    "ANNOUNCEMENT"
  ],
  "audienceType": "ALL_MEMBERS",
  "locationType": "DIGITAL",
  "leaderSelectionType": "USER",
  "leaderId": 1
}
```

### Required Fields

- `title` - Huddle title
- `communityId` - Existing community ID
- `creatorId` - Existing user ID
- `frequency` - Options: `DAILY`, `WEEKLY`, `FORTNIGHTLY`, `MONTHLY`, `ONE_TIME`
- `scheduledTime` - ISO date string (must be in the future)
- `selectedActivities` - Array of activity types

### Optional Fields

- `description` - Huddle description
- `timezone` - Default: "UTC"
- `audienceType` - Default: "ALL_MEMBERS" (Options: `ALL_MEMBERS`, `SELECTED_MEMBERS`)
- `selectedMemberIds` - Array of user IDs (required if `audienceType` is `SELECTED_MEMBERS`)
- `locationType` - Default: "DIGITAL" (Options: `DIGITAL`, `OFFLINE`, `HYBRID`)
- `offlineLocation` - String (required if `locationType` is `OFFLINE` or `HYBRID`)
- `leaderId` - User ID for huddle leader
- `leaderSelectionType` - Default: "USER" (Options: `USER`, `RANDOM`, `FIRST_LOGIN`, `ROUNDROBIN`)

---

## Method 3: Using cURL

```bash
curl -X POST http://localhost:5000/api/v1/huddle/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AI Test Huddle",
    "description": "Testing AI activity generation",
    "communityId": 1,
    "creatorId": 1,
    "frequency": "WEEKLY",
    "scheduledTime": "2025-12-25T10:00:00.000Z",
    "timezone": "UTC",
    "selectedActivities": ["AI_SLIDESHOW", "QUIZ", "VOTING_SURVEY"],
    "audienceType": "ALL_MEMBERS",
    "locationType": "DIGITAL",
    "leaderSelectionType": "USER",
    "leaderId": 1
  }'
```

---

## Available Activity Types

All 11 activity types you can include:

1. `AI_SLIDESHOW` - AI-generated slideshow with images
2. `AI_VIDEO_MESSAGE` - AI-generated video message
3. `DISCUSSION_TOPIC` - Discussion topic with points
4. `QUIZ` - Quiz with multiple-choice questions
5. `DEBATE` - Debate topic with for/against arguments
6. `CONTEST` - Contest with rules, prizes, and criteria
7. `VOTING_SURVEY` - Voting/survey with options
8. `REFLECTION` - Reflection prompts
9. `GUIDED_SESSION` - Guided session with steps
10. `STORY_SPOTLIGHT` - Story sharing prompts
11. `ANNOUNCEMENT` - Announcement content

---

## Checking Activity Generation Status

After creating the huddle, activities are generated asynchronously. Check status:

### Via API
```bash
# Get huddle details (includes activities)
GET http://localhost:5000/api/v1/huddle/{huddleId}

# Get specific activity status
GET http://localhost:5000/api/v1/huddle/activity/{activityId}/status

# Get all activities for a huddle
GET http://localhost:5000/api/v1/huddle/{huddleId}/activities
```

### Status Values

- `pending` - Not yet started
- `generating` - Currently being generated
- `completed` - Successfully generated
- `failed` - Generation failed (check error message)

---

## Troubleshooting

### Error: "Community not found"
- Verify the `communityId` exists in your database
- Run: `SELECT id, title FROM "Community";`

### Error: "User not found"
- Verify the `creatorId` exists in your database
- Run: `SELECT id, email FROM "unifiedUser";`

### Error: "Scheduled time must be in the future"
- Make sure `scheduledTime` is a future date
- Format: ISO 8601 string (e.g., "2025-12-25T10:00:00.000Z")

### Activities not generating
- Check that `OPENAI_API_KEY` is set in `.env`
- Check backend logs for errors
- Verify AWS S3 credentials are configured
- Check activity status via API

### Activities stuck in "generating" status
- Check backend logs for errors
- Verify API keys are valid
- Check network connectivity
- Try regenerating: `POST /api/v1/huddle/activity/{activityId}/regenerate`

---

## Next Steps

After creating the huddle:

1. **View in Frontend**: Navigate to `http://localhost:3001/huddle/{huddleId}`
2. **Check Activity Status**: Use the API endpoints above
3. **Test Interactions**: Try voting, taking quizzes, etc.
4. **View Generated Content**: Check images, videos, and text content

---

## Example: Minimal Test Huddle

For a quick test with just a few activities:

```json
{
  "title": "Quick Test",
  "communityId": 1,
  "creatorId": 1,
  "frequency": "ONE_TIME",
  "scheduledTime": "2025-12-25T10:00:00.000Z",
  "selectedActivities": ["QUIZ", "VOTING_SURVEY"],
  "audienceType": "ALL_MEMBERS",
  "locationType": "DIGITAL"
}
```

This creates a simple huddle with just Quiz and Voting Survey activities for faster testing.


