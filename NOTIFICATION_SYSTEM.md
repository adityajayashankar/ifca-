# Notification System for Comments and Likes

## Overview
This system provides automatic notifications when users comment on or like posts, with both in-app notifications and email notifications.

## Features

### 1. Comment Notifications
- **Trigger**: When someone creates a comment (post with `parentPostId`)
- **Recipient**: Original post creator
- **Notification Type**: `POST_COMMENT`
- **Email Template**: `post-comment.hbs`

### 2. Like Notifications
- **Trigger**: When someone likes a post
- **Recipient**: Post creator (if not their own post)
- **Notification Type**: `NEW_POST`
- **Email Template**: `post-like.hbs`

### 3. View Who Liked a Post
- **API Endpoint**: `GET /api/v1/thread/:postId/likes`
- **Response**: List of users who liked the post with their details

## Backend Implementation

### API Endpoints

#### Like/Unlike a Post
```http
PATCH /api/v1/thread/:postId/user/:userId
```

#### Get Users Who Liked a Post
```http
GET /api/v1/thread/:postId/likes
```

**Response:**
```json
{
  "likes": [
    {
      "id": 1,
      "userId": 123,
      "userName": "John Doe",
      "userPhoto": "/path/to/photo.jpg",
      "userEmail": "john@example.com",
      "likedAt": "2025-01-11T14:31:02.670Z"
    }
  ],
  "totalLikes": 1
}
```

### Email Templates

#### post-like.hbs
- Professional IFCA branding
- Shows liker name and post title
- Action button to view the post
- Responsive design

#### post-comment.hbs
- Professional IFCA branding
- Shows commenter name and comment content
- Action button to view the comment
- Responsive design

## Frontend Implementation

### Components

#### LikesModal.jsx
```jsx
import LikesModal from '../components/post/LikesModal';

<LikesModal
  open={isOpen}
  onClose={closeLikesModal}
  postId={postId}
  likeCount={likeCount}
/>
```

#### useLikesModal Hook
```jsx
import useLikesModal from '../hooks/useLikesModal';

const { isOpen, currentPostId, currentLikeCount, openLikesModal, closeLikesModal } = useLikesModal();
```

#### ThreadCardWithLikes.jsx
Enhanced version of ThreadCard with likes modal functionality:
```jsx
import ThreadCardWithLikes from '../components/threadCard/ThreadCardWithLikes';

<ThreadCardWithLikes
  thread={thread}
  isLiked={isLiked}
  onLikeToggle={handleLikeToggle}
/>
```

### Usage Example

```jsx
import React from 'react';
import ThreadCardWithLikes from '../components/threadCard/ThreadCardWithLikes';

const ThreadList = ({ threads, likeMap, onLikeToggle }) => {
  return (
    <div>
      {threads.map(thread => (
        <ThreadCardWithLikes
          key={thread.id}
          thread={thread}
          isLiked={likeMap[thread.id] === 1}
          onLikeToggle={onLikeToggle}
        />
      ))}
    </div>
  );
};
```

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipientId INT NOT NULL,
  senderId INT,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  status ENUM('READ', 'UNREAD') DEFAULT 'UNREAD',
  isRead BOOLEAN DEFAULT FALSE,
  metadata JSON,
  postId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### PostLikes Table
```sql
CREATE TABLE postLikes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  postId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY userId_postId (userId, postId)
);
```

## Configuration

### Environment Variables
```env
# Email Configuration
EMAIL=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Frontend URL for email links
FRONTEND_URL=https://pvl.ifcaindia.com
```

## Testing

### Test Script
Run the test script to verify the notification system:
```bash
cd backend
node test-notifications.js
```

### Manual Testing
1. Create a post
2. Like the post from another user account
3. Comment on the post from another user account
4. Check notifications in the database
5. Verify email templates are sent (if email is configured)

## Error Handling

### Common Issues
1. **Template not found**: Ensure email templates are in `backend/services/templates/email/`
2. **Email not sending**: Check email configuration in environment variables
3. **API errors**: Verify authentication and post existence

### Logs
- Notification creation logs: `notification=======`
- Email sending logs: `Sending email with options:`
- Template loading logs: `Successfully loaded template:`

## Future Enhancements

1. **Push Notifications**: Add web push notifications
2. **Notification Preferences**: Allow users to customize notification settings
3. **Batch Notifications**: Group multiple notifications together
4. **Real-time Updates**: WebSocket integration for live notifications
5. **Notification Analytics**: Track notification engagement rates 