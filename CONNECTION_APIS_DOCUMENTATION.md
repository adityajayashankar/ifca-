# Connection APIs Documentation

## Overview
This document provides comprehensive documentation for all connection-related APIs in the IFCA application. The connection system supports mutual connections, privacy controls, and bidirectional relationship management.

## Base URL
```
http://localhost:5000/api/v1/connections
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Core Connection APIs

### 1. Send Connection Request
**POST** `/send-request`

Sends a connection request to another user. Supports mutual connection system where both users can send requests to each other.

#### Request Body
```json
{
  "receiverId": 123,
  "message": "I'd like to connect with you!"
}
```

#### Response
```json
{
  "message": "Connection request sent successfully",
  "connectionRequest": {
    "id": 456,
    "senderId": 789,
    "receiverId": 123,
    "status": "pending",
    "message": "I'd like to connect with you!",
    "createdAt": "2025-07-29T15:30:00.000Z",
    "updatedAt": "2025-07-29T15:30:00.000Z"
  },
  "isMutual": false
}
```

#### Special Cases
- **Mutual Connection**: If both users have sent requests to each other, they become automatically connected
- **Already Connected**: Returns existing connection if already connected in that direction
- **Already Pending**: Returns error if request already sent

---

### 2. Accept Connection Request
**PUT** `/accept/:connectionId`

Accepts an incoming or outgoing connection request. Supports bidirectional connections.

#### Parameters
- `connectionId` (number): ID of the connection to accept

#### Response
```json
{
  "message": "Connection request accepted successfully",
  "connection": {
    "id": 456,
    "senderId": 789,
    "receiverId": 123,
    "status": "accepted",
    "message": "I'd like to connect with you!",
    "createdAt": "2025-07-29T15:30:00.000Z",
    "updatedAt": "2025-07-29T15:35:00.000Z"
  }
}
```

---

### 3. Reject/Cancel Connection Request
**DELETE** `/:connectionId`

Rejects or cancels a connection request. Can be used for both incoming and outgoing requests.

#### Parameters
- `connectionId` (number): ID of the connection to reject

#### Response
```json
{
  "message": "Connection request rejected successfully",
  "connectionId": 456
}
```

---

### 4. Get Pending Requests
**GET** `/:userId/pending-requests`

Retrieves all pending connection requests (both incoming and outgoing) for a user.

#### Parameters
- `userId` (number): ID of the user

#### Response
```json
{
  "success": true,
  "userId": 123,
  "userEmail": "user@example.com",
  "pendingRequests": {
    "incoming": [
      {
        "id": 456,
        "status": "pending",
        "message": "I'd like to connect with you!",
        "createdAt": "2025-07-29T15:30:00.000Z",
        "updatedAt": "2025-07-29T15:30:00.000Z",
        "sender": {
          "id": 789,
          "email": "sender@example.com",
          "name": "John Doe",
          "photoURL": "https://example.com/photo.jpg",
          "title": "Chef",
          "userType": "user"
        },
        "type": "incoming",
        "canAccept": true,
        "canReject": true,
        "canCancel": false
      }
    ],
    "outgoing": []
  },
  "counts": {
    "total": 1,
    "incoming": 1,
    "outgoing": 0,
    "accepted": 0
  },
  "summary": {
    "hasIncomingRequests": true,
    "hasOutgoingRequests": false,
    "hasAnyPendingRequests": true
  }
}
```

---

### 5. Get User Connections
**GET** `/:userId/connections`

Retrieves all accepted connections for a user with privacy controls.

#### Parameters
- `userId` (number): ID of the user

#### Response
```json
{
  "connections": [
    {
      "connectionId": 456,
      "status": "accepted",
      "type": "outgoing",
      "message": "I'd like to connect with you!",
      "createdAt": "2025-07-29T15:30:00.000Z",
      "updatedAt": "2025-07-29T15:35:00.000Z",
      "connectedUser": {
        "id": 789,
        "email": "connected@example.com",
        "name": "Jane Smith",
        "photoURL": "https://example.com/photo.jpg",
        "title": "Chef",
        "userType": "user"
      }
    }
  ],
  "outgoing": [...],
  "incoming": [...],
  "total": 1,
  "privacySettings": {
    "type": "all",
    "canView": true
  }
}
```

---

### 6. Get Connection Status
**GET** `/status/:userId1/:userId2`

Gets the connection status between two users, supporting mutual connections.

#### Parameters
- `userId1` (number): First user ID
- `userId2` (number): Second user ID

#### Response
```json
{
  "outgoing": {
    "connectionId": 456,
    "status": "accepted"
  },
  "incoming": {
    "connectionId": 789,
    "status": "accepted"
  },
  "overall": {
    "status": "mutual_connected",
    "canSendRequest": false,
    "canAcceptRequest": false
  },
  "isMutualConnection": true,
  "isMutualPending": false,
  "isPartiallyConnected": false
}
```

#### Status Values
- `mutual_connected`: Both users have accepted connections to each other
- `mutual_pending`: Both users have pending requests to each other
- `partially_connected`: One direction is accepted, other is pending
- `connected_outgoing`: User1 has accepted connection to User2
- `connected_incoming`: User2 has accepted connection to User1
- `pending_outgoing`: User1 has pending request to User2
- `pending_incoming`: User2 has pending request to User1
- `not_connected`: No connections exist

---

### 7. Get Network Connections
**GET** `/network-connections/:userId`

Retrieves all users categorized by connection status for network display.

#### Parameters
- `userId` (number): ID of the user

#### Response
```json
{
  "followers": [
    {
      "id": 789,
      "name": "John Doe",
      "photoURL": "https://example.com/photo.jpg",
      "title": "Chef",
      "userType": "user",
      "connectionStatus": "follower",
      "isFollower": true,
      "isFollowing": false,
      "mutualConnections": [...],
      "mutualConnectionsCount": 2
    }
  ],
  "following": [...],
  "mutual": [...],
  "others": [...],
  "pendingSent": [...],
  "pendingReceived": [...],
  "allUsers": [...],
  "counts": {
    "followers": 5,
    "following": 3,
    "mutual": 2,
    "pendingSent": 1,
    "pendingReceived": 2,
    "others": 10
  }
}
```

#### Connection Status Values
- `mutual`: Both users have accepted connections to each other
- `following`: User is following the other user
- `follower`: Other user is following the user
- `request_sent`: User has sent a pending request
- `request_received`: User has received a pending request
- `none`: No connection exists

---

## Privacy & Profile APIs

### 8. Get Profile Details
**GET** `/profile/:userId`

Retrieves user profile with connection-based visibility controls.

#### Query Parameters
- `currentUserId` (number): ID of the viewing user
- `isPartner` (boolean): Whether viewer is a partner

#### Response
```json
{
  "id": 123,
  "email": "user@example.com",
  "privacyType": "all",
  "isOwnProfile": false,
  "connectionStatus": {
    "status": "connected",
    "connectionId": 456
  },
  "user": {
    "name": "John Doe",
    "photoURL": "https://example.com/photo.jpg",
    "currentPosition": "Head Chef",
    "email": "user@example.com",
    "phone": "+1234567890",
    "location": "New York",
    "state": "NY"
  },
  "partner": null,
  "expert": null,
  "admin": null
}
```

#### Connection Status Values
- `connect`: No connection, can send request
- `connected`: Already connected
- `connect_back`: Other user is connected, can connect back
- `request_sent`: Request already sent
- `request_received`: Request received, can accept/reject

---

### 9. Update User Privacy
**PUT** `/user/:userId/privacy`

Updates user privacy settings.

#### Parameters
- `userId` (number): ID of the user

#### Request Body
```json
{
  "privacyType": "selected",
  "selectedViewers": [456, 789]
}
```

#### Privacy Types
- `all`: Visible to everyone
- `none`: Visible only to self
- `selected`: Visible only to selected users
- `followers`: Visible only to followers
- `following`: Visible only to following

#### Response
```json
{
  "message": "Privacy settings updated successfully",
  "user": {
    "id": 123,
    "privacyType": "selected",
    "selectedViewers": [456, 789]
  }
}
```

---

### 10. Get Privacy Settings
**GET** `/user/:userId/privacy`

Retrieves user privacy settings.

#### Parameters
- `userId` (number): ID of the user

#### Response
```json
{
  "id": 123,
  "privacyType": "selected",
  "selectedViewers": [456, 789],
  "followers": [101, 102],
  "following": [201, 202]
}
```

---

### 11. Get Selected Viewers
**GET** `/selected-viewers/:userId`

Retrieves users that the specified user has selected for privacy viewing.

#### Parameters
- `userId` (number): ID of the user

#### Response
```json
[
  {
    "id": 456,
    "name": "Jane Smith",
    "photoURL": "https://example.com/photo.jpg",
    "selected": true
  }
]
```

---

## Follow System APIs

### 12. Update Follow Status
**PUT** `/follow-status`

Updates follow status between users.

#### Request Body
```json
{
  "connectionId": 456,
  "action": "follow",
  "targetUserId": 789
}
```

#### Actions
- `follow`: Follow the target user
- `unfollow`: Unfollow the target user

#### Response
```json
{
  "message": "Successfully followed user",
  "connection": {
    "id": 456,
    "following": [789],
    "followers": [123]
  }
}
```

---

### 13. Get Connection Visibility
**GET** `/visibility/:connectionId`

Checks if a user can view a specific connection based on privacy settings.

#### Parameters
- `connectionId` (number): ID of the connection

#### Request Body
```json
{
  "userId": 123
}
```

#### Response
```json
{
  "connection": {
    "id": 456,
    "privacyType": "selected",
    "selectedViewers": [123, 789]
  },
  "visibility": {
    "privacyType": "selected",
    "canView": true,
    "isFollower": false,
    "isFollowing": true
  }
}
```

---

## Debug & Utility APIs

### 14. Debug Connection Categorization
**GET** `/debug-categorization/:userId`

Debug endpoint to test connection categorization logic.

#### Parameters
- `userId` (number): ID of the user

#### Response
```json
{
  "userId": 123,
  "totalConnections": 5,
  "connectionMap": [
    {
      "userId": 456,
      "userName": "John Doe",
      "outgoingStatus": "accepted",
      "incomingStatus": "accepted",
      "finalStatus": "mutual"
    }
  ],
  "categories": {
    "followers": [...],
    "following": [...],
    "mutual": [...],
    "pendingSent": [...],
    "pendingReceived": [...]
  },
  "counts": {
    "followers": 2,
    "following": 1,
    "mutual": 1,
    "pendingSent": 0,
    "pendingReceived": 1
  }
}
```

---

### 15. Debug Pending Requests
**GET** `/debug-pending-requests/:userId`

Debug endpoint to test pending requests functionality.

#### Parameters
- `userId` (number): ID of the user

#### Response
```json
{
  "userId": 123,
  "totalConnections": 5,
  "connections": {
    "pendingIncoming": [...],
    "pendingOutgoing": [...],
    "acceptedIncoming": [...],
    "acceptedOutgoing": [...]
  },
  "counts": {
    "pendingIncoming": 2,
    "pendingOutgoing": 1,
    "acceptedIncoming": 1,
    "acceptedOutgoing": 1
  }
}
```

---

### 16. Test Pending Requests
**GET** `/test-pending-requests/:userId`

Simple test endpoint for pending requests.

#### Parameters
- `userId` (number): ID of the user

#### Response
```json
{
  "message": "Test successful",
  "user": {
    "id": 123,
    "email": "user@example.com"
  },
  "pendingConnections": [
    {
      "id": 456,
      "senderId": 789,
      "receiverId": 123,
      "status": "pending",
      "message": "Test request",
      "createdAt": "2025-07-29T15:30:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 17. Create Test Incoming Requests
**POST** `/create-test-incoming/:userId`

Creates test incoming connection requests for testing purposes.

#### Parameters
- `userId` (number): ID of the user to create requests for

#### Response
```json
{
  "success": true,
  "message": "Created 3 test incoming requests",
  "createdRequests": [
    {
      "id": 456,
      "senderId": 789,
      "receiverId": 123,
      "message": "Test connection request from user 789",
      "createdAt": "2025-07-29T15:30:00.000Z"
    }
  ],
  "totalRequests": 3
}
```

---

### 18. Sync All Users Followers/Following
**POST** `/sync-followers-following`

Admin utility to sync all users' followers/following arrays from connections.

#### Response
```json
{
  "message": "Sync completed successfully",
  "syncedCount": 50,
  "totalUsers": 100
}
```

---

### 19. Debug User Arrays
**GET** `/debug-user-arrays/:userId`

Debug endpoint to check followers/following arrays for a user.

#### Parameters
- `userId` (number): ID of the user

#### Response
```json
{
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "user@example.com"
  },
  "currentArrays": {
    "followers": [456, 789],
    "following": [101, 102]
  },
  "expectedFromConnections": {
    "followers": [456, 789],
    "following": [101, 102]
  },
  "acceptedConnections": 4,
  "arraysMatch": {
    "followers": true,
    "following": true
  }
}
```

---

### 20. Test Connection Status
**GET** `/test-connection-status/:userId`

Test endpoint to verify connection status logic.

#### Parameters
- `userId` (number): ID of the user

#### Response
```json
{
  "currentUser": {
    "id": 123,
    "followers": [456, 789],
    "following": [101, 102]
  },
  "testResults": [
    {
      "userId": 456,
      "name": "Jane Smith",
      "isFollower": true,
      "isFollowing": false,
      "connectionStatus": "follower",
      "connectionId": 789,
      "connectionStatusFromDB": "accepted"
    }
  ],
  "totalConnections": 5
}
```

---

## Error Responses

### Common Error Formats

#### 400 Bad Request
```json
{
  "message": "Invalid user ID"
}
```

#### 401 Unauthorized
```json
{
  "message": "Access token is missing or invalid"
}
```

#### 404 Not Found
```json
{
  "message": "User not found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

---

## Connection System Features

### Mutual Connection System
- Users can send connection requests to each other
- When both users send requests, they become automatically connected
- Supports bidirectional relationships

### Privacy Controls
- Multiple privacy levels: all, none, selected, followers, following
- Profile visibility based on connection status
- Granular control over who can view user information

### Follow System
- Users can follow/unfollow each other
- Followers/following arrays are maintained
- Privacy controls based on follow status

### Network Categorization
- Users are categorized into: mutual, following, followers, pending, others
- Supports network display with proper filtering
- Includes mutual connection counts

---

## Testing & Development

### Test Data Creation
Use the test endpoints to create sample data:
1. `/create-test-incoming/:userId` - Create test incoming requests
2. `/test-pending-requests/:userId` - Test pending requests
3. `/debug-categorization/:userId` - Debug connection categorization

### Debug Endpoints
- `/debug-user-arrays/:userId` - Check followers/following arrays
- `/debug-pending-requests/:userId` - Debug pending requests
- `/test-connection-status/:userId` - Test connection status logic

### Sync Utilities
- `/sync-followers-following` - Sync all users' arrays from connections

---

## Notes

1. **Authentication**: All endpoints require valid JWT token
2. **User Types**: Supports user, partner, expert, and admin types
3. **Active Users**: Only active users (`isActive: true`) are included in queries
4. **Mutual Connections**: Both directions must be accepted for mutual status
5. **Privacy**: Profile visibility depends on connection status and privacy settings
6. **Notifications**: Connection actions trigger notifications automatically
7. **Error Handling**: Comprehensive error handling with detailed messages
8. **Performance**: Optimized queries with proper indexing 