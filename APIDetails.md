---

# Analytics API Documentation

## Base URL
```
/api/analytics
```

---

### 1. Get All Analytics Dashboard

- **Endpoint:** `GET /dashboard`
- **Description:** Get comprehensive analytics data including users, communities, sessions, requests, revenue, and posts with month-over-month comparisons.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/dashboard
  ```
- **Example Response:**
  ```json
  {
    "communities": {
      "active": 25,
      "total": 50,
      "thisMonth": 5,
      "lastMonth": 3,
      "percentChange": 66.67
    },
    "sessions": {
      "active": 15,
      "total": 100,
      "thisMonth": 8,
      "lastMonth": 6,
      "percentChange": 33.33
    },
    "experts": {
      "total": 20
    },
    "users": {
      "active": 150,
      "total": 500,
      "thisMonth": 25,
      "lastMonth": 20,
      "percentChange": 25
    },
    "requests": {
      "thisMonth": 12,
      "lastMonth": 8,
      "percentChange": 50
    },
    "revenue": {
      "total": 50000
    },
    "posts": {
      "total": 200
    }
  }
  ```

---

### 2. Get Recent Activities

- **Endpoint:** `GET /recent-activities`
- **Description:** Get recent activities across all entities (users, experts, communities, sessions, requests, forms, competitions).
- **Parameters:**
  - `startDate` (query): Start date filter (optional)
  - `endDate` (query): End date filter (optional)
  - `limit` (query): Number of activities to return (default: 10, max: 50)
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/analytics/recent-activities?limit=20&startDate=2024-01-01"
  ```
- **Example Response:**
  ```json
  {
    "activities": [
      {
        "type": "user",
        "title": "New user registered: John Doe",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      {
        "type": "community",
        "title": "New community created: Tech Enthusiasts",
        "timestamp": "2024-01-15T09:15:00Z"
      }
    ]
  }
  ```

---

### 3. Get Session Analytics

- **Endpoint:** `GET /session`
- **Description:** Get total number of active sessions.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/session
  ```
- **Example Response:**
  ```json
  {
    "sessions": 25
  }
  ```

---

### 4. Get Sessions Over Time

- **Endpoint:** `GET /session/time`
- **Description:** Get session creation data over time with cumulative counts.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/session/time
  ```
- **Example Response:**
  ```json
  {
    "sessionTime": [
      {
        "createdAt": "2024-01-01T00:00:00Z",
        "sum": 5
      },
      {
        "createdAt": "2024-01-02T00:00:00Z",
        "sum": 12
      }
    ]
  }
  ```

---

### 5. Get Session People Count

- **Endpoint:** `GET /session/:sessionId/people/num`
- **Description:** Get number of people who bought/registered for a specific session.
- **Parameters:**
  - `sessionId` (path): Session ID (integer)
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/session/123/people/num
  ```
- **Example Response:**
  ```json
  {
    "numPeople": {
      "_count": {
        "userId": 45
      }
    }
  }
  ```

---

### 6. Get Session RSVP Count

- **Endpoint:** `GET /session/:sessionId/people/num/rsvp`
- **Description:** Get number of people who RSVP'd for a specific session.
- **Parameters:**
  - `sessionId` (path): Session ID (integer)
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/session/123/people/num/rsvp
  ```
- **Example Response:**
  ```json
  {
    "numPeople": {
      "_count": {
        "rsvp": 38
      }
    }
  }
  ```

---

### 7. Get Session People Details

- **Endpoint:** `GET /session/:sessionId/people`
- **Description:** Get detailed list of people who registered for a specific session.
- **Parameters:**
  - `sessionId` (path): Session ID (integer)
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/session/123/people
  ```
- **Example Response:**
  ```json
  {
    "people": [
      {
        "id": 1,
        "userId": 456,
        "sessionId": 123,
        "user": {
          "id": 456,
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ]
  }
  ```

---

### 8. Get Session Slot Summary

- **Endpoint:** `GET /session/:sessionId/people/summary`
- **Description:** Get aggregated people count for all slots of a session.
- **Parameters:**
  - `sessionId` (path): Session ID (integer)
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/session/123/people/summary
  ```
- **Example Response:**
  ```json
  {
    "summary": [
      {
        "index": 1,
        "startTime": "2024-01-15T10:00:00Z",
        "endTime": "2024-01-15T11:00:00Z",
        "numPeople": 25,
        "numPeopleRSVP": 20
      }
    ]
  }
  ```

---

### 9. Get User Analytics

- **Endpoint:** `GET /users`
- **Description:** Get total number of users.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/users
  ```
- **Example Response:**
  ```json
  {
    "users": 500
  }
  ```

---

### 10. Get Users Over Time

- **Endpoint:** `GET /users/time`
- **Description:** Get user registration data over time with cumulative counts.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/users/time
  ```
- **Example Response:**
  ```json
  {
    "userTime": [
      {
        "createdAt": "2024-01-01T00:00:00Z",
        "sum": 100
      },
      {
        "createdAt": "2024-01-02T00:00:00Z",
        "sum": 150
      }
    ]
  }
  ```

---

### 11. Get Community Analytics

- **Endpoint:** `GET /community`
- **Description:** Get total number of active communities.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/community
  ```
- **Example Response:**
  ```json
  {
    "community": 50
  }
  ```

---

### 12. Get Communities Over Time

- **Endpoint:** `GET /community/time`
- **Description:** Get community creation data over time with cumulative counts.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/community/time
  ```
- **Example Response:**
  ```json
  {
    "communityTime": [
      {
        "createdAt": "2024-01-01T00:00:00Z",
        "sum": 10
      },
      {
        "createdAt": "2024-01-02T00:00:00Z",
        "sum": 15
      }
    ]
  }
  ```

---

### 13. Get People by Community

- **Endpoint:** `GET /community/people`
- **Description:** Get number of people subscribed to each community.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/community/people
  ```
- **Example Response:**
  ```json
  {
    "people": [
      {
        "communityId": 1,
        "communityName": "Tech Enthusiasts",
        "people": 25
      }
    ]
  }
  ```

---

### 14. Get Revenue Analytics

- **Endpoint:** `GET /revenue`
- **Description:** Get total revenue across all transactions.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/revenue
  ```
- **Example Response:**
  ```json
  {
    "revenue": 50000
  }
  ```

---

### 15. Get Revenue Over Time

- **Endpoint:** `GET /revenue/time`
- **Description:** Get revenue data over time with cumulative amounts.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/revenue/time
  ```
- **Example Response:**
  ```json
  {
    "revenueTime": [
      {
        "createdAt": "2024-01-01T00:00:00Z",
        "sum": 10000
      },
      {
        "createdAt": "2024-01-02T00:00:00Z",
        "sum": 15000
      }
    ]
  }
  ```

---

### 16. Get Revenue by Session

- **Endpoint:** `GET /revenue/session/:sessionId`
- **Description:** Get total revenue generated by a specific session.
- **Parameters:**
  - `sessionId` (path): Session ID (integer)
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/revenue/session/123
  ```
- **Example Response:**
  ```json
  {
    "revenue": 2500
  }
  ```

---

### 17. Get Active Communities Count

- **Endpoint:** `GET /communities/active`
- **Description:** Get count of active and approved communities.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/communities/active
  ```
- **Example Response:**
  ```json
  {
    "count": 25
  }
  ```

---

### 18. Get Active Sessions Count

- **Endpoint:** `GET /sessions/active`
- **Description:** Get count of active and non-archived sessions.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/sessions/active
  ```
- **Example Response:**
  ```json
  {
    "count": 15
  }
  ```

---

### 19. Get Total Experts Count

- **Endpoint:** `GET /experts/total`
- **Description:** Get count of active experts.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/experts/total
  ```
- **Example Response:**
  ```json
  {
    "count": 20
  }
  ```

---

### 20. Get Active Users Count

- **Endpoint:** `GET /users/active`
- **Description:** Get count of users active in the last 30 days.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/analytics/users/active
  ```
- **Example Response:**
  ```json
  {
    "count": 150
  }
  ```

---

### 21. Get Partner Analytics Dashboard

- **Endpoint:** `GET /partner/dashboard`
- **Description:** Get analytics data for partners including communities and sessions.
- **Parameters:**
  - `partnerId` (query): Specific partner ID (optional)
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/analytics/partner/dashboard?partnerId=123"
  ```
- **Example Response:**
  ```json
  {
    "communities": {
      "total": 10,
      "thisMonth": 2,
      "lastMonth": 1
    },
    "sessions": {
      "total": 25,
      "thisMonth": 5,
      "lastMonth": 3
    },
    "partners": {
      "total": 1
    }
  }
  ```

---

### 22. Get Partner Recent Activities

- **Endpoint:** `GET /partner/recent-activities`
- **Description:** Get recent activities for partners (communities and sessions).
- **Parameters:**
  - `partnerId` (query): Specific partner ID (optional)
  - `startDate` (query): Start date filter (optional)
  - `endDate` (query): End date filter (optional)
  - `limit` (query): Number of activities to return (default: 10, max: 50)
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/analytics/partner/recent-activities?partnerId=123&limit=20"
  ```
- **Example Response:**
  ```json
  {
    "activities": [
      {
        "type": "community",
        "title": "New Community",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      {
        "type": "session",
        "title": "Tech Workshop",
        "timestamp": "2024-01-15T09:15:00Z"
      }
    ]
  }
  ```

---

# Catchup API Documentation

## Base URL
```
/api/catchup
```

---

### 1. Create Catchup

- **Endpoint:** `POST /create`
- **Description:** Create a new catchup session for a community.
- **Parameters:**
  - Request body: `{ roomId, communityId, userId, unifiedUserId }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/catchup/create \
    -H "Content-Type: application/json" \
    -d '{
      "roomId": "room_123",
      "communityId": 456,
      "userId": 789,
      "unifiedUserId": 101
    }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "CatchUp started successfully",
    "catchup": {
      "id": 1,
      "roomId": "room_123",
      "communityId": 456,
      "communityName": "Tech Community",
      "communityBanner": "banner.jpg",
      "creatorId": 101,
      "creatorName": "John Doe",
      "creatorEmail": "john@example.com",
      "isHost": true,
      "startTime": "2024-01-15T10:30:00Z"
    }
  }
  ```

---

### 2. Get Catchup by Community

- **Endpoint:** `GET /:roomId`
- **Description:** Get catchup details for a specific community by room ID.
- **Parameters:**
  - `roomId` (path): Room ID (string)
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/catchup/room_123
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "catchup": [
      {
        "id": 1,
        "roomId": "room_123",
        "communityId": 456,
        "isLive": true
      }
    ]
  }
  ```

---

### 3. Verify Community Member

- **Endpoint:** `GET /verifyMember/:comId/:userId`
- **Description:** Verify if a user is a member of a specific community.
- **Parameters:**
  - `comId` (path): Community ID (integer)
  - `userId` (path): User ID (integer)
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/catchup/verifyMember/456/789
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "Member verified"
  }
  ```

---

### 4. Check Community Catchup Status

- **Endpoint:** `GET /community/:comId`
- **Description:** Check if a community has an active catchup session.
- **Parameters:**
  - `comId` (path): Community ID (integer)
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/catchup/community/456
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "msg": "Join the catchup",
    "catchupId": 1,
    "creatorId": 101,
    "creatorEmail": "john@example.com",
    "roomId": "room_123"
  }
  ```

---

### 5. Leave Catchup

- **Endpoint:** `PATCH /leave/:roomId/:comId/:userId`
- **Description:** End a catchup session (requires leader verification).
- **Parameters:**
  - `roomId` (path): Room ID (string)
  - `comId` (path): Community ID (integer)
  - `userId` (path): User ID (integer)
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/catchup/leave/room_123/456/789
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "msg": "Catchup ended"
  }
  ```

---

### 6. Get Room ID

- **Endpoint:** `GET /room/:comId/:email`
- **Description:** Get room ID for a community catchup (requires member verification).
- **Parameters:**
  - `comId` (path): Community ID (integer)
  - `email` (path): User email (string)
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/catchup/room/456/john@example.com
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "room": "room_123",
    "msg": "Join the Catchup"
  }
  ```
- **Error Response:**
  ```json
  {
    "success": false,
    "msg": "ERROR IN FETCHING ROOMID"
  }
  ```

---

### 7. Get User Active Catchups

- **Endpoint:** `GET /user/:userId/active-catchups`
- **Description:** Get all active catchups for communities the user is subscribed to.
- **Parameters:**
  - `userId` (path): User ID (integer)
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/catchup/user/789/active-catchups
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "catchups": [
      {
        "id": 1,
        "roomId": "room_123",
        "communityId": 456,
        "communityName": "Tech Community",
        "communityBanner": "banner.jpg",
        "creatorId": 101,
        "creatorName": "John Doe",
        "creatorEmail": "john@example.com",
        "isHost": false,
        "startTime": "2024-01-15T10:30:00Z"
      }
    ]
  }
  ```

---

# Auth API Documentation

## Base URL
```
/api/auth
```

---

### 1. User Signup

- **Endpoint:** `POST /signup`
- **Description:** Register a new user, partner, admin, or expert with comprehensive validation.
- **Parameters:**
  - Request body: `{ email, password, name, phone, address, pincode, userType, photoURL, location, state, desc }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{
      "email": "john@example.com",
      "password": "Abcd@1234",
      "name": "John Doe",
      "phone": "9876543210",
      "address": "123 Main St",
      "pincode": "560001",
      "userType": "user",
      "location": "Bangalore",
      "state": "Karnataka"
    }'
  ```
- **Example Response:**
  ```json
  {
    "message": "User created successfully",
    "user": {
      "id": 123,
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "9876543210",
      "userType": "user"
    },
    "moodleCredentials": {
      "moodleUserId": 456,
      "username": "9876543210",
      "password": "Abcd@1234"
    }
  }
  ```

---

### 2. User Signin

- **Endpoint:** `POST /signin`
- **Description:** Authenticate user, partner, admin, or expert with unified user system.
- **Parameters:**
  - Request body: `{ email, password }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{
      "email": "john@example.com",
      "password": "Abcd@1234"
    }'
  ```
- **Example Response:**
  ```json
  {
    "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "userType": "user",
      "unifiedUser": {
        "id": 101,
        "email": "john@example.com",
        "userId": 123
      }
    }
  }
  ```

---

### 3. Email Bypass Login

- **Endpoint:** `POST /email-bypass`
- **Description:** Login using only email (no password verification, for special cases).
- **Parameters:**
  - Request body: `{ email, userType }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/email-bypass \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@example.com",
      "userType": "admin"
    }'
  ```
- **Example Response:**
  ```json
  {
    "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 456,
      "name": "Admin User",
      "email": "admin@example.com",
      "userType": "admin",
      "unifiedUser": {
        "id": 102,
        "email": "admin@example.com",
        "adminId": 456
      }
    }
  }
  ```

---

### 4. Refresh Access Token

- **Endpoint:** `POST /refresh-token`
- **Description:** Get new access token using refresh token.
- **Parameters:**
  - Request body: `{ refreshToken }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/refresh-token \
    -H "Content-Type: application/json" \
    -d '{
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }'
  ```
- **Example Response:**
  ```json
  {
    "status": 200,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "message": "Tokens refreshed successfully"
  }
  ```

---

### 5. Regenerate Token

- **Endpoint:** `POST /regenerate-token`
- **Description:** Generate new tokens for any user type (user, admin, partner, expert).
- **Parameters:**
  - Request body: `{ email, userType }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/regenerate-token \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@example.com",
      "userType": "admin"
    }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "Token regenerated successfully",
    "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 456,
      "email": "admin@example.com",
      "name": "Admin User",
      "userType": "admin",
      "unifiedUser": {
        "id": 102,
        "email": "admin@example.com",
        "adminId": 456
      }
    }
  }
  ```

---

### 6. Request Password Reset

- **Endpoint:** `POST /request-password-reset`
- **Description:** Request a password reset email for any user type.
- **Parameters:**
  - Request body: `{ email }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/request-password-reset \
    -H "Content-Type: application/json" \
    -d '{
      "email": "john@example.com"
    }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "If the email exists, a reset link will be sent.",
    "email": "john@example.com",
    "exists": true
  }
  ```

---

### 7. Reset Password

- **Endpoint:** `POST /reset-password`
- **Description:** Reset password using token from email.
- **Parameters:**
  - Request body: `{ token, newPassword }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/reset-password \
    -H "Content-Type: application/json" \
    -d '{
      "token": "reset_token_here",
      "newPassword": "NewPassword123"
    }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "Password changed successfully",
    "email": "john@example.com"
  }
  ```

---

### 8. Change Password

- **Endpoint:** `POST /change-password`
- **Description:** Change password when user knows current password.
- **Parameters:**
  - Request body: `{ email, password, newPassword, userType }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/change-password \
    -H "Content-Type: application/json" \
    -d '{
      "email": "john@example.com",
      "password": "OldPassword123",
      "newPassword": "NewPassword123",
      "userType": "user"
    }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

---

### 9. Send OTP

- **Endpoint:** `POST /send-otp`
- **Description:** Send OTP to user's phone number for verification.
- **Parameters:**
  - Request body: `{ phone }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{
      "phone": "9876543210"
    }'
  ```
- **Example Response:**
  ```json
  {
    "message": "OTP sent successfully"
  }
  ```

---

### 10. Verify OTP

- **Endpoint:** `POST /verify-otp`
- **Description:** Verify OTP and authenticate user.
- **Parameters:**
  - Request body: `{ phone, otp }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d '{
      "phone": "9876543210",
      "otp": "123456"
    }'
  ```
- **Example Response:**
  ```json
  {
    "message": "OTP verified successfully",
    "data": {
      "id": 123,
      "phone": "9876543210",
      "name": "John Doe"
    },
    "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

---

### 11. Bulk Upload Users

- **Endpoint:** `POST /bulk-upload`
- **Description:** Bulk upload users via Excel file (admin only).
- **Parameters:**
  - Form-data: `file` (Excel file), `userType` (user, partner, admin, expert)
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/bulk-upload \
    -F "file=@/path/to/users.xlsx" \
    -F "userType=user"
  ```
- **Example Response:**
  ```json
  {
    "message": "users uploaded successfully",
    "count": 10
  }
  ```

---

### 12. Enroll in Course

- **Endpoint:** `POST /enroll-course`
- **Description:** Enroll a user in a Moodle course.
- **Parameters:**
  - Request body: `{ userId, courseId }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/auth/enroll-course \
    -H "Content-Type: application/json" \
    -d '{
      "userId": 123,
      "courseId": 456
    }'
  ```
- **Example Response:**
  ```json
  {
    "message": "Successfully enrolled in course"
  }
  ```

---

## Error Responses

### Common Error Codes

- **400 Bad Request:** Invalid input data or missing required fields
- **401 Unauthorized:** Invalid credentials or missing authentication
- **403 Forbidden:** Account disabled or insufficient permissions
- **404 Not Found:** User or resource not found
- **409 Conflict:** Email or phone already registered
- **500 Internal Server Error:** Server-side error

### Example Error Response
```json
{
  "success": false,
  "message": "Email already registered.",
  "error": "Validation failed"
}
```

---

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <jwt_token>
```

## Rate Limiting

- OTP endpoints: 5 requests per minute per phone number
- Login endpoints: 10 requests per minute per IP
- General endpoints: 100 requests per minute per IP

## Security Notes

- Passwords are hashed using bcrypt with salt rounds of 10
- JWT tokens expire after 24 hours
- Refresh tokens expire after 7 days
- Password reset tokens expire after 1 hour
- OTP expires after 5 minutes

---

# Community API Documentation

## Base URL
```
/api/community
```

---

### 1. Get All Public Communities
- **Endpoint:** `GET /public`
- **Description:** Get all public, approved, non-archived communities (no authentication required).
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/community/public
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "communities": [
      { "id": 1, "title": "ChefVerse", "desc": "...", "bannerImg": "..." }
    ]
  }
  ```

---

### 2. Get All Communities (Authenticated)
- **Endpoint:** `GET /`
- **Description:** Get all communities with full relationship data (requires authentication).
- **Parameters:**
  - `communityType` (query, optional): Filter by type
  - `initialcommunity` (query, optional): Filter for initial communities
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/community/ -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "communities": [ ... ]
  }
  ```

---

### 3. Create Community
- **Endpoint:** `POST /`
- **Description:** Create a new community (requires authentication).
- **Parameters:**
  - Request body: `{ title, desc, price, bannerImg, ... }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/community/ \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "title": "New Community", "desc": "..." }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "community": { ... }
  }
  ```

---

### 4. Get Community By ID
- **Endpoint:** `GET /:id`
- **Description:** Get detailed info for a specific community (requires authentication).
- **Parameters:**
  - `id` (path): Community ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/community/123 -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "community": { ... }
  }
  ```

---

### 5. Update Community By ID
- **Endpoint:** `PATCH /:id`
- **Description:** Update a community (requires authentication).
- **Parameters:**
  - `id` (path): Community ID
  - Request body: Fields to update
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/community/123 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "desc": "Updated description" }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "community": { ... }
  }
  ```

---

### 6. Delete Community By ID
- **Endpoint:** `DELETE /:id`
- **Description:** Delete a community (requires authentication).
- **Parameters:**
  - `id` (path): Community ID
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/community/123 -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "community": { ... }
  }
  ```

---

### 7. Approve Community
- **Endpoint:** `PATCH /:id/approve`
- **Description:** Approve a pending community (admin only).
- **Parameters:**
  - `id` (path): Community ID
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/community/123/approve -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  { "id": 123, "isApproved": true, ... }
  ```

---

### 8. Get All Pending Communities
- **Endpoint:** `GET /pending`
- **Description:** Get all communities pending approval (admin only).
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/community/pending -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  { "success": true, "communities": [ ... ] }
  ```

---

### 9. Bulk Upload Communities
- **Endpoint:** `POST /bulk-upload`
- **Description:** Bulk upload communities via Excel file (admin only).
- **Parameters:**
  - Form-data: `file` (Excel file)
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/community/bulk-upload \
    -H "Authorization: Bearer <token>" \
    -F "file=@/path/to/communities.xlsx"
  ```
- **Example Response:**
  ```json
  { "message": "Bulk upload completed", "results": { ... } }
  ```

---

### 10. Search Communities (by tag)
- **Endpoint:** `GET /search`
- **Description:** Search communities by tag (public).
- **Parameters:**
  - `tag` (query): Tag name
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/community/search?tag=food"
  ```
- **Example Response:**
  ```json
  { "success": true, "communities": [ ... ] }
  ```

---

### 11. Search Communities (public, by title/desc/tags)
- **Endpoint:** `GET /search-communities-public`
- **Description:** Public search for communities by title, description, or tags.
- **Parameters:**
  - `q` (query): Search string
  - `page` (query, optional)
  - `limit` (query, optional)
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/community/search-communities-public?q=chef"
  ```
- **Example Response:**
  ```json
  { "success": true, "communities": [ ... ], "pagination": { ... } }
  ```

---

### 12. Search Communities (authenticated, by title/desc/tags)
- **Endpoint:** `GET /search-communities`
- **Description:** Authenticated search for communities by title, description, or tags.
- **Parameters:**
  - `q` (query): Search string
  - `page` (query, optional)
  - `limit` (query, optional)
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/community/search-communities?q=chef" -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  { "success": true, "communities": [ ... ], "pagination": { ... } }
  ```

---

### 13. Get Community Activities
- **Endpoint:** `GET /:id/activities`
- **Description:** Get paginated activities (posts, sessions, services, forms, resources, blogs, catchups, subscriptions) for a community.
- **Parameters:**
  - `id` (path): Community ID
  - `page` (query, optional)
  - `limit` (query, optional)
  - `type` (query, optional): Filter by activity type
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/community/123/activities?page=1&limit=10&type=posts"
  ```
- **Example Response:**
  ```json
  { "success": true, "activities": [ ... ], "pagination": { ... } }
  ```

---

### 14. Get Community Sessions
- **Endpoint:** `GET /:id/session`
- **Description:** Get all sessions (and slots) for a community.
- **Parameters:**
  - `id` (path): Community ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/community/123/session -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  { "sessions": [ ... ], "completedSessions": [ ... ], ... }
  ```

---

### 15. Get Community People
- **Endpoint:** `GET /:id/people`
- **Description:** Get all users (with roles) in a community.
- **Parameters:**
  - `id` (path): Community ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/community/123/people -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  { "users": [ ... ] }
  ```

---

### 16. Manage Community Subscriptions
- **Endpoint:** `POST /:id/subscriptions`
- **Description:** Subscribe or unsubscribe a user to a community.
- **Parameters:**
  - `id` (path): Community ID
  - Request body: `{ userId, action: 'subscribe' | 'unsubscribe' }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/community/123/subscriptions \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "userId": 456, "action": "subscribe" }'
  ```
- **Example Response:**
  ```json
  { "success": true, "subscription": { ... } }
  ```

---

### 17. Community Tags & Tag Management
- **Endpoints:**
  - `GET /getalltags` — Get all tags
  - `GET /all-tags-system` — Get all tags in the system (with usage stats)
  - `GET /tags/popular` — Get most popular tags
  - `GET /tags/search` — Search tags by name
  - `GET /tags/suggestions` — Get tag suggestions
  - `POST /tags/bulk` — Bulk create tags
  - `POST /tags` — Create a tag
  - `PATCH /tags/:id` — Update a tag
  - `DELETE /tags/:id` — Delete a tag
  - `GET /tags/:id` — Get tag by ID
  - `GET /tags/:tagId/statistics` — Get tag statistics
  - `GET /by-tag/:tagId` — Get communities by tag ID
- **Description:** Full tag CRUD and analytics for communities.

---

### 18. Partner Community Endpoints
- **Endpoint:** `GET /partner/communities`
- **Description:** Get all communities created by a partner (by partnerId query param).
- **Parameters:**
  - `partnerId` (query): Partner ID
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/community/partner/communities?partnerId=123"
  ```
- **Example Response:**
  ```json
  { "success": true, "communities": [ ... ] }
  ```

---

### 19. Other Endpoints
- **Get recent communities by user:** `GET /recent`
- **Get parent selection options:** `GET /parent-selection`
- **Get community users:** `GET /:id/users`
- **Get community questions:** `GET /:communityId/questions`
- **Get community tags by ID:** `GET /:id/tags`
- **Get community users by subscription:** `GET /:id/userss`

---

# Competitions API Documentation

## Base URL
```
/api/competitions
```

---

### 1. Get All Competitions
- **Endpoint:** `GET /`
- **Description:** Get all competitions (public and private, depending on user role).
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/competitions/
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "competitions": [ ... ]
  }
  ```

---

### 2. Get Competition By ID
- **Endpoint:** `GET /:id`
- **Description:** Get details of a specific competition by ID.
- **Parameters:**
  - `id` (path): Competition ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/competitions/123
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "competition": { ... }
  }
  ```

---

### 3. Create Competition
- **Endpoint:** `POST /`
- **Description:** Create a new competition (admin/partner only).
- **Parameters:**
  - Request body: `{ title, desc, startDate, endDate, ... }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/competitions/ \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "title": "New Competition", "desc": "..." }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "competition": { ... }
  }
  ```

---

### 4. Update Competition By ID
- **Endpoint:** `PATCH /:id`
- **Description:** Update a competition (admin/partner only).
- **Parameters:**
  - `id` (path): Competition ID
  - Request body: Fields to update
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/competitions/123 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "desc": "Updated description" }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "competition": { ... }
  }
  ```

---

### 5. Delete Competition By ID
- **Endpoint:** `DELETE /:id`
- **Description:** Delete a competition (admin/partner only).
- **Parameters:**
  - `id` (path): Competition ID
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/competitions/123 \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "competition": { ... }
  }
  ```

---

### 6. Join Competition
- **Endpoint:** `POST /:id/join`
- **Description:** Join a competition as a user.
- **Parameters:**
  - `id` (path): Competition ID
  - Request body: `{ userId }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/competitions/123/join \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "userId": 456 }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "Joined competition successfully"
  }
  ```

---

### 7. Get Competition Leaderboard
- **Endpoint:** `GET /:id/leaderboard`
- **Description:** Get the leaderboard for a competition.
- **Parameters:**
  - `id` (path): Competition ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/competitions/123/leaderboard
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "leaderboard": [ ... ]
  }
  ```

---

### 8. Get All Competition Participants
- **Endpoint:** `GET /:id/participants`
- **Description:** Get all participants of a competition.
- **Parameters:**
  - `id` (path): Competition ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/competitions/123/participants
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "participants": [ ... ]
  }
  ```

---

### 9. Admin: Approve/Reject Competition
- **Endpoint:** `PATCH /:id/approve`
- **Description:** Approve or reject a competition (admin only).
- **Parameters:**
  - `id` (path): Competition ID
  - Request body: `{ isApproved: true | false }`
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/competitions/123/approve \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "isApproved": true }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "competition": { ... }
  }
  ```

---

### 10. Bulk Upload Competitions
- **Endpoint:** `POST /bulk-upload`
- **Description:** Bulk upload competitions via Excel file (admin only).
- **Parameters:**
  - Form-data: `file` (Excel file)
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/competitions/bulk-upload \
    -H "Authorization: Bearer <token>" \
    -F "file=@/path/to/competitions.xlsx"
  ```
- **Example Response:**
  ```json
  { "message": "Bulk upload completed", "results": { ... } }
  ```

---

# Connections API Documentation

## Base URL
```
/api/connections
```

---

### 1. Get All Connections
- **Endpoint:** `GET /`
- **Description:** Get all connections for the authenticated user.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/connections/ -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "connections": [ ... ]
  }
  ```

---

### 2. Get Connection By ID
- **Endpoint:** `GET /:id`
- **Description:** Get details of a specific connection by ID.
- **Parameters:**
  - `id` (path): Connection ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/connections/123 -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "connection": { ... }
  }
  ```

---

### 3. Create Connection Request
- **Endpoint:** `POST /`
- **Description:** Send a connection request to another user.
- **Parameters:**
  - Request body: `{ receiverId, message }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/connections/ \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "receiverId": 456, "message": "Hi, I would like to connect!" }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "connection": { ... }
  }
  ```

---

### 4. Update Connection By ID
- **Endpoint:** `PATCH /:id`
- **Description:** Update a connection (e.g., accept/reject request).
- **Parameters:**
  - `id` (path): Connection ID
  - Request body: Fields to update
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/connections/123 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "status": "accepted" }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "connection": { ... }
  }
  ```

---

### 5. Delete Connection By ID
- **Endpoint:** `DELETE /:id`
- **Description:** Delete a connection (unfriend/remove connection).
- **Parameters:**
  - `id` (path): Connection ID
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/connections/123 \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "connection": { ... }
  }
  ```

---

### 6. Accept Connection Request
- **Endpoint:** `PATCH /:id/accept`
- **Description:** Accept a pending connection request.
- **Parameters:**
  - `id` (path): Connection ID
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/connections/123/accept \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "connection": { ... }
  }
  ```

---

### 7. Reject Connection Request
- **Endpoint:** `PATCH /:id/reject`
- **Description:** Reject a pending connection request.
- **Parameters:**
  - `id` (path): Connection ID
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/connections/123/reject \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "connection": { ... }
  }
  ```

---

### 8. Get Pending Connection Requests
- **Endpoint:** `GET /pending`
- **Description:** Get all pending connection requests for the authenticated user.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/connections/pending \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "pendingConnections": [ ... ]
  }
  ```

---

### 9. Get Sent Connection Requests
- **Endpoint:** `GET /sent`
- **Description:** Get all connection requests sent by the authenticated user.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/connections/sent \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "sentConnections": [ ... ]
  }
  ```

---

### 10. Get Mutual Connections
- **Endpoint:** `GET /mutual/:userId`
- **Description:** Get mutual connections between the authenticated user and another user.
- **Parameters:**
  - `userId` (path): User ID to find mutual connections with
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/connections/mutual/456 \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "mutualConnections": [ ... ]
  }
  ```

---

### 11. Get Connection Suggestions
- **Endpoint:** `GET /suggestions`
- **Description:** Get connection suggestions for the authenticated user.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/connections/suggestions \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "suggestions": [ ... ]
  }
  ```

---

### 12. Get Connection Statistics
- **Endpoint:** `GET /statistics`
- **Description:** Get connection statistics for the authenticated user.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/connections/statistics \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "statistics": {
      "totalConnections": 50,
      "pendingRequests": 5,
      "sentRequests": 3
    }
  }
  ```

---

### 13. Bulk Operations
- **Endpoints:**
  - `POST /bulk-accept` — Accept multiple connection requests
  - `POST /bulk-reject` — Reject multiple connection requests
  - `POST /bulk-delete` — Delete multiple connections
- **Description:** Perform bulk operations on connections.
- **Parameters:**
  - Request body: `{ connectionIds: [1, 2, 3] }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/connections/bulk-accept \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "connectionIds": [123, 124, 125] }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "Bulk operation completed",
    "results": { ... }
  }
  ```

---

# Expert API Documentation

## Base URL
```
/api/expert
```

---

### 1. Get All Experts
- **Endpoint:** `GET /`
- **Description:** Get all experts with pagination and filtering options.
- **Parameters:**
  - `page` (query, optional): Page number
  - `limit` (query, optional): Items per page
  - `search` (query, optional): Search term
  - `category` (query, optional): Filter by category
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/expert/?page=1&limit=10&search=chef"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "experts": [ ... ],
    "pagination": { ... }
  }
  ```

---

### 2. Get Expert By ID
- **Endpoint:** `GET /:id`
- **Description:** Get detailed information about a specific expert.
- **Parameters:**
  - `id` (path): Expert ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/expert/123
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "expert": { ... }
  }
  ```

---

### 3. Create Expert Profile
- **Endpoint:** `POST /`
- **Description:** Create a new expert profile (requires authentication).
- **Parameters:**
  - Request body: `{ name, bio, expertise, experience, ... }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/expert/ \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "name": "Chef John", "bio": "Professional chef", "expertise": "Cooking" }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "expert": { ... }
  }
  ```

---

### 4. Update Expert Profile
- **Endpoint:** `PATCH /:id`
- **Description:** Update an expert profile (requires authentication).
- **Parameters:**
  - `id` (path): Expert ID
  - Request body: Fields to update
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/expert/123 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "bio": "Updated bio" }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "expert": { ... }
  }
  ```

---

### 5. Delete Expert Profile
- **Endpoint:** `DELETE /:id`
- **Description:** Delete an expert profile (requires authentication).
- **Parameters:**
  - `id` (path): Expert ID
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/expert/123 \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "expert": { ... }
  }
  ```

---

### 6. Get Expert Sessions
- **Endpoint:** `GET /:id/sessions`
- **Description:** Get all sessions conducted by an expert.
- **Parameters:**
  - `id` (path): Expert ID
  - `status` (query, optional): Filter by session status
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/expert/123/sessions?status=upcoming"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "sessions": [ ... ]
  }
  ```

---

### 7. Get Expert Services
- **Endpoint:** `GET /:id/services`
- **Description:** Get all services offered by an expert.
- **Parameters:**
  - `id` (path): Expert ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/expert/123/services
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "services": [ ... ]
  }
  ```

---

### 8. Get Expert Reviews
- **Endpoint:** `GET /:id/reviews`
- **Description:** Get all reviews for an expert.
- **Parameters:**
  - `id` (path): Expert ID
  - `page` (query, optional): Page number
  - `limit` (query, optional): Items per page
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/expert/123/reviews?page=1&limit=10"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "reviews": [ ... ],
    "pagination": { ... }
  }
  ```

---

### 9. Search Experts
- **Endpoint:** `GET /search`
- **Description:** Search experts by name, expertise, or other criteria.
- **Parameters:**
  - `q` (query): Search query
  - `category` (query, optional): Filter by category
  - `page` (query, optional): Page number
  - `limit` (query, optional): Items per page
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/expert/search?q=chef&category=cooking&page=1&limit=10"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "experts": [ ... ],
    "pagination": { ... }
  }
  ```

---

### 10. Get Expert Categories
- **Endpoint:** `GET /categories`
- **Description:** Get all available expert categories.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/expert/categories
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "categories": [ ... ]
  }
  ```

---

### 11. Admin: Approve Expert
- **Endpoint:** `PATCH /:id/approve`
- **Description:** Approve an expert profile (admin only).
- **Parameters:**
  - `id` (path): Expert ID
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/expert/123/approve \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "expert": { ... }
  }
  ```

---

### 12. Admin: Get Pending Experts
- **Endpoint:** `GET /pending`
- **Description:** Get all experts pending approval (admin only).
- **Parameters:**
  - `page` (query, optional): Page number
  - `limit` (query, optional): Items per page
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/expert/pending?page=1&limit=10" \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "experts": [ ... ],
    "pagination": { ... }
  }
  ```

---

### 13. Bulk Upload Experts
- **Endpoint:** `POST /bulk-upload`
- **Description:** Bulk upload experts via Excel file (admin only).
- **Parameters:**
  - Form-data: `file` (Excel file)
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/expert/bulk-upload \
    -H "Authorization: Bearer <token>" \
    -F "file=@/path/to/experts.xlsx"
  ```
- **Example Response:**
  ```json
  { "message": "Bulk upload completed", "results": { ... } }
  ```

---

### 14. Get Expert Statistics
- **Endpoint:** `GET /:id/statistics`
- **Description:** Get statistics for an expert (sessions, reviews, earnings, etc.).
- **Parameters:**
  - `id` (path): Expert ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/expert/123/statistics
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "statistics": {
      "totalSessions": 50,
      "averageRating": 4.5,
      "totalEarnings": 5000,
      "totalReviews": 25
    }
  }
  ```

---

### 15. Get Featured Experts
- **Endpoint:** `GET /featured`
- **Description:** Get featured/promoted experts.
- **Parameters:**
  - `limit` (query, optional): Number of experts to return
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/expert/featured?limit=5"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "experts": [ ... ]
  }
  ```

---

### 16. Other Endpoints
- **Get expert by user ID:** `GET /user/:userId`
- **Get expert availability:** `GET /:id/availability`
- **Update expert availability:** `PATCH /:id/availability`
- **Get expert earnings:** `GET /:id/earnings`
- **Get expert schedule:** `GET /:id/schedule`

---

# Admin API Documentation

## Base URL
```
/api/admin
```

---

### 1. Get All Admins
- **Endpoint:** `GET /`
- **Description:** Get all admin users (SuperAdmin only).
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/admin/ -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "admins": [
      {
        "id": 1,
        "name": "Admin User",
        "email": "admin@example.com",
        "phone": "9876543210"
      }
    ]
  }
  ```

---

### 2. Get Admin By ID
- **Endpoint:** `GET /:id`
- **Description:** Get detailed information about a specific admin.
- **Parameters:**
  - `id` (path): Admin ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/admin/123 -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "admin": {
      "id": 123,
      "name": "Admin User",
      "email": "admin@example.com",
      "phone": "9876543210"
    }
  }
  ```

---

### 3. Create Admin
- **Endpoint:** `POST /`
- **Description:** Create a new admin user.
- **Parameters:**
  - Request body: `{ admin: { email, name, phone, address, pincode, password } }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/admin/ \
    -H "Content-Type: application/json" \
    -d '{
      "admin": {
        "email": "newadmin@example.com",
        "name": "New Admin",
        "phone": "9876543210",
        "address": "123 Admin St",
        "pincode": "560001"
      }
    }'
  ```
- **Example Response:**
  ```json
  {
    "admin": {
      "email": "newadmin@example.com",
      "name": "New Admin",
      "phone": "9876543210"
    },
    "created_admin": {
      "id": 124,
      "email": "newadmin@example.com",
      "name": "New Admin"
    }
  }
  ```

---

### 4. Update Admin
- **Endpoint:** `PATCH /:id`
- **Description:** Update an admin user (Admin only).
- **Parameters:**
  - `id` (path): Admin ID
  - Request body: Fields to update
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/admin/123 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "name": "Updated Admin Name" }'
  ```
- **Example Response:**
  ```json
  {
    "admin": {
      "id": 123,
      "name": "Updated Admin Name",
      "email": "admin@example.com"
    }
  }
  ```

---

### 5. Create Users Bulk
- **Endpoint:** `POST /create/user`
- **Description:** Create multiple users in bulk (Admin only).
- **Parameters:**
  - Request body: `{ users: [{ email, name, phone, address, pincode, password? }] }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/admin/create/user \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "users": [
        {
          "email": "user1@example.com",
          "name": "User One",
          "phone": "9876543210",
          "address": "123 User St",
          "pincode": "560001"
        }
      ]
    }'
  ```
- **Example Response:**
  ```json
  {
    "users": [
      {
        "email": "user1@example.com",
        "name": "User One",
        "phone": "9876543210",
        "password": "generated_password"
      }
    ],
    "result": [
      {
        "id": 456,
        "email": "user1@example.com",
        "name": "User One"
      }
    ]
  }
  ```

---

### 6. Create Experts Bulk
- **Endpoint:** `POST /create/expert`
- **Description:** Create multiple experts in bulk (Authenticated users).
- **Parameters:**
  - Request body: `{ expert: [{ email, name, phone, address, pincode, desc, password? }] }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/admin/create/expert \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "expert": [
        {
          "email": "expert1@example.com",
          "name": "Expert One",
          "phone": "9876543210",
          "address": "123 Expert St",
          "pincode": "560001",
          "desc": "Professional expert"
        }
      ]
    }'
  ```
- **Example Response:**
  ```json
  {
    "expert": [
      {
        "email": "expert1@example.com",
        "name": "Expert One",
        "phone": "9876543210",
        "password": "generated_password"
      }
    ],
    "result": [
      {
        "id": 789,
        "email": "expert1@example.com",
        "name": "Expert One"
      }
    ]
  }
  ```

---

### 7. Get Admin Sessions
- **Endpoint:** `GET /:id/session`
- **Description:** Get all sessions created by an admin (Admin only).
- **Parameters:**
  - `id` (path): Admin ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/admin/123/session -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "sessions": [
      {
        "id": 1,
        "title": "Admin Session",
        "creatorId": 123
      }
    ],
    "completedSessions": []
  }
  ```

---

### 8. Create Form
- **Endpoint:** `POST /forms`
- **Description:** Create a custom form.
- **Parameters:**
  - Request body: `{ formName, adminId, formLink, formImg, formDesc }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/admin/forms \
    -H "Content-Type: application/json" \
    -d '{
      "formName": "Feedback Form",
      "adminId": 123,
      "formLink": "https://forms.google.com/abc",
      "formImg": "form-image.jpg",
      "formDesc": "Please provide your feedback"
    }'
  ```
- **Example Response:**
  ```json
  {
    "id": 1,
    "formName": "Feedback Form",
    "adminId": 123,
    "formLink": "https://forms.google.com/abc"
  }
  ```

---

### 9. Get Community Users
- **Endpoint:** `GET /community/:communityId/users`
- **Description:** Get all users (subscribers and non-subscribers) for a community.
- **Parameters:**
  - `communityId` (path): Community ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/admin/community/123/users -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "data": {
      "subscribers": [
        {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com",
          "userType": "user",
          "isSubscribed": true,
          "photoURL": "profile.jpg",
          "subscription": {
            "startDate": "2024-01-01T00:00:00Z",
            "endDate": "2024-02-01T00:00:00Z",
            "subscriptionId": 1
          }
        }
      ],
      "nonSubscribers": [
        {
          "id": 2,
          "name": "Jane Smith",
          "email": "jane@example.com",
          "userType": "user",
          "isSubscribed": false,
          "photoURL": "profile.jpg",
          "subscription": null
        }
      ],
      "total": {
        "all": 2,
        "subscribed": 1,
        "nonSubscribed": 1
      }
    }
  }
  ```

---

### 10. Manage Community Subscriptions
- **Endpoint:** `POST /community/:communityId/subscriptions`
- **Description:** Add or remove multiple users from community subscriptions.
- **Parameters:**
  - `communityId` (path): Community ID
  - Request body: `{ action: "add" | "remove", userIds: [1, 2, 3], durationInMonths?: 1 }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/admin/community/123/subscriptions \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "action": "add",
      "userIds": [1, 2, 3],
      "durationInMonths": 3
    }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "Bulk add process completed",
    "community": {
      "id": 123,
      "title": "Tech Community"
    },
    "results": {
      "successful": [
        {
          "userId": 1,
          "subscriptionId": 1,
          "startDate": "2024-01-15T10:30:00Z",
          "endDate": "2024-04-15T10:30:00Z",
          "communityId": 123,
          "communityTitle": "Tech Community"
        }
      ],
      "failed": [],
      "summary": {
        "total": 1,
        "successful": 1,
        "failed": 0
      }
    }
  }
  ```

---

# Moodle API Documentation

## Base URL
```
/api/moodle
```

---

### 1. Get All Courses
- **Endpoint:** `GET /courses`
- **Description:** Get all courses from the database with community relationships.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/moodle/courses
  ```
- **Example Response:**
  ```json
  [
    {
      "id": 1,
      "moodleCourseId": 123,
      "name": "Introduction to Programming",
      "description": "Learn programming basics",
      "status": "active",
      "price": 1000,
      "discount": 100,
      "image": "course-image.jpg",
      "communities": [
        {
          "id": 1,
          "title": "Tech Community"
        }
      ]
    }
  ]
  ```

---

### 2. Get All Moodle Courses
- **Endpoint:** `GET /courses/moodle`
- **Description:** Get all courses directly from Moodle API.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/moodle/courses/moodle
  ```
- **Example Response:**
  ```json
  [
    {
      "id": 123,
      "fullname": "Introduction to Programming",
      "shortname": "PROG101",
      "summary": "Learn programming basics",
      "courseimage": "course-image.jpg"
    }
  ]
  ```

---

### 3. Enroll User in Course
- **Endpoint:** `POST /courses/enroll`
- **Description:** Enroll a user in a course with optional payment.
- **Parameters:**
  - Request body: `{ userId, courseId, transactionId? }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/moodle/courses/enroll \
    -H "Content-Type: application/json" \
    -d '{
      "userId": 456,
      "courseId": 123,
      "transactionId": 789
    }'
  ```
- **Example Response:**
  ```json
  {
    "message": "Course enrollment completed successfully",
    "subscription": {
      "id": 1,
      "courseId": 123,
      "unifiedUserId": 101,
      "startsAt": "2024-01-15T10:30:00Z",
      "expiresAt": "2025-01-15T10:30:00Z"
    }
  }
  ```

---

### 4. Create Course
- **Endpoint:** `POST /courses`
- **Description:** Create a new course in both Moodle and local database.
- **Parameters:**
  - Request body: `{ name, description, status, price, discount, creatorId, communityId }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/moodle/courses \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Advanced Programming",
      "description": "Advanced programming concepts",
      "status": "active",
      "price": 2000,
      "discount": 200,
      "creatorId": 123,
      "communityId": 1
    }'
  ```
- **Example Response:**
  ```json
  {
    "id": 2,
    "moodleCourseId": 124,
    "name": "Advanced Programming",
    "description": "Advanced programming concepts",
    "status": "active",
    "price": 2000,
    "discount": 200,
    "communities": [
      {
        "id": 1,
        "title": "Tech Community"
      }
    ]
  }
  ```

---

### 5. Get Course By ID
- **Endpoint:** `GET /courses/:id`
- **Description:** Get detailed course information by ID.
- **Parameters:**
  - `id` (path): Course ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/moodle/courses/123
  ```
- **Example Response:**
  ```json
  {
    "id": 123,
    "moodleCourseId": 456,
    "name": "Introduction to Programming",
    "description": "Learn programming basics",
    "status": "active",
    "price": 1000,
    "discount": 100,
    "image": "course-image.jpg",
    "communities": [],
    "moodleDetails": {
      "fullname": "Introduction to Programming",
      "shortname": "PROG101",
      "summary": "Learn programming basics",
      "courseimage": "course-image.jpg",
      "startdate": 1642204800,
      "enddate": 1673740800,
      "categoryid": 1,
      "progress": 0
    }
  }
  ```

---

### 6. Update Course
- **Endpoint:** `PUT /courses/:id`
- **Description:** Update a course in both Moodle and local database.
- **Parameters:**
  - `id` (path): Course ID
  - Request body: `{ name, description, status, communityId }`
- **Example Request:**
  ```bash
  curl -X PUT http://localhost:5000/api/moodle/courses/123 \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Updated Course Name",
      "description": "Updated description",
      "status": "active",
      "communityId": 1
    }'
  ```
- **Example Response:**
  ```json
  {
    "id": 123,
    "name": "Updated Course Name",
    "description": "Updated description",
    "status": "active",
    "communities": [
      {
        "id": 1,
        "title": "Tech Community"
      }
    ]
  }
  ```

---

### 7. Delete Course
- **Endpoint:** `DELETE /courses/:id`
- **Description:** Delete a course from the database.
- **Parameters:**
  - `id` (path): Course ID
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/moodle/courses/123
  ```
- **Example Response:**
  ```
  HTTP 204 No Content
  ```

---

### 8. Get Courses by Community
- **Endpoint:** `GET /community/:communityId/courses`
- **Description:** Get all courses associated with a specific community.
- **Parameters:**
  - `communityId` (path): Community ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/moodle/community/1/courses
  ```
- **Example Response:**
  ```json
  [
    {
      "id": 1,
      "name": "Introduction to Programming",
      "communities": [
        {
          "id": 1,
          "title": "Tech Community"
        }
      ]
    }
  ]
  ```

---

### 9. Get Course Details
- **Endpoint:** `GET /courses/:courseId/details`
- **Description:** Get detailed course information with progress tracking.
- **Parameters:**
  - `courseId` (path): Course ID
  - `userId` (query, optional): User ID for progress tracking
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/moodle/courses/123/details?userId=456"
  ```
- **Example Response:**
  ```json
  {
    "id": 123,
    "fullname": "Introduction to Programming",
    "shortname": "PROG101",
    "summary": "Learn programming basics",
    "courseimage": "course-image.jpg",
    "completion": {
      "completionstatus": {
        "completed": false,
        "aggregation": 1
      }
    }
  }
  ```

---

### 10. Get Course Contents
- **Endpoint:** `GET /courses/:courseId/contents`
- **Description:** Get the contents/structure of a course.
- **Parameters:**
  - `courseId` (path): Course ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/moodle/courses/123/contents
  ```
- **Example Response:**
  ```json
  [
    {
      "id": 1,
      "name": "Week 1: Introduction",
      "modules": [
        {
          "id": 1,
          "name": "Welcome Video",
          "type": "video"
        }
      ]
    }
  ]
  ```

---

### 11. Get User Enrolled Courses
- **Endpoint:** `GET /users/:userId/enrolled-courses`
- **Description:** Get all courses a user is enrolled in.
- **Parameters:**
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/moodle/users/456/enrolled-courses
  ```
- **Example Response:**
  ```json
  [
    {
      "id": 1,
      "moodleCourseId": 123,
      "name": "Introduction to Programming",
      "shortname": "PROG101",
      "courseimage": "course-image.jpg",
      "price": 1000,
      "discount": 100,
      "progress": 25,
      "communities": []
    }
  ]
  ```

---

### 12. Get User Not Enrolled Courses
- **Endpoint:** `GET /users/:userId/not-enrolled-courses`
- **Description:** Get all courses a user is not enrolled in.
- **Parameters:**
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/moodle/users/456/not-enrolled-courses
  ```
- **Example Response:**
  ```json
  [
    {
      "id": 2,
      "moodleCourseId": 124,
      "name": "Advanced Programming",
      "shortname": "PROG201",
      "courseimage": "course-image.jpg",
      "price": 2000,
      "discount": 200,
      "progress": 0,
      "communities": []
    }
  ]
  ```

---

### 13. Get Course Enrolled Users
- **Endpoint:** `GET /courses/:courseId/users`
- **Description:** Get all users enrolled in a specific course.
- **Parameters:**
  - `courseId` (path): Course ID
  - `count` (query, optional): Return only count
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/moodle/courses/123/users?count=true"
  ```
- **Example Response:**
  ```json
  {
    "count": 25
  }
  ```

---

### 14. Get User Enrollment Status
- **Endpoint:** `GET /courses/:courseId/users/:userId/status`
- **Description:** Check if a user is enrolled in a specific course.
- **Parameters:**
  - `courseId` (path): Course ID
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/moodle/courses/123/users/456/status
  ```
- **Example Response:**
  ```json
  {
    "isEnrolled": true
  }
  ```

---

### 15. Get Moodle Session URL
- **Endpoint:** `GET /users/:userId/token`
- **Description:** Get a direct login URL for a user to access Moodle.
- **Parameters:**
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/moodle/users/456/token
  ```
- **Example Response:**
  ```json
  {
    "loginUrl": "https://moodle.example.com/login/token.php?token=abc123"
  }
  ```

---

### 16. Unenroll User from Course
- **Endpoint:** `POST /courses/unenroll`
- **Description:** Remove a user from a course enrollment.
- **Parameters:**
  - Request body: `{ userId, courseId }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/moodle/courses/unenroll \
    -H "Content-Type: application/json" \
    -d '{
      "userId": 456,
      "courseId": 123
    }'
  ```
- **Example Response:**
  ```json
  {
    "message": "User unenrolled successfully"
  }
  ```

---

### 17. Request User Key Login URL
- **Endpoint:** `POST /auth/userkey/request_login_url`
- **Description:** Request a secure login URL for a user using Moodle's user key system.
- **Parameters:**
  - Request body: `{ user: { username } }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/moodle/auth/userkey/request_login_url \
    -H "Content-Type: application/json" \
    -d '{
      "user": {
        "username": "user123"
      }
    }'
  ```
- **Example Response:**
  ```json
  {
    "loginurl": "https://moodle.example.com/auth/userkey/login.php?key=abc123"
  }
  ```

---

### 18. Create Course Payment Order
- **Endpoint:** `POST /courses/payment/order`
- **Description:** Create a Razorpay payment order for course enrollment.
- **Parameters:**
  - Request body: `{ userId, courseId, amount? }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/moodle/courses/payment/order \
    -H "Content-Type: application/json" \
    -d '{
      "userId": 456,
      "courseId": 123,
      "amount": 1000
    }'
  ```
- **Example Response:**
  ```json
  {
    "orderId": "order_abc123",
    "amount": 100000,
    "currency": "INR",
    "transactionId": 789
  }
  ```

---

### 19. Verify Course Payment
- **Endpoint:** `POST /courses/payment/verify`
- **Description:** Verify Razorpay payment and complete course enrollment.
- **Parameters:**
  - Request body: `{ userId, courseId, razorpay_order_id, razorpay_payment_id, razorpay_signature }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/moodle/courses/payment/verify \
    -H "Content-Type: application/json" \
    -d '{
      "userId": 456,
      "courseId": 123,
      "razorpay_order_id": "order_abc123",
      "razorpay_payment_id": "pay_xyz789",
      "razorpay_signature": "signature_hash"
    }'
  ```
- **Example Response:**
  ```json
  {
    "message": "Course enrollment completed successfully",
    "subscription": {
      "id": 1,
      "courseId": 123,
      "unifiedUserId": 101
    }
  }
  ```

---

### 20. Sync Moodle Courses
- **Endpoint:** `GET /sync-courses`
- **Description:** Synchronize courses from Moodle to local database.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/moodle/sync-courses
  ```
- **Example Response:**
  ```json
  {
    "message": "Course sync completed",
    "results": {
      "added": 5,
      "updated": 2,
      "skipped": 10,
      "errors": []
    }
  }
  ```

---

### 21. Map Moodle Courses
- **Endpoint:** `POST /courses/map`
- **Description:** Map selected Moodle courses with pricing and community associations.
- **Parameters:**
  - Request body: `{ courses: [{ moodleCourseId, price, discount, communityId, creatorId }] }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/moodle/courses/map \
    -H "Content-Type: application/json" \
    -d '{
      "courses": [
        {
          "moodleCourseId": 123,
          "price": 1000,
          "discount": 100,
          "communityId": 1,
          "creatorId": 456
        }
      ]
    }'
  ```
- **Example Response:**
  ```json
  {
    "message": "Course mapping completed",
    "results": {
      "mapped": 1,
      "errors": []
    }
  }
  ```

---

### 22. Create Moodle Accounts for All Users
- **Endpoint:** `POST /users/create-moodle-accounts`
- **Description:** Create Moodle accounts for all users who don't have one.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/moodle/users/create-moodle-accounts
  ```
- **Example Response:**
  ```json
  {
    "message": "Moodle account creation completed",
    "results": {
      "created": 25,
      "failed": 2,
      "errors": [
        {
          "userId": 123,
          "error": "User already exists in Moodle"
        }
      ]
    }
  }
  ```

---

### 23. Remove Course Registration
- **Endpoint:** `DELETE /courses/:courseId/users/:userId/registration`
- **Description:** Remove a user's course registration (cannot remove paid courses).
- **Parameters:**
  - `courseId` (path): Course ID
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/moodle/courses/123/users/456/registration
  ```
- **Example Response:**
  ```json
  {
    "message": "Course registration removed successfully"
  }
  ```

---

### 24. Enroll in Paid Course
- **Endpoint:** `POST /courses/:courseId/enroll-paid`
- **Description:** Create a payment order for a paid course enrollment.
- **Parameters:**
  - `courseId` (path): Course ID
  - Request body: `{ userId }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/moodle/courses/123/enroll-paid \
    -H "Content-Type: application/json" \
    -d '{
      "userId": 456
    }'
  ```
- **Example Response:**
  ```json
  {
    "message": "Payment order created successfully",
    "orderId": "order_abc123",
    "amount": 100000,
    "currency": "INR",
    "transactionId": 789
  }
  ```

---

### 25. Verify Paid Course Enrollment
- **Endpoint:** `POST /courses/:courseId/verify-paid-enrollment`
- **Description:** Verify payment and complete paid course enrollment.
- **Parameters:**
  - `courseId` (path): Course ID
  - Request body: `{ userId, razorpay_order_id, razorpay_payment_id, razorpay_signature }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/moodle/courses/123/verify-paid-enrollment \
    -H "Content-Type: application/json" \
    -d '{
      "userId": 456,
      "razorpay_order_id": "order_abc123",
      "razorpay_payment_id": "pay_xyz789",
      "razorpay_signature": "signature_hash"
    }'
  ```
- **Example Response:**
  ```json
  {
    "message": "Course enrollment verified and completed successfully",
    "subscription": {
      "id": 1,
      "courseId": 123,
      "unifiedUserId": 101
    }
  }
  ```

---

### 26. Get Course Registration Status
- **Endpoint:** `GET /courses/:courseId/users/:userId/registration-status`
- **Description:** Check the registration status of a user for a specific course.
- **Parameters:**
  - `courseId` (path): Course ID
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/moodle/courses/123/users/456/registration-status
  ```
- **Example Response:**
  ```json
  {
    "courseId": 123,
    "courseName": "Introduction to Programming",
    "isPaidCourse": true,
    "coursePrice": 1000,
    "registrationStatus": {
      "isRegistered": true,
      "isMoodleEnrolled": true,
      "subscriptionDetails": {
        "startDate": "2024-01-15T10:30:00Z",
        "endDate": "2025-01-15T10:30:00Z",
        "isActive": true,
        "paymentStatus": "completed"
      }
    }
  }
  ```

---

### 27. Remove All Course Registrations
- **Endpoint:** `DELETE /courses/:courseId/registrations`
- **Description:** Remove all user registrations from a course (admin only).
- **Parameters:**
  - `courseId` (path): Course ID
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/moodle/courses/123/registrations
  ```
- **Example Response:**
  ```json
  {
    "message": "All course registrations removed successfully",
    "summary": {
      "totalRegistrations": 25,
      "paidRegistrations": 10,
      "unpaidRegistrations": 15,
      "moodleUsersRemoved": 20,
      "courseId": 123,
      "courseName": "Introduction to Programming"
    },
    "warning": "Some paid subscriptions were removed. Consider refunding these users."
  }
  ```

---

### 28. Get Course Subscriptions
- **Endpoint:** `GET /courses/:courseId/subscriptions`
- **Description:** Get all subscriptions for a specific course.
- **Parameters:**
  - `courseId` (path): Course ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/moodle/courses/123/subscriptions
  ```
- **Example Response:**
  ```json
  [
    {
      "id": 1,
      "courseId": 123,
      "unifiedUserId": 101,
      "startsAt": "2024-01-15T10:30:00Z",
      "expiresAt": "2025-01-15T10:30:00Z",
      "unifiedUser": {
        "id": 101,
        "email": "user@example.com"
      },
      "transaction": {
        "id": 789,
        "status": "completed",
        "amount": 1000
      }
    }
  ]
  ```

---

### 29. Get User Course Subscriptions
- **Endpoint:** `GET /users/:userId/course-subscriptions`
- **Description:** Get all course subscriptions for a specific user.
- **Parameters:**
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/moodle/users/456/course-subscriptions
  ```
- **Example Response:**
  ```json
  [
    {
      "id": 1,
      "courseId": 123,
      "unifiedUserId": 101,
      "startsAt": "2024-01-15T10:30:00Z",
      "expiresAt": "2025-01-15T10:30:00Z",
      "course": {
        "id": 123,
        "name": "Introduction to Programming",
        "price": 1000
      },
      "transaction": {
        "id": 789,
        "status": "completed",
        "amount": 1000
      }
    }
  ]
  ```

---

### 30. Update Course
- **Endpoint:** `PUT /courses/:courseId/update`
- **Description:** Update a course (alternative endpoint).
- **Parameters:**
  - `courseId` (path): Course ID
  - Request body: Fields to update
- **Example Request:**
  ```bash
  curl -X PUT http://localhost:5000/api/moodle/courses/123/update \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Updated Course Name",
      "description": "Updated description"
    }'
  ```
- **Example Response:**
  ```json
  {
    "id": 123,
    "name": "Updated Course Name",
    "description": "Updated description"
  }
  ```

---

# Notifications API Documentation

## Base URL
```
/api/notifications
```

---

### 1. Create Notification
- **Endpoint:** `POST /`
- **Description:** Create a new notification.
- **Parameters:**
  - Request body: Notification data object
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/notifications/ \
    -H "Content-Type: application/json" \
    -d '{
      "recipientId": 123,
      "type": "SESSION_REMINDER",
      "title": "Session Reminder",
      "message": "Your session starts in 30 minutes",
      "metadata": {
        "sessionId": 456,
        "sessionTitle": "Introduction to Programming"
      }
    }'
  ```
- **Example Response:**
  ```json
  {
    "id": 1,
    "recipientId": 123,
    "type": "SESSION_REMINDER",
    "title": "Session Reminder",
    "message": "Your session starts in 30 minutes",
    "status": "unread",
    "createdAt": "2024-01-15T10:30:00Z"
  }
  ```

---

### 2. Get User Notifications
- **Endpoint:** `GET /`
- **Description:** Get notifications for a specific user with filtering and pagination.
- **Parameters:**
  - `userId` (query, required): User ID
  - `status` (query, optional): Filter by status (read, unread)
  - `type` (query, optional): Filter by notification type
  - `page` (query, optional): Page number (default: 1)
  - `limit` (query, optional): Items per page (default: 10)
  - `includeRelations` (query, optional): Include related data (default: false)
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/notifications/?userId=123&status=unread&page=1&limit=20"
  ```
- **Example Response:**
  ```json
  {
    "notifications": [
      {
        "id": 1,
        "recipientId": 123,
        "type": "SESSION_REMINDER",
        "title": "Session Reminder",
        "message": "Your session starts in 30 minutes",
        "status": "unread",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

---

### 3. Get Community Notifications
- **Endpoint:** `GET /community`
- **Description:** Get all notifications for a specific community.
- **Parameters:**
  - `communityId` (query, required): Community ID
  - `status` (query, optional): Filter by status
  - `type` (query, optional): Filter by notification type
  - `page` (query, optional): Page number (default: 1)
  - `limit` (query, optional): Items per page (default: 10)
  - `includeRelations` (query, optional): Include related data (default: false)
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/notifications/community?communityId=456&page=1&limit=10"
  ```
- **Example Response:**
  ```json
  {
    "notifications": [
      {
        "id": 2,
        "communityId": 456,
        "type": "NEW_MEMBER",
        "title": "New Member Joined",
        "message": "John Doe joined the community",
        "status": "unread",
        "createdAt": "2024-01-15T09:15:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

---

### 4. Mark Notification as Read
- **Endpoint:** `PATCH /:notificationId/read`
- **Description:** Mark a specific notification as read.
- **Parameters:**
  - `notificationId` (path): Notification ID
  - `userId` (query, required): User ID
- **Example Request:**
  ```bash
  curl -X PATCH "http://localhost:5000/api/notifications/1/read?userId=123"
  ```
- **Example Response:**
  ```json
  {
    "message": "Notification marked as read"
  }
  ```

---

### 5. Mark All Notifications as Read
- **Endpoint:** `PATCH /read-all`
- **Description:** Mark all notifications for a user as read.
- **Parameters:**
  - `userId` (query, required): User ID
- **Example Request:**
  ```bash
  curl -X PATCH "http://localhost:5000/api/notifications/read-all?userId=123"
  ```
- **Example Response:**
  ```json
  {
    "message": "All notifications marked as read"
  }
  ```

---

### 6. Archive Notification
- **Endpoint:** `PATCH /:notificationId/archive`
- **Description:** Archive a specific notification.
- **Parameters:**
  - `notificationId` (path): Notification ID
  - `userId` (query, required): User ID
- **Example Request:**
  ```bash
  curl -X PATCH "http://localhost:5000/api/notifications/1/archive?userId=123"
  ```
- **Example Response:**
  ```json
  {
    "message": "Notification archived successfully"
  }
  ```

---

### 7. Delete Notification
- **Endpoint:** `DELETE /:notificationId`
- **Description:** Delete a specific notification.
- **Parameters:**
  - `notificationId` (path): Notification ID
  - `userId` (query, required): User ID
- **Example Request:**
  ```bash
  curl -X DELETE "http://localhost:5000/api/notifications/1?userId=123"
  ```
- **Example Response:**
  ```json
  {
    "message": "Notification deleted successfully"
  }
  ```

---

# Partner API Documentation

## Base URL
```
/api/partner
```

---

### 1. Get All Partners
- **Endpoint:** `GET /`
- **Description:** Get all partners with statistics (active and inactive).
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/partner/
  ```
- **Example Response:**
  ```json
  {
    "activePartners": [
      {
        "id": 1,
        "name": "Tech Partner",
        "email": "tech@partner.com",
        "phone": "9876543210",
        "credits": 100,
        "unifiedUserId": {
          "id": 101,
          "isActive": true
        },
        "statistics": {
          "sessions": {
            "total": 5
          },
          "communities": {
            "created": 2,
            "subscribed": 3
          },
          "resources": {
            "total": 10
          }
        }
      }
    ],
    "inactivePartners": []
  }
  ```

---

### 2. Create Partner
- **Endpoint:** `POST /`
- **Description:** Create a new partner (Admin only).
- **Parameters:**
  - Request body: `{ email, name, phone, address, pincode, photoURL?, desc?, password? }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/partner/ \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "newpartner@example.com",
      "name": "New Partner",
      "phone": "9876543210",
      "address": "123 Partner St",
      "pincode": "560001",
      "desc": "Professional partner"
    }'
  ```
- **Example Response:**
  ```json
  {
    "message": "Partner created successfully",
    "partner": {
      "id": 2,
      "email": "newpartner@example.com",
      "name": "New Partner",
      "phone": "9876543210",
      "photoURL": "profile.jpg",
      "credits": 0
    },
    "credentials": {
      "email": "newpartner@example.com",
      "password": "Abcd@123"
    }
  }
  ```

---

### 3. Bulk Upload Partners
- **Endpoint:** `POST /bulk-upload`
- **Description:** Bulk upload partners from Excel file (Admin only).
- **Parameters:**
  - Form-data: `file` (Excel file)
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/partner/bulk-upload \
    -H "Authorization: Bearer <token>" \
    -F "file=@/path/to/partners.xlsx"
  ```
- **Example Response:**
  ```json
  {
    "message": "Bulk partner upload completed",
    "summary": {
      "total": 10,
      "created": 8,
      "skipped": 1,
      "failed": 1
    },
    "createdPartners": [
      {
        "row": 2,
        "partner": {
          "id": 3,
          "email": "partner1@example.com",
          "name": "Partner One",
          "phone": "9876543210",
          "credits": 0
        },
        "credentials": {
          "email": "partner1@example.com",
          "password": "Abcd@123"
        }
      }
    ],
    "skippedPartners": [
      {
        "row": 3,
        "email": "existing@example.com",
        "reason": "Email already registered"
      }
    ],
    "failedPartners": [
      {
        "row": 4,
        "email": "invalid@example.com",
        "reason": "Missing required fields"
      }
    ]
  }
  ```

---

### 4. Get Partner By ID
- **Endpoint:** `GET /:id`
- **Description:** Get detailed partner information with communities, resources, and sessions.
- **Parameters:**
  - `id` (path): Partner ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/partner/123
  ```
- **Example Response:**
  ```json
  {
    "partner": {
      "partner": {
        "id": 123,
        "name": "Tech Partner",
        "email": "tech@partner.com",
        "phone": "9876543210",
        "credits": 100,
        "unifiedUserId": {
          "id": 101,
          "isActive": true
        }
      },
      "communities": [
        {
          "id": 1,
          "title": "Tech Community",
          "creator": {
            "id": 101,
            "name": "Tech Partner"
          }
        }
      ],
      "resources": [
        {
          "id": 1,
          "title": "Programming Guide",
          "author": {
            "id": 101,
            "name": "Tech Partner"
          }
        }
      ],
      "subscribedCommunities": [
        {
          "id": 2,
          "title": "Design Community"
        }
      ],
      "partnerSessions": [
        {
          "id": 1,
          "sessionSlot": {
            "id": 1,
            "session": {
              "id": 1,
              "title": "Programming Workshop"
            }
          }
        }
      ]
    }
  }
  ```

---

### 5. Update Partner
- **Endpoint:** `PATCH /:id`
- **Description:** Update partner information.
- **Parameters:**
  - `id` (path): Partner ID
  - Request body: Fields to update
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/partner/123 \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Updated Partner Name",
      "credits": 150
    }'
  ```
- **Example Response:**
  ```json
  {
    "partner": {
      "id": 123,
      "name": "Updated Partner Name",
      "email": "tech@partner.com",
      "credits": 150
    }
  }
  ```

---

### 6. Delete Partner
- **Endpoint:** `DELETE /:id`
- **Description:** Deactivate a partner (sets unified user to inactive).
- **Parameters:**
  - `id` (path): Partner ID
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/partner/123
  ```
- **Example Response:**
  ```json
  {
    "msg": "Partner deactivated successfully"
  }
  ```

---

### 7. Enable Partner
- **Endpoint:** `PATCH /:id/enable`
- **Description:** Reactivate a partner (sets unified user to active).
- **Parameters:**
  - `id` (path): Partner ID
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/partner/123/enable
  ```
- **Example Response:**
  ```json
  {
    "msg": "Partner enabled successfully"
  }
  ```

---

### 8. Get Partner Communities
- **Endpoint:** `GET /:id/communities`
- **Description:** Get all communities created by a partner.
- **Parameters:**
  - `id` (path): Partner ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/partner/123/communities
  ```
- **Example Response:**
  ```json
  {
    "communities": [
      {
        "id": 1,
        "title": "Tech Community",
        "desc": "Technology enthusiasts community"
      }
    ],
    "total": 1
  }
  ```

---

### 9. Get Partner Community Requests
- **Endpoint:** `GET /:id/communitiesRequests`
- **Description:** Get pending requests for communities created by a partner.
- **Parameters:**
  - `id` (path): Partner ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/partner/123/communitiesRequests
  ```
- **Example Response:**
  ```json
  {
    "communityRequests": [
      {
        "id": 1,
        "status": false,
        "Community": {
          "id": 1,
          "title": "Tech Community"
        },
        "User": {
          "id": 456,
          "name": "John Doe"
        }
      }
    ]
  }
  ```

---

### 10. Get Partner Sessions (Legacy)
- **Endpoint:** `GET /:id/sessions`
- **Description:** Get partner sessions (legacy endpoint).
- **Parameters:**
  - `id` (path): Partner ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/partner/123/sessions
  ```
- **Example Response:**
  ```json
  {
    "sessions": [
      {
        "id": 1,
        "title": "Programming Workshop"
      }
    ]
  }
  ```

---

### 11. Get All Partner Sessions (Authenticated)
- **Endpoint:** `GET /sessions`
- **Description:** Get all sessions created by the authenticated partner with statistics.
- **Parameters:** None (uses authenticated partner ID)
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/partner/sessions \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "data": {
      "sessions": [
        {
          "id": 1,
          "title": "Programming Workshop",
          "SessionSlot": [
            {
              "id": 1,
              "startTime": "2024-01-15T10:00:00Z",
              "endTime": "2024-01-15T11:00:00Z",
              "Attendance": [
                {
                  "id": 1,
                  "user": {
                    "id": 456,
                    "name": "John Doe"
                  }
                }
              ]
            }
          ]
        }
      ],
      "completedSessions": [],
      "statistics": {
        "totalSessions": 1,
        "activeSessions": 1,
        "completedSessions": 0,
        "totalSlots": 1,
        "totalAttendees": 1
      }
    }
  }
  ```

---

### 12. Get Partner Session By ID (Authenticated)
- **Endpoint:** `GET /sessions/:sessionId`
- **Description:** Get detailed information about a specific session created by the authenticated partner.
- **Parameters:**
  - `sessionId` (path): Session ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/partner/sessions/123 \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "data": {
      "session": {
        "id": 123,
        "title": "Programming Workshop",
        "status": "upcoming",
        "SessionSlot": [
          {
            "id": 1,
            "startTime": "2024-01-15T10:00:00Z",
            "endTime": "2024-01-15T11:00:00Z",
            "Attendance": [
              {
                "id": 1,
                "user": {
                  "id": 456,
                  "name": "John Doe",
                  "email": "john@example.com"
                }
              }
            ]
          }
        ],
        "statistics": {
          "totalSlots": 1,
          "completedSlots": 0,
          "upcomingSlots": 1,
          "liveSlots": 0,
          "totalAttendees": 1,
          "totalRevenue": 1000
        }
      }
    }
  }
  ```

---

# Forms API Documentation

## Base URL
```
/api/forms
```

---

### 1. Get All Forms
- **Endpoint:** `GET /`
- **Description:** Get all forms with pagination and filtering options.
- **Parameters:**
  - `page` (query, optional): Page number
  - `limit` (query, optional): Items per page
  - `status` (query, optional): Filter by status
  - `communityId` (query, optional): Filter by community
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/forms/?page=1&limit=10&status=active"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "forms": [ ... ],
    "pagination": { ... }
  }
  ```

---

### 2. Get Form By ID
- **Endpoint:** `GET /:id`
- **Description:** Get detailed information about a specific form.
- **Parameters:**
  - `id` (path): Form ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/forms/123
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "form": { ... }
  }
  ```

---

### 3. Create Form
- **Endpoint:** `POST /`
- **Description:** Create a new form (admin/partner only).
- **Parameters:**
  - Request body: `{ title, description, questions, communityId, ... }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/forms/ \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "title": "Feedback Form", "description": "Please provide your feedback", "questions": [...] }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "form": { ... }
  }
  ```

---

### 4. Update Form By ID
- **Endpoint:** `PATCH /:id`
- **Description:** Update a form (admin/partner only).
- **Parameters:**
  - `id` (path): Form ID
  - Request body: Fields to update
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/forms/123 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "title": "Updated Form Title" }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "form": { ... }
  }
  ```

---

### 5. Delete Form By ID
- **Endpoint:** `DELETE /:id`
- **Description:** Delete a form (admin/partner only).
- **Parameters:**
  - `id` (path): Form ID
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/forms/123 \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "form": { ... }
  }
  ```

---

### 6. Submit Form Response
- **Endpoint:** `POST /:id/submit`
- **Description:** Submit a response to a form (requires authentication).
- **Parameters:**
  - `id` (path): Form ID
  - Request body: `{ userId, responses: [...] }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/forms/123/submit \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "userId": 456, "responses": [{ "questionId": 1, "answer": "Yes" }] }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "submission": { ... }
  }
  ```

---

### 7. Get User Response Status
- **Endpoint:** `GET /user-response-status`
- **Description:** Check if a user has already submitted a response to a form.
- **Parameters:**
  - `formId` (query): Form ID
  - `userId` (query): User ID
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/forms/user-response-status?formId=123&userId=456" \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "hasSubmitted": true,
    "submission": { ... }
  }
  ```

---

### 8. Get Form Submissions
- **Endpoint:** `GET /:id/submissions`
- **Description:** Get all submissions for a form (admin/partner only).
- **Parameters:**
  - `id` (path): Form ID
  - `page` (query, optional): Page number
  - `limit` (query, optional): Items per page
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/forms/123/submissions?page=1&limit=10" \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "submissions": [ ... ],
    "pagination": { ... }
  }
  ```

---

### 9. Get Form Statistics
- **Endpoint:** `GET /:id/statistics`
- **Description:** Get statistics for a form (submissions, completion rate, etc.).
- **Parameters:**
  - `id` (path): Form ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/forms/123/statistics \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "statistics": {
      "totalSubmissions": 50,
      "completionRate": 85.5,
      "averageTimeToComplete": 300
    }
  }
  ```

---

### 10. Export Form Submissions
- **Endpoint:** `GET /:id/export`
- **Description:** Export form submissions to Excel/CSV (admin/partner only).
- **Parameters:**
  - `id` (path): Form ID
  - `format` (query, optional): Export format (excel, csv)
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/forms/123/export?format=excel" \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "downloadUrl": "https://example.com/export/form_123.xlsx"
  }
  ```

---

### 11. Admin: Approve Form
- **Endpoint:** `PATCH /:id/approve`
- **Description:** Approve a form (admin only).
- **Parameters:**
  - `id` (path): Form ID
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/forms/123/approve \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "form": { ... }
  }
  ```

---

### 12. Admin: Get Pending Forms
- **Endpoint:** `GET /pending`
- **Description:** Get all forms pending approval (admin only).
- **Parameters:**
  - `page` (query, optional): Page number
  - `limit` (query, optional): Items per page
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/forms/pending?page=1&limit=10" \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "forms": [ ... ],
    "pagination": { ... }
  }
  ```

---

### 13. Bulk Upload Forms
- **Endpoint:** `POST /bulk-upload`
- **Description:** Bulk upload forms via Excel file (admin only).
- **Parameters:**
  - Form-data: `file` (Excel file)
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/forms/bulk-upload \
    -H "Authorization: Bearer <token>" \
    -F "file=@/path/to/forms.xlsx"
  ```
- **Example Response:**
  ```json
  { "message": "Bulk upload completed", "results": { ... } }
  ```

---

### 14. Get Forms by Community
- **Endpoint:** `GET /community/:communityId`
- **Description:** Get all forms for a specific community.
- **Parameters:**
  - `communityId` (path): Community ID
  - `status` (query, optional): Filter by status
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/forms/community/123?status=active"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "forms": [ ... ]
  }
  ```

---

### 15. Duplicate Form
- **Endpoint:** `POST /:id/duplicate`
- **Description:** Create a copy of an existing form (admin/partner only).
- **Parameters:**
  - `id` (path): Form ID to duplicate
  - Request body: `{ title, description }` (optional overrides)
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/forms/123/duplicate \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{ "title": "Copy of Original Form" }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "form": { ... }
  }
  ```

---

### 16. Other Endpoints
- **Get form questions:** `GET /:id/questions`
- **Update form questions:** `PATCH /:id/questions`
- **Get form responses by user:** `GET /:id/responses/:userId`
- **Delete form submission:** `DELETE /:id/submissions/:submissionId`
- **Get form templates:** `GET /templates`
- **Create form from template:** `POST /from-template`

---

# Requests API Documentation

## Base URL
```
/api/requests
```

---

### 1. Get All Requests (Admin)
- **Endpoint:** `GET /`
- **Description:** Get all requests (both pending and approved) for admin.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/requests/ -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "data": {
      "all": [
        {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "9876543210",
          "q1": "Why do you want to join?",
          "q2": "What's your experience?",
          "q3": "How will you contribute?",
          "status": false,
          "communityId": 123,
          "userId": 456,
          "Community": {
            "id": 123,
            "title": "Tech Community"
          },
          "unifiedUser": {
            "id": 456,
            "email": "john@example.com"
          }
        }
      ],
      "pending": [...],
      "approved": [...]
    },
    "count": {
      "total": 1,
      "pending": 1,
      "approved": 0
    }
  }
  ```

---

### 2. Get All Pending Requests
- **Endpoint:** `GET /pending`
- **Description:** Get all pending requests (for admin/community managers).
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/requests/pending -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "status": false,
        "Community": {
          "id": 123,
          "title": "Tech Community"
        }
      }
    ],
    "count": 1
  }
  ```

---

### 3. Get All Approved Requests
- **Endpoint:** `GET /approved`
- **Description:** Get all approved requests (for admin).
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/requests/approved -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "status": true,
        "Community": {
          "id": 123,
          "title": "Tech Community"
        }
      }
    ],
    "count": 1
  }
  ```

---

### 4. Get Requests by User ID
- **Endpoint:** `GET /user/:userId`
- **Description:** Get all requests for a specific user.
- **Parameters:**
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/requests/user/456 -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "request": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "status": false,
        "Community": {
          "id": 123,
          "title": "Tech Community"
        }
      }
    ]
  }
  ```

---

### 5. Get Pending Requests by User ID
- **Endpoint:** `GET /user/:userId/pending`
- **Description:** Get pending requests for a specific user.
- **Parameters:**
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/requests/user/456/pending -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "status": false,
        "Community": {
          "id": 123,
          "title": "Tech Community"
        }
      }
    ],
    "count": 1
  }
  ```

---

### 6. Get Approved Requests by User ID
- **Endpoint:** `GET /user/:userId/approved`
- **Description:** Get approved requests for a specific user.
- **Parameters:**
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/requests/user/456/approved -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 2,
        "name": "John Doe",
        "email": "john@example.com",
        "status": true,
        "Community": {
          "id": 123,
          "title": "Tech Community"
        }
      }
    ],
    "count": 1
  }
  ```

---

### 7. Get All Requests by User ID
- **Endpoint:** `GET /user/:userId/all`
- **Description:** Get all requests (both pending and approved) for a specific user.
- **Parameters:**
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/requests/user/456/all -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "data": {
      "all": [...],
      "pending": [...],
      "approved": [...]
    },
    "count": {
      "total": 2,
      "pending": 1,
      "approved": 1
    }
  }
  ```

---

### 8. Get Requests by Community ID
- **Endpoint:** `GET /community/:communityId`
- **Description:** Get pending requests for a specific community.
- **Parameters:**
  - `communityId` (path): Community ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/requests/community/123 -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "status": false,
        "Community": {
          "id": 123,
          "title": "Tech Community"
        }
      }
    ],
    "count": 1
  }
  ```

---

### 9. Get Approved Requests by Community ID
- **Endpoint:** `GET /community/:communityId/approved`
- **Description:** Get approved requests for a specific community.
- **Parameters:**
  - `communityId` (path): Community ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/requests/community/123/approved -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "status": true,
        "Community": {
          "id": 123,
          "title": "Tech Community"
        }
      }
    ],
    "count": 1
  }
  ```

---

### 10. Get All Requests by Community ID
- **Endpoint:** `GET /community/:communityId/all`
- **Description:** Get all requests (both pending and approved) for a specific community.
- **Parameters:**
  - `communityId` (path): Community ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/requests/community/123/all -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "data": {
      "all": [...],
      "pending": [...],
      "approved": [...]
    },
    "count": {
      "total": 2,
      "pending": 1,
      "approved": 1
    }
  }
  ```

---

### 11. Get Requests by Community ID for User
- **Endpoint:** `GET /community/:communityId/user/:userId`
- **Description:** Get pending requests for a community (community manager only).
- **Parameters:**
  - `communityId` (path): Community ID
  - `userId` (path): User ID (community manager)
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/requests/community/123/user/789 -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "status": false,
        "Community": {
          "id": 123,
          "title": "Tech Community"
        }
      }
    ],
    "count": 1,
    "community": {
      "id": 123,
      "title": "Tech Community",
      "questions": ["Why do you want to join?", "What's your experience?"]
    }
  }
  ```

---

### 12. Get Request by ID
- **Endpoint:** `GET /:requestId`
- **Description:** Get a specific request by ID.
- **Parameters:**
  - `requestId` (path): Request ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/requests/1 -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "q1": "Why do you want to join?",
      "q2": "What's your experience?",
      "q3": "How will you contribute?",
      "status": false,
      "communityId": 123,
      "userId": 456,
      "Community": {
        "id": 123,
        "title": "Tech Community"
      },
      "unifiedUser": {
        "id": 456,
        "email": "john@example.com"
      }
    }
  }
  ```

---

### 13. Create Request
- **Endpoint:** `POST /`
- **Description:** Create a new community join request (supports bulk creation).
- **Parameters:**
  - Request body: `{ communityDetails: [{ email, phone, name, q1, q2, q3, communityId, userId }] }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/requests/ \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "communityDetails": [
        {
          "email": "john@example.com",
          "phone": "9876543210",
          "name": "John Doe",
          "q1": "Why do you want to join?",
          "q2": "What's your experience?",
          "q3": "How will you contribute?",
          "communityId": 123,
          "userId": 456
        }
      ]
    }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "All requests processed successfully.",
    "successfulRequests": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "status": false,
        "communityId": 123,
        "userId": 456
      }
    ]
  }
  ```

---

### 14. Respond to Requests (Batch)
- **Endpoint:** `PUT /respond`
- **Description:** Approve multiple requests at once (creates subscriptions and awards rewards).
- **Parameters:**
  - Request body: `[{ requestId, communityId, userId }]`
- **Example Request:**
  ```bash
  curl -X PUT http://localhost:5000/api/requests/respond \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '[
      {
        "requestId": 1,
        "communityId": 123,
        "userId": 456
      }
    ]'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "All requests processed."
  }
  ```

---

### 15. Update Request Status
- **Endpoint:** `PUT /:requestId/status`
- **Description:** Approve or reject a single request.
- **Parameters:**
  - `requestId` (path): Request ID
  - Request body: `{ status: true | false, reason? }`
- **Example Request:**
  ```bash
  curl -X PUT http://localhost:5000/api/requests/1/status \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "status": true,
      "reason": "Approved based on qualifications"
    }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "Request approved successfully.",
    "data": {
      "id": 1,
      "status": true,
      "Community": {
        "id": 123,
        "title": "Tech Community"
      }
    }
  }
  ```

---

# Resources API Documentation

## Base URL
```
/api/resources
```

---

### 1. Upload Resources for Community
- **Endpoint:** `POST /:comId/resources`
- **Description:** Upload multiple resources for a community.
- **Parameters:**
  - `comId` (path): Community ID
  - Request body: `[{ name, link, authorId }]`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/resources/123/resources \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '[
      {
        "name": "Programming Guide",
        "link": "https://example.com/guide.pdf",
        "authorId": 456
      }
    ]'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "resources": [
      {
        "id": 1,
        "name": "Programming Guide",
        "link": "https://example.com/guide.pdf",
        "authorId": 456,
        "communityId": 123
      }
    ]
  }
  ```

---

### 2. Get Resources by Community
- **Endpoint:** `GET /:comId/resources`
- **Description:** Get all resources for a specific community.
- **Parameters:**
  - `comId` (path): Community ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/resources/123/resources
  ```
- **Example Response:**
  ```json
  {
    "resources": [
      {
        "id": 1,
        "name": "Programming Guide",
        "link": "https://example.com/guide.pdf",
        "authorId": 456
      }
    ]
  }
  ```

---

### 3. Edit Resources for Community
- **Endpoint:** `POST /:comId/resources/edit`
- **Description:** Edit multiple resources for a community.
- **Parameters:**
  - `comId` (path): Community ID
  - Request body: `[{ id, name, link }]`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/resources/123/resources/edit \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '[
      {
        "id": 1,
        "name": "Updated Programming Guide",
        "link": "https://example.com/updated-guide.pdf"
      }
    ]'
  ```
- **Example Response:**
  ```json
  {
    "success": true
  }
  ```

---

### 4. Delete Resources from Community
- **Endpoint:** `DELETE /com/resources/:comId`
- **Description:** Remove resources from a community.
- **Parameters:**
  - `comId` (path): Community ID
  - Request body: `{ deleteResources: [resourceId1, resourceId2] }`
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/resources/com/resources/123 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "deleteResources": [1, 2]
    }'
  ```
- **Example Response:**
  ```json
  {
    "success": true
  }
  ```

---

### 5. Create Resources for Session
- **Endpoint:** `POST /session/:sessionId`
- **Description:** Create resources for a specific session.
- **Parameters:**
  - `sessionId` (path): Session ID
  - Request body: `[{ name, link, authorId }]`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/resources/session/456 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '[
      {
        "name": "Session Materials",
        "link": "https://example.com/materials.pdf",
        "authorId": 789
      }
    ]'
  ```
- **Example Response:**
  ```json
  {
    "success": true
  }
  ```

---

### 6. Get Resources by Session
- **Endpoint:** `GET /session/:sessionId`
- **Description:** Get all resources for a specific session.
- **Parameters:**
  - `sessionId` (path): Session ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/resources/session/456
  ```
- **Example Response:**
  ```json
  {
    "resources": [
      {
        "id": 2,
        "name": "Session Materials",
        "link": "https://example.com/materials.pdf",
        "community": {
          "id": 123,
          "title": "Tech Community"
        }
      }
    ]
  }
  ```

---

### 7. Edit Resources for Session
- **Endpoint:** `POST /session/edit/:sessionId`
- **Description:** Edit resources for a specific session.
- **Parameters:**
  - `sessionId` (path): Session ID
  - Request body: `[{ id, name, link }]`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/resources/session/edit/456 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '[
      {
        "id": 2,
        "name": "Updated Session Materials",
        "link": "https://example.com/updated-materials.pdf"
      }
    ]'
  ```
- **Example Response:**
  ```json
  {
    "success": true
  }
  ```

---

### 8. Delete Resources from Session
- **Endpoint:** `DELETE /session/:sessionId`
- **Description:** Remove resources from a session.
- **Parameters:**
  - `sessionId` (path): Session ID
  - Request body: `{ deleteResources: [{ id: resourceId }] }`
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/resources/session/456 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "deleteResources": [
        { "id": 2 }
      ]
    }'
  ```
- **Example Response:**
  ```json
  {
    "success": true
  }
  ```

---

### 9. Get All Global Resources
- **Endpoint:** `GET /global`
- **Description:** Get all resources available in the system.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/resources/global
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "resources": [
      {
        "id": 1,
        "name": "Programming Guide",
        "link": "https://example.com/guide.pdf",
        "community": [
          {
            "id": 123,
            "title": "Tech Community"
          }
        ],
        "session": [
          {
            "id": 456,
            "SessionSlot": [...],
            "CouponCode": [...]
          }
        ]
      }
    ]
  }
  ```

---

### 10. Create Individual Resource
- **Endpoint:** `POST /:resourceId`
- **Description:** Create a new resource with community and session associations.
- **Parameters:**
  - `resourceId` (path): Resource ID (can be any value for creation)
  - Request body: `{ name, link, authorId, communityArr?, sessionArr?, isPreSession?, isPostSession? }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/resources/1 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Comprehensive Guide",
      "link": "https://example.com/comprehensive-guide.pdf",
      "authorId": 456,
      "communityArr": [
        { "id": 123 }
      ],
      "sessionArr": [
        { "id": 456 }
      ],
      "isPreSession": true,
      "isPostSession": false
    }'
  ```
- **Example Response:**
  ```json
  {
    "success": true
  }
  ```

---

### 11. Get Individual Resource
- **Endpoint:** `GET /:resourceId`
- **Description:** Get detailed information about a specific resource.
- **Parameters:**
  - `resourceId` (path): Resource ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/resources/1
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "resource": {
      "id": 1,
      "name": "Programming Guide",
      "link": "https://example.com/guide.pdf",
      "author": {
        "id": 456,
        "name": "John Doe"
      },
      "community": [
        {
          "id": 123,
          "title": "Tech Community"
        }
      ],
      "session": [
        {
          "id": 456,
          "SessionSlot": [...],
          "CouponCode": [...]
        }
      ]
    }
  }
  ```

---

### 12. Edit Individual Resource
- **Endpoint:** `PATCH /:resourceId`
- **Description:** Update a specific resource with new associations.
- **Parameters:**
  - `resourceId` (path): Resource ID
  - Request body: `{ data: { name, link, sessionArr?, communityArr?, isPreSession?, isPostSession? } }`
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/resources/1 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "data": {
        "name": "Updated Programming Guide",
        "link": "https://example.com/updated-guide.pdf",
        "communityArr": [
          { "id": 123 },
          { "id": 124 }
        ],
        "sessionArr": [
          { "id": 456 }
        ],
        "isPreSession": true,
        "isPostSession": true
      }
    }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "Resource updated successfully"
  }
  ```

---

### 13. Delete Individual Resource
- **Endpoint:** `DELETE /:resourceId`
- **Description:** Delete a specific resource and remove all associations.
- **Parameters:**
  - `resourceId` (path): Resource ID
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/resources/1 \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true
  }
  ```

---

### 14. Get All Resources by User
- **Endpoint:** `GET /all/:userId`
- **Description:** Get all resources created by a specific user.
- **Parameters:**
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/resources/all/456
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "resources": [
      {
        "id": 1,
        "name": "Programming Guide",
        "link": "https://example.com/guide.pdf",
        "community": [
          {
            "id": 123,
            "title": "Tech Community"
          }
        ],
        "session": [
          {
            "id": 456,
            "SessionSlot": [...],
            "CouponCode": [...]
          }
        ]
      }
    ]
  }
  ```

---

# Thread API Documentation

## Base URL
```
/api/thread
```

---

### 1. Create Post
- **Endpoint:** `POST /`
- **Description:** Create a new post (supports regular posts, polls, greetings, asks, and replies).
- **Parameters:**
  - Request body: `{ content, parentPostId?, assetsData?: [{ type, url, index }], tagsData?: [{ id?, name }], sessionId?, eventId?, communityId?, subcommunityId?, optionsData?: [{ option }], isPoll?, isGreeting?, isAsk?, creatorId }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/thread/ \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "content": "Hello everyone! This is my first post.",
      "communityId": 123,
      "creatorId": 456,
      "assetsData": [
        {
          "type": "image",
          "url": "https://example.com/image.jpg",
          "index": 1
        }
      ],
      "tagsData": [
        {
          "name": "introduction"
        }
      ]
    }'
  ```
- **Example Response:**
  ```json
  {
    "tags": [],
    "createdPost": {
      "id": 1,
      "content": "Hello everyone! This is my first post.",
      "communityId": 123,
      "creatorId": 456,
      "isArchived": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "tags": [
        {
          "tag": {
            "id": 1,
            "name": "introduction"
          }
        }
      ],
      "creator": {
        "id": 456,
        "user": {
          "id": 456,
          "name": "John Doe"
        }
      },
      "assets": [
        {
          "id": 1,
          "type": "image",
          "url": "https://example.com/image.jpg",
          "index": 1
        }
      ],
      "likes": [],
      "_count": {
        "childrenPosts": 0
      }
    }
  }
  ```

---

### 2. Get All Posts
- **Endpoint:** `GET /`
- **Description:** Get all non-archived posts with pagination and filtering.
- **Parameters:**
  - `page` (query, optional): Page number
  - `limit` (query, optional): Items per page
  - `type` (query, optional): Filter by post type
  - `communityId` (query, optional): Filter by community
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/thread/?page=1&limit=10&communityId=123" \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "posts": [
      {
        "id": 1,
        "content": "Hello everyone! This is my first post.",
        "communityId": 123,
        "creatorId": 456,
        "isArchived": false,
        "createdAt": "2024-01-15T10:30:00Z",
        "tags": [
          {
            "tag": {
              "id": 1,
              "name": "introduction"
            }
          }
        ],
        "creator": {
          "id": 456,
          "user": {
            "id": 456,
            "name": "John Doe"
          }
        },
        "assets": [
          {
            "id": 1,
            "type": "image",
            "url": "https://example.com/image.jpg",
            "index": 1
          }
        ],
        "likes": []
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
  ```

---

### 3. Get Post by ID
- **Endpoint:** `GET /:postId`
- **Description:** Get detailed information about a specific post.
- **Parameters:**
  - `postId` (path): Post ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/thread/1
  ```
- **Example Response:**
  ```json
  {
    "post": {
      "id": 1,
      "content": "Hello everyone! This is my first post.",
      "communityId": 123,
      "creatorId": 456,
      "isArchived": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "tags": [
        {
          "tag": {
            "id": 1,
            "name": "introduction"
          }
        }
      ],
      "creator": {
        "id": 456,
        "user": {
          "id": 456,
          "name": "John Doe"
        }
      },
      "assets": [
        {
          "id": 1,
          "type": "image",
          "url": "https://example.com/image.jpg",
          "index": 1
        }
      ],
      "likes": [],
      "childrenPosts": [
        {
          "id": 2,
          "content": "Welcome to the community!",
          "parentPostId": 1
        }
      ]
    }
  }
  ```

---

### 4. Update Post
- **Endpoint:** `PATCH /:postId`
- **Description:** Update a specific post.
- **Parameters:**
  - `postId` (path): Post ID
  - Request body: Fields to update
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/thread/1 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "content": "Updated post content"
    }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "post": {
      "id": 1,
      "content": "Updated post content",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  }
  ```

---

### 5. Delete Post
- **Endpoint:** `DELETE /:postId`
- **Description:** Delete a specific post.
- **Parameters:**
  - `postId` (path): Post ID
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/thread/1 \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "Post deleted successfully"
  }
  ```

---

### 6. Update Post Tags
- **Endpoint:** `PATCH /:postId/tag`
- **Description:** Update tags for a specific post.
- **Parameters:**
  - `postId` (path): Post ID
  - Request body: `{ tagsData: [{ id?, name }] }`
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/thread/1/tag \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "tagsData": [
        { "name": "updated-tag" },
        { "id": 2, "name": "existing-tag" }
      ]
    }'
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "Tags updated successfully"
  }
  ```

---

### 7. Get Posts by Session
- **Endpoint:** `GET /session/:sessionId`
- **Description:** Get all posts for a specific session.
- **Parameters:**
  - `sessionId` (path): Session ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/thread/session/456
  ```
- **Example Response:**
  ```json
  {
    "posts": [
      {
        "id": 3,
        "content": "Great session today!",
        "sessionId": 456,
        "creatorId": 456
      }
    ]
  }
  ```

---

### 8. Get Posts by Event
- **Endpoint:** `GET /event/:eventId`
- **Description:** Get all posts for a specific event.
- **Parameters:**
  - `eventId` (path): Event ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/thread/event/789
  ```
- **Example Response:**
  ```json
  {
    "posts": [
      {
        "id": 4,
        "content": "Excited for the event!",
        "eventId": 789,
        "creatorId": 456
      }
    ]
  }
  ```

---

### 9. Get Posts by Community
- **Endpoint:** `GET /community/:communityId`
- **Description:** Get all posts for a specific community.
- **Parameters:**
  - `communityId` (path): Community ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/thread/community/123
  ```
- **Example Response:**
  ```json
  {
    "posts": [
      {
        "id": 1,
        "content": "Hello everyone! This is my first post.",
        "communityId": 123,
        "creatorId": 456
      }
    ]
  }
  ```

---

### 10. Get Posts by User
- **Endpoint:** `GET /user/:userId`
- **Description:** Get all posts created by a specific user.
- **Parameters:**
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/thread/user/456
  ```
- **Example Response:**
  ```json
  {
    "posts": [
      {
        "id": 1,
        "content": "Hello everyone! This is my first post.",
        "communityId": 123,
        "creatorId": 456
      }
    ]
  }
  ```

---

### 11. Like Post
- **Endpoint:** `PATCH /:postId/user/:userId`
- **Description:** Like or unlike a post.
- **Parameters:**
  - `postId` (path): Post ID
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/thread/1/user/456 \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "Post liked successfully"
  }
  ```

---

### 12. Create User Poll Reaction
- **Endpoint:** `PATCH /:postId/user/:userId/option/:optionId`
- **Description:** Vote on a poll option.
- **Parameters:**
  - `postId` (path): Post ID
  - `userId` (path): User ID
  - `optionId` (path): Poll option ID
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/thread/1/user/456/option/2 \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "success": true,
    "message": "Vote recorded successfully"
  }
  ```

---

### 13. Get User Community Posts
- **Endpoint:** `GET /user/:userId/community`
- **Description:** Get all posts by a user in communities they're part of.
- **Parameters:**
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/thread/user/456/community
  ```
- **Example Response:**
  ```json
  {
    "posts": [
      {
        "id": 1,
        "content": "Hello everyone! This is my first post.",
        "communityId": 123,
        "creatorId": 456
      }
    ]
  }
  ```

---

# Upload Image API Documentation

## Base URL
```
/api/uploadImage
```

---

### 1. Generate Presigned URL
- **Endpoint:** `POST /generate-presigned-url`
- **Description:** Generate a presigned URL for direct file upload to AWS S3.
- **Parameters:**
  - Request body: `{ fileName, fileType, folder }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/uploadImage/generate-presigned-url \
    -H "Content-Type: application/json" \
    -d '{
      "fileName": "profile-photo.jpg",
      "fileType": "image/jpeg",
      "folder": "user-profiles"
    }'
  ```
- **Example Response:**
  ```json
  {
    "uploadUrl": "https://bucket-name.s3.region.amazonaws.com/user-profiles/1234567890-profile-photo.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...",
    "fileUrl": "https://bucket-name.s3.region.amazonaws.com/user-profiles/1234567890-profile-photo.jpg"
  }
  ```

---

# User API Documentation

## Base URL
```
/api/user
```

---

### 1. Get User By ID
- **Endpoint:** `GET /:id`
- **Description:** Get detailed information about a specific user.
- **Parameters:**
  - `id` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123
  ```
- **Example Response:**
  ```json
  {
    "user": {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "photoURL": "profile.jpg",
      "currentPosition": "Chef",
      "employer": "Restaurant ABC"
    }
  }
  ```

---

### 2. Update User By ID
- **Endpoint:** `PATCH /:id`
- **Description:** Update user profile information with comprehensive validation and Moodle integration.
- **Parameters:**
  - `id` (path): User ID
  - Request body: User profile fields to update
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/user/123 \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "currentPosition": "Head Chef",
      "employer": "Restaurant XYZ",
      "specializations": ["Italian Cuisine", "Pastry"],
      "certifications": ["Culinary Arts Degree"],
      "languageProficiency": ["English", "Spanish"],
      "technologySkills": ["Kitchen Management Software"]
    }'
  ```
- **Example Response:**
  ```json
  {
    "message": "User Details Updated Successfully",
    "user": {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "currentPosition": "Head Chef",
      "employer": "Restaurant XYZ"
    }
  }
  ```

---

### 3. Delete User By ID
- **Endpoint:** `DELETE /:id`
- **Description:** Delete a user and their associated data (connections, unified user).
- **Parameters:**
  - `id` (path): User ID
- **Example Request:**
  ```bash
  curl -X DELETE http://localhost:5000/api/user/123 \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "status": 200,
    "message": "User deleted successfully"
  }
  ```

---

### 4. Enable User By ID
- **Endpoint:** `PATCH /:id/enable`
- **Description:** Reactivate a disabled user.
- **Parameters:**
  - `id` (path): User ID
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/user/123/enable \
    -H "Authorization: Bearer <token>"
  ```
- **Example Response:**
  ```json
  {
    "message": "User enabled successfully"
  }
  ```

---

### 5. Get User Profile Progress
- **Endpoint:** `GET /:id/profile-progress`
- **Description:** Calculate user profile completion percentage and award rewards for 100% completion.
- **Parameters:**
  - `id` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/profile-progress
  ```
- **Example Response:**
  ```json
  {
    "profileProgress": 85,
    "emptyFields": ["publications", "website"],
    "totalFields": 17,
    "filledFields": 15
  }
  ```

---

### 6. Get User Recent Activities
- **Endpoint:** `GET /:id/recent-activities`
- **Description:** Get user's recent activities including community joins, session subscriptions, and posts.
- **Parameters:**
  - `id` (path): User ID
  - `page` (query, optional): Page number (default: 1)
  - `limit` (query, optional): Items per page (default: 10)
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/user/123/recent-activities?page=1&limit=20"
  ```
- **Example Response:**
  ```json
  {
    "activities": [
      {
        "type": "community_join",
        "id": 1,
        "communityId": 456,
        "communityTitle": "Chef Community",
        "communityImg": "banner.jpg",
        "createdAt": "2024-01-15T10:30:00Z"
      },
      {
        "type": "session_subscription",
        "id": 2,
        "sessionId": 789,
        "sessionTitle": "Cooking Workshop",
        "sessionImg": "workshop.jpg",
        "startTime": "2024-01-20T14:00:00Z",
        "endTime": "2024-01-20T16:00:00Z",
        "isLive": false,
        "createdAt": "2024-01-15T09:15:00Z"
      }
    ],
    "total": 2,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
  ```

---

### 7. Get Users By Filter
- **Endpoint:** `GET /`
- **Description:** Get all users with statistics (active and disabled).
- **Parameters:**
  - `filter` (query, optional): JSON filter object
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/user/?filter={\"status\":\"active\"}"
  ```
- **Example Response:**
  ```json
  {
    "activeUsers": [
      {
        "id": 123,
        "name": "John Doe",
        "email": "john@example.com",
        "unifiedUserId": {
          "id": 456,
          "isActive": true
        },
        "statistics": {
          "communities": { "total": 5 },
          "sessions": { "total": 12 }
        }
      }
    ],
    "disabledUsers": []
  }
  ```

---

### 8. Get All Users
- **Endpoint:** `GET /all`
- **Description:** Get all users with unified user information.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/all
  ```
- **Example Response:**
  ```json
  {
    "users": [
      {
        "id": 123,
        "name": "John Doe",
        "email": "john@example.com",
        "unifiedUserId": {
          "id": 456,
          "isActive": true
        }
      }
    ]
  }
  ```

---

### 9. Get User Subscriptions
- **Endpoint:** `GET /:id/subscription`
- **Description:** Get all community subscriptions for a user.
- **Parameters:**
  - `id` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/subscription
  ```
- **Example Response:**
  ```json
  {
    "subscription": [
      {
        "id": 1,
        "communityId": 456,
        "startsAt": "2024-01-01T00:00:00Z",
        "expiresAt": "2024-02-01T00:00:00Z",
        "community": {
          "id": 456,
          "title": "Chef Community"
        }
      }
    ]
  }
  ```

---

### 10. Get User Sessions
- **Endpoint:** `GET /:id/sessions`
- **Description:** Get all sessions (upcoming and completed) for a user.
- **Parameters:**
  - `id` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/sessions
  ```
- **Example Response:**
  ```json
  {
    "attendance": [...],
    "session": [
      {
        "id": 789,
        "title": "Cooking Workshop",
        "SessionSlot": [
          {
            "id": 1,
            "startTime": "2024-01-20T14:00:00Z",
            "endTime": "2024-01-20T16:00:00Z",
            "link": "meeting-link"
          }
        ]
      }
    ],
    "completedSessions": [...]
  }
  ```

---

### 11. Add User Session
- **Endpoint:** `POST /:id/sessions`
- **Description:** Register a user for a session (creates attendance records and awards rewards).
- **Parameters:**
  - `id` (path): User ID
  - Request body: `{ sessionId, price }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/user/123/sessions \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "sessionId": 789,
      "price": 1000
    }'
  ```
- **Example Response:**
  ```json
  {
    "status": 201,
    "attendance_records": [
      {
        "id": 1,
        "userId": 123,
        "sessionId": 789,
        "sessionSlotId": 1,
        "price": 1000,
        "paymentCompleted": true
      }
    ]
  }
  ```

---

### 12. Mark User Attendance
- **Endpoint:** `PATCH /:id/sessions`
- **Description:** Mark attendance for a session (RSVP and generate meeting links).
- **Parameters:**
  - `id` (path): User ID
  - Request body: `{ attendanceId, rsvp }`
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/user/123/sessions \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "attendanceId": 1,
      "rsvp": true
    }'
  ```
- **Example Response:**
  ```json
  {
    "status": 200,
    "attendance": {
      "id": 1,
      "rsvp": true,
      "link": "meeting-link-with-token"
    }
  }
  ```

---

### 13. Buy Session
- **Endpoint:** `PATCH /:id/sessions/buy`
- **Description:** Complete payment for a session (requires authentication).
- **Parameters:**
  - `id` (path): User ID
  - Request body: `{ transactionId, attendanceId }`
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/user/123/sessions/buy \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "transactionId": 456,
      "attendanceId": 1
    }'
  ```
- **Example Response:**
  ```json
  {
    "status": 200,
    "attendance": {
      "id": 1,
      "paymentCompleted": true,
      "transactionId": 456
    }
  }
  ```

---

### 14. Get User Communities
- **Endpoint:** `GET /:id/community`
- **Description:** Get all communities a user is subscribed to.
- **Parameters:**
  - `id` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/community
  ```
- **Example Response:**
  ```json
  {
    "status": 200,
    "communities": [
      {
        "id": 456,
        "title": "Chef Community",
        "desc": "Professional chefs community"
      }
    ]
  }
  ```

---

### 15. Get User Subscribed Communities
- **Endpoint:** `GET /:id/community/subscribed`
- **Description:** Get communities user is subscribed to (excluding DEFAULT type).
- **Parameters:**
  - `id` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/community/subscribed
  ```
- **Example Response:**
  ```json
  {
    "status": 200,
    "communities": [
      {
        "id": 456,
        "title": "Chef Community",
        "desc": "Professional chefs community"
      }
    ]
  }
  ```

---

### 16. Get User Non-Subscribed Communities
- **Endpoint:** `GET /:id/community/non-subscribed`
- **Description:** Get communities user is not subscribed to and hasn't requested.
- **Parameters:**
  - `id` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/community/non-subscribed
  ```
- **Example Response:**
  ```json
  {
    "status": 200,
    "communities": [
      {
        "id": 789,
        "title": "Baking Community",
        "desc": "Professional bakers community",
        "subscriptionCount": 25
      }
    ],
    "total": 1
  }
  ```

---

### 17. Get User Subscribed Sessions
- **Endpoint:** `GET /:id/sessions/subscribed`
- **Description:** Get all sessions user is subscribed to with pagination.
- **Parameters:**
  - `id` (path): User ID
  - `page` (query, optional): Page number (default: 1)
  - `limit` (query, optional): Items per page (default: 10)
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/user/123/sessions/subscribed?page=1&limit=10"
  ```
- **Example Response:**
  ```json
  {
    "status": 200,
    "sessions": [
      {
        "id": 789,
        "title": "Cooking Workshop",
        "desc": "Learn advanced cooking techniques",
        "sessionSlots": [
          {
            "id": 1,
            "startTime": "2024-01-20T14:00:00Z",
            "endTime": "2024-01-20T16:00:00Z",
            "attendanceDetails": {
              "id": 1,
              "rsvp": true,
              "link": "meeting-link"
            }
          }
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
  ```

---

### 18. Get User Non-Subscribed Sessions
- **Endpoint:** `GET /:id/sessions/non-subscribed`
- **Description:** Get all sessions user is not subscribed to with pagination.
- **Parameters:**
  - `id` (path): User ID
  - `page` (query, optional): Page number (default: 1)
  - `limit` (query, optional): Items per page (default: 10)
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/user/123/sessions/non-subscribed?page=1&limit=10"
  ```
- **Example Response:**
  ```json
  {
    "status": 200,
    "sessions": [
      {
        "id": 999,
        "title": "Baking Masterclass",
        "desc": "Advanced baking techniques",
        "sessionSlots": [
          {
            "id": 5,
            "startTime": "2024-01-25T10:00:00Z",
            "endTime": "2024-01-25T12:00:00Z",
            "price": 1500,
            "speakers": [...]
          }
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
  ```

---

### 19. Check User Session Subscription
- **Endpoint:** `GET /:userId/session/:sessionId/subscribed`
- **Description:** Check if a user is subscribed to a specific session.
- **Parameters:**
  - `userId` (path): User ID
  - `sessionId` (path): Session ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/session/789/subscribed
  ```
- **Example Response:**
  ```json
  {
    "subscribed": true,
    "attendance": {
      "id": 1,
      "paymentCompleted": true,
      "rsvp": true
    }
  }
  ```

---

### 20. Get User Session Join Status
- **Endpoint:** `GET /:userId/session/:sessionId/join-status`
- **Description:** Get detailed join status for a user and session.
- **Parameters:**
  - `userId` (path): User ID
  - `sessionId` (path): Session ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/session/789/join-status
  ```
- **Example Response:**
  ```json
  {
    "status": "subscribed",
    "message": "User is subscribed to this session",
    "attendance": {
      "id": 1,
      "paymentCompleted": true,
      "rsvp": true
    }
  }
  ```

---

### 21. Get User Session Statistics
- **Endpoint:** `GET /:id/sessions/stats`
- **Description:** Get comprehensive session statistics for a user.
- **Parameters:**
  - `id` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/sessions/stats
  ```
- **Example Response:**
  ```json
  {
    "status": 200,
    "stats": {
      "totalSessions": 15,
      "subscribedSessions": 12,
      "pendingSessions": 3,
      "completedSessions": 8,
      "upcomingSessions": 4,
      "attendedSessions": 7,
      "totalSpent": 12000,
      "sessionCategories": {
        "WORKSHOP": 8,
        "MASTERCLASS": 4
      }
    }
  }
  ```

---

### 22. Get User Ongoing Sessions
- **Endpoint:** `GET /:id/sessions/ongoing`
- **Description:** Get sessions currently ongoing or starting within 5 minutes.
- **Parameters:**
  - `id` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/sessions/ongoing
  ```
- **Example Response:**
  ```json
  {
    "status": 200,
    "sessions": [
      {
        "id": 789,
        "title": "Live Cooking Demo",
        "sessionSlots": [
          {
            "id": 1,
            "startTime": "2024-01-15T14:00:00Z",
            "endTime": "2024-01-15T16:00:00Z",
            "attendanceDetails": {
              "id": 1,
              "rsvp": true,
              "link": "live-meeting-link"
            }
          }
        ]
      }
    ],
    "total": 1
  }
  ```

---

### 23. Get User Upcoming Session Slots
- **Endpoint:** `GET /:id/sessions/upcoming-slots`
- **Description:** Get all upcoming session slots for a user with pagination.
- **Parameters:**
  - `id` (path): User ID
  - `page` (query, optional): Page number (default: 1)
  - `limit` (query, optional): Items per page (default: 10)
- **Example Request:**
  ```bash
  curl -X GET "http://localhost:5000/api/user/123/sessions/upcoming-slots?page=1&limit=10"
  ```
- **Example Response:**
  ```json
  {
    "status": 200,
    "sessions": [
      {
        "id": 789,
        "title": "Cooking Workshop",
        "sessionSlots": [
          {
            "id": 1,
            "startTime": "2024-01-20T14:00:00Z",
            "endTime": "2024-01-20T16:00:00Z",
            "attendanceDetails": {
              "id": 1,
              "rsvp": true,
              "link": "meeting-link"
            }
          }
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
  ```

---

### 24. Check Community Subscription Status
- **Endpoint:** `GET /:userId/community/:communityId/subscribed`
- **Description:** Check if a user is subscribed to a specific community.
- **Parameters:**
  - `userId` (path): User ID
  - `communityId` (path): Community ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/community/456/subscribed
  ```
- **Example Response:**
  ```json
  {
    "subscribed": true
  }
  ```

---

### 25. Check Community Request Status
- **Endpoint:** `GET /:userId/community/:communityId/requested`
- **Description:** Check if a user has requested to join a specific community.
- **Parameters:**
  - `userId` (path): User ID
  - `communityId` (path): Community ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/community/456/requested
  ```
- **Example Response:**
  ```json
  {
    "requested": false
  }
  ```

---

### 26. Get All Requested Communities
- **Endpoint:** `GET /:userId/communities/requested`
- **Description:** Get all communities a user has requested to join.
- **Parameters:**
  - `userId` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/communities/requested
  ```
- **Example Response:**
  ```json
  {
    "communities": [
      {
        "id": 789,
        "title": "Baking Community",
        "desc": "Professional bakers community"
      }
    ]
  }
  ```

---

### 27. Get User Cart Items
- **Endpoint:** `GET /:id/cart`
- **Description:** Get all items in user's cart (pending payment sessions).
- **Parameters:**
  - `id` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/cart
  ```
- **Example Response:**
  ```json
  {
    "status": 200,
    "cart": [
      {
        "id": 1,
        "sessionId": 789,
        "price": 1000,
        "paymentCompleted": false
      }
    ]
  }
  ```

---

### 28. Delete Cart Sessions
- **Endpoint:** `PATCH /:id/cart`
- **Description:** Remove sessions from user's cart.
- **Parameters:**
  - `id` (path): User ID
  - Request body: `{ attendanceIds: [1, 2, 3] }`
- **Example Request:**
  ```bash
  curl -X PATCH http://localhost:5000/api/user/123/cart \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "attendanceIds": [1, 2, 3]
    }'
  ```
- **Example Response:**
  ```json
  {
    "status": 200,
    "results": {
      "deleted": 3,
      "failed": 0
    }
  }
  ```

---

### 29. Get User Events
- **Endpoint:** `GET /:id/events`
- **Description:** Get all events a user is registered for.
- **Parameters:**
  - `id` (path): User ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/123/events
  ```
- **Example Response:**
  ```json
  {
    "events": [
      {
        "id": 1,
        "title": "Culinary Festival",
        "startDate": "2024-02-01T00:00:00Z",
        "endDate": "2024-02-03T00:00:00Z"
      }
    ],
    "completedEvents": [...]
  }
  ```

---

### 30. Create Notification
- **Endpoint:** `POST /notifications`
- **Description:** Create a new chat notification.
- **Parameters:**
  - Request body: `{ fromId, toId, messageBody }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/user/notifications \
    -H "Content-Type: application/json" \
    -d '{
      "fromId": 123,
      "toId": 456,
      "messageBody": "Hello! How are you?"
    }'
  ```
- **Example Response:**
  ```json
  {
    "id": 1,
    "fromId": 123,
    "toId": 456,
    "messageBody": "Hello! How are you?",
    "createdAt": "2024-01-15T10:30:00Z"
  }
  ```

---

### 31. Get All Notifications
- **Endpoint:** `GET /notifications`
- **Description:** Get all chat notifications.
- **Parameters:** None
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/user/notifications
  ```
- **Example Response:**
  ```json
  [
    {
      "id": 1,
      "fromId": 123,
      "toId": 456,
      "messageBody": "Hello! How are you?",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
  ```

---

# Session Threads API Documentation

## Base URL
```
/api/sessionThreads
```

---

### 1. Create Session Thread
- **Endpoint:** `POST /`
- **Description:** Create a new thread for a session slot.
- **Parameters:**
  - Request body: `{ content, sessionSlotId, creatorId, assetsData?: [{ type, url, index }] }`
- **Example Request:**
  ```bash
  curl -X POST http://localhost:5000/api/sessionThreads/ \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{
      "content": "Great session today! Here are the key takeaways.",
      "sessionSlotId": 123,
      "creatorId": 456,
      "assetsData": [
        {
          "type": "image",
          "url": "https://example.com/notes.jpg",
          "index": 1
        }
      ]
    }'
  ```
- **Example Response:**
  ```json
  {
    "id": 1,
    "content": "Great session today! Here are the key takeaways.",
    "sessionSlotId": 123,
    "creatorId": 456,
    "createdAt": "2024-01-15T10:30:00Z",
    "assets": [
      {
        "id": 1,
        "type": "image",
        "url": "https://example.com/notes.jpg",
        "index": 1
      }
    ],
    "sessionSlot": {
      "id": 123,
      "startTime": "2024-01-15T09:00:00Z",
      "endTime": "2024-01-15T11:00:00Z"
    },
    "creator": {
      "id": 456,
      "user": {
        "id": 456,
        "name": "John Doe"
      }
    }
  }
  ```

---

### 2. Get Session Threads
- **Endpoint:** `GET /:sessionSlotId`
- **Description:** Get all threads for a specific session slot.
- **Parameters:**
  - `sessionSlotId` (path): Session slot ID
- **Example Request:**
  ```bash
  curl -X GET http://localhost:5000/api/sessionThreads/123
  ```
- **Example Response:**
  ```json
  [
    {
      "id": 1,
      "content": "Great session today! Here are the key takeaways.",
      "sessionSlotId": 123,
      "creatorId": 456,
      "createdAt": "2024-01-15T10:30:00Z",
      "assets": [
        {
          "id": 1,
          "type": "image",
          "url": "https://example.com/notes.jpg",
          "index": 1
        }
      ],
      "sessionSlot": {
        "id": 123,
        "startTime": "2024-01-15T09:00:00Z",
        "endTime": "2024-01-15T11:00:00Z"
      },
      "creator": {
        "id": 456,
        "user": {
          "id": 456,
          "name": "John Doe"
        }
      }
    }
  ]
  ```

---