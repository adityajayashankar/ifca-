# Community User Role Management Documentation

## Overview

The Community User Role Management system allows administrators and moderators to manage user roles within communities. This system supports three distinct roles: **MEMBER**, **MODERATOR**, and **ADMIN**, each with different permissions and capabilities.

## Table of Contents

1. [Role Hierarchy & Permissions](#role-hierarchy--permissions)
2. [API Endpoints](#api-endpoints)
3. [Frontend Implementation](#frontend-implementation)
4. [Database Schema](#database-schema)
5. [User Interface Components](#user-interface-components)
6. [Notification System](#notification-system)
7. [Security & Validation](#security--validation)
8. [Recent Changes & Updates](#recent-changes--updates)

## Role Hierarchy & Permissions

### Role Structure
```
ADMIN (Highest Authority)
├── Full administrative control
├── Manage members and roles
├── Control community settings
├── Access all features
└── Can promote/demote other users

MODERATOR (Moderate Authority)
├── Moderate discussions
├── Manage posts and comments
├── Help maintain guidelines
├── Assist with member management
└── Cannot change admin roles

MEMBER (Standard User)
├── Participate in discussions
├── Access community resources
├── Connect with members
└── Engage in activities
```

### Role Capabilities Matrix

| Feature | MEMBER | MODERATOR | ADMIN |
|---------|--------|-----------|-------|
| View community content | ✅ | ✅ | ✅ |
| Post and comment | ✅ | ✅ | ✅ |
| Add new members | ❌ | ✅ | ✅ |
| Remove members | ❌ | ✅ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| Manage community settings | ❌ | ❌ | ✅ |
| Moderate content | ❌ | ✅ | ✅ |
| Access admin panel | ❌ | ❌ | ✅ |

## API Endpoints

### 1. Update Member Role
**Endpoint:** `PUT /api/v1/community/:communityId/members/:userId/role`

**Description:** Updates a user's role within a specific community.

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "userId": 123,
  "role": "ADMIN" | "MODERATOR" | "MEMBER"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully updated John Doe's role to ADMIN",
  "data": {
    "subscription": {
      "id": 456,
      "role": "ADMIN",
      "unifiedUserId": 789,
      "communityId": 42,
      "unifiedUser": {
        "user": { "name": "John Doe", "email": "john@example.com" }
      }
    },
    "user": {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN"
    }
  }
}
```

**Error Responses:**
- `400` - Invalid role or missing required fields
- `404` - Community or user not found
- `500` - Internal server error

### 2. Get Community Members
**Endpoint:** `GET /api/v1/community/:communityId/members`

**Description:** Retrieves all members of a community with their roles.

**Query Parameters:**
- `role` (optional): Filter by specific role (ADMIN, MODERATOR, MEMBER)

**Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": 456,
        "role": "ADMIN",
        "startsAt": "2024-01-15T10:00:00Z",
        "unifiedUser": {
          "user": {
            "id": 123,
            "name": "John Doe",
            "email": "john@example.com",
            "photoURL": "https://example.com/avatar.jpg"
          }
        }
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20
    }
  }
}
```

### 3. Get Current User Role
**Endpoint:** `GET /api/v1/community/:communityId/my-role`

**Description:** Gets the current user's role in a specific community.

**Response:**
```json
{
  "success": true,
  "data": {
    "role": "ADMIN",
    "communityId": 42,
    "userId": 123
  }
}
```

## Frontend Implementation

### Key Components

#### 1. Frontend RightBar Component (`frontend/components/rightBar/index.jsx`)

**Features:**
- Role-based UI rendering
- Member management interface
- Role change modal with confirmation
- Real-time role updates
- Search and filter functionality

**Key Functions:**
```javascript
// Role change handlers
const handleMakeAdmin = async (user) => { /* ... */ };
const handleMakeModerator = async (user) => { /* ... */ };
const handleRemoveAdmin = async (user) => { /* ... */ };
const handleRemoveModerator = async (user) => { /* ... */ };

// Role change confirmation modal
const openRoleChangeModal = (user, role) => { /* ... */ };
const confirmRoleChange = async () => { /* ... */ };
```

#### 2. Admin Frontend RightBar Component (`admin-frontend/components/rightBar/index.jsx`)

**Features:**
- Context menu for role management
- Material-UI integration
- Advanced member filtering
- Bulk operations support

**Key Functions:**
```javascript
// Context menu handlers
const handleContextMenu = (event, user) => { /* ... */ };
const handleRoleChange = async (userId, newRole) => { /* ... */ };

// Member management
const handleAddMember = async (userId) => { /* ... */ };
const handleRemoveMember = async (userId) => { /* ... */ };
```

#### 3. Community Page (`admin-frontend/pages/admin/community/[communityId].js`)

**Features:**
- Comprehensive member management
- Role change modal
- Member addition/removal
- Search and pagination

**Key Functions:**
```javascript
const handleRoleChange = async () => { /* ... */ };
const openRoleModal = (user) => { /* ... */ };
const handleAddMember = async (userId) => { /* ... */ };
```

#### 4. People Page (`admin-frontend/pages/admin/community/people/index.js`)

**Features:**
- Optimistic UI updates
- Advanced role management
- Context menu integration
- Real-time updates

**Key Functions:**
```javascript
const handleRoleChange = useCallback(async (role) => { /* ... */ });
const openContextMenu = useCallback((user, event) => { /* ... */ });
```

### State Management

The system uses Redux for state management with the following slices:

#### Community Slice
```javascript
// Role management state
const [userRole, setUserRole] = useState(null);
const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState(null);
const [newRole, setNewRole] = useState('MEMBER');
const [roleChangeLoading, setRoleChangeLoading] = useState(false);
```

#### Redux Actions
```javascript
// Community slice actions
setRightBarAddMemberMode,
setRightBarAddMemberSearch,
setRightBarMemberSearch,
setRightBarNotificationPanelOpen,
setRightBarNotificationSearch
```

## Database Schema

### Subscription Table
The core table for managing community memberships and roles:

```sql
model Subscription {
  id            Int      @id @default(autoincrement())
  unifiedUserId Int
  communityId   Int
  role          String?  @default("MEMBER") // MEMBER, MODERATOR, ADMIN
  startsAt      DateTime @default(now())
  endsAt        DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  unifiedUser   UnifiedUser @relation(fields: [unifiedUserId], references: [id])
  community     Community   @relation(fields: [communityId], references: [id])

  @@unique([unifiedUserId, communityId])
  @@map("subscriptions")
}
```

### UnifiedUser Table
Centralized user management across different user types:

```sql
model UnifiedUser {
  id      Int  @id @default(autoincrement())
  userId  Int?
  expertId Int?
  partnerId Int?
  adminId Int?

  // Relations
  user    User?    @relation(fields: [userId], references: [id])
  expert  Expert?  @relation(fields: [expertId], references: [id])
  partner Partner? @relation(fields: [partnerId], references: [id])
  admin   Admin?   @relation(fields: [adminId], references: [id])
  
  subscriptions Subscription[]

  @@map("unified_users")
}
```

## User Interface Components

### Role Change Modal

**Features:**
- User information display
- Current role indication
- Role selection dropdown
- Permission preview
- Confirmation buttons

**Modal Structure:**
```jsx
<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50">
  <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
    {/* User Info Section */}
    <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
      {/* Avatar and user details */}
    </div>
    
    {/* Current Role Display */}
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Current Role
      </label>
      {/* Role badge */}
    </div>
    
    {/* New Role Selection */}
    <div className="mb-6">
      <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
        <option value="MEMBER">Member</option>
        <option value="MODERATOR">Moderator</option>
        <option value="ADMIN">Administrator</option>
      </select>
    </div>
    
    {/* Permission Preview */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      {/* Role-specific permissions */}
    </div>
    
    {/* Action Buttons */}
    <div className="flex gap-3 justify-end">
      <button onClick={handleCancel}>Cancel</button>
      <button onClick={confirmRoleChange}>Update Role</button>
    </div>
  </div>
</div>
```

### Context Menu

**Features:**
- Right-click or three-dot menu
- Role-specific options
- User information header
- Action confirmation

**Menu Structure:**
```jsx
<Menu
  open={!!contextMenu}
  onClose={handleCloseContextMenu}
  anchorReference="anchorPosition"
  anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
>
  {/* User Header */}
  <div className="px-4 py-2 border-b border-gray-100">
    {/* User name and email */}
  </div>
  
  {/* Role Management Options */}
  {contextMenu?.user?.role === 'ADMIN' ? (
    <MenuItem onClick={() => handleRoleChange(userId, 'MEMBER')}>
      Remove Administrator
    </MenuItem>
  ) : (
    <MenuItem onClick={() => handleRoleChange(userId, 'ADMIN')}>
      Make Administrator
    </MenuItem>
  )}
  
  {/* Additional options for moderators */}
  {/* Remove member option */}
</Menu>
```

## Notification System

### Role Change Notifications

When a user's role is changed, the system automatically creates notifications:

#### 1. User Notification
```javascript
await notificationService.createNotification({
  recipientId: unifiedUserId,
  senderId: req.user?.unifiedUserId,
  type: 'ROLE_CHANGE',
  title: `Role Updated in ${community.title}`,
  message: `Your role in "${community.title}" has been changed from ${oldRoleDisplay} to ${newRoleDisplay}.`,
  communityId: parseInt(communityId),
  metadata: {
    oldRole: oldRole,
    newRole: role.toUpperCase(),
    oldRoleDisplay: oldRoleDisplay,
    newRoleDisplay: newRoleDisplay,
    communityName: community.title,
    communityId: parseInt(communityId),
    changedBy: req.user?.unifiedUserId,
    changedAt: new Date().toISOString()
  },
  shouldEmail: true,
  emailTemplate: 'role-change',
  actionUrl: `/comHome/${communityId}`
});
```

#### 2. Admin Notification (for new admins)
When a user is promoted to admin, other admins in the community are notified:

```javascript
await notificationService.createNotification({
  recipientId: adminUnifiedUserId,
  senderId: req.user?.unifiedUserId,
  type: 'ROLE_CHANGE',
  title: `New Admin Added to ${community.title}`,
  message: `${userName} has been promoted to Community Administrator in "${community.title}".`,
  communityId: parseInt(communityId),
  metadata: {
    newAdminName: userName,
    newAdminId: userId,
    communityName: community.title,
    communityId: parseInt(communityId),
    promotedBy: req.user?.unifiedUserId,
    promotedAt: new Date().toISOString()
  },
  shouldEmail: false,
  actionUrl: `/comHome/${communityId}`
});
```

## Security & Validation

### Backend Validation

1. **Authentication Check:** All endpoints require valid JWT tokens
2. **Role Validation:** Only valid roles (MEMBER, MODERATOR, ADMIN) are accepted
3. **Community Existence:** Verifies community exists before role changes
4. **User Existence:** Validates user and unified user ID exist
5. **Subscription Check:** Ensures user is subscribed before role changes
6. **Permission Check:** Only admins can change roles (enforced in frontend)

### Frontend Security

1. **Role-based UI:** Components render based on user's current role
2. **Permission Gates:** Actions are hidden/shown based on permissions
3. **Confirmation Modals:** Critical actions require user confirmation
4. **Error Handling:** Comprehensive error handling and user feedback

### Data Validation

```javascript
// Backend validation
const validRoles = ['MEMBER', 'ADMIN', 'MODERATOR'];
if (!validRoles.includes(role.toUpperCase())) {
  return res.status(400).json({
    success: false,
    message: 'Invalid role. Must be one of: MEMBER, ADMIN, MODERATOR'
  });
}

// Frontend validation
if (!userId || !role) {
  console.error('Missing required fields for role change');
  return;
}
```

## Recent Changes & Updates

### New Features Added

1. **Enhanced Role Management UI**
   - Improved role change modal with permission previews
   - Better visual indicators for different roles
   - Streamlined user experience

2. **Notification System Integration**
   - Automatic notifications for role changes
   - Email notifications for users
   - Admin notifications for new administrators

3. **Optimistic UI Updates**
   - Immediate UI feedback for role changes
   - Fallback to server refresh on errors
   - Better loading states

4. **Advanced Member Management**
   - Bulk member operations
   - Advanced search and filtering
   - Context menu integration

5. **Mobile Responsiveness**
   - Mobile-optimized role management
   - Touch-friendly interfaces
   - Responsive modals and menus

### API Improvements

1. **Enhanced Error Handling**
   - Specific error codes for different scenarios
   - Detailed error messages
   - Proper HTTP status codes

2. **Notification Integration**
   - Automatic notification creation
   - Email template support
   - Metadata tracking

3. **Database Optimization**
   - Efficient queries with proper includes
   - Transaction support for critical operations
   - Proper indexing for performance

### Frontend Enhancements

1. **State Management**
   - Redux integration for global state
   - Optimistic updates
   - Proper loading states

2. **User Experience**
   - Confirmation modals for critical actions
   - Real-time feedback
   - Intuitive role management interface

3. **Accessibility**
   - Keyboard navigation support
   - Screen reader compatibility
   - Proper ARIA labels

## Usage Examples

### Making a User an Administrator

```javascript
// Frontend call
const response = await api.put(`/community/${communityId}/members/${userId}/role`, {
  userId: userId,
  role: 'ADMIN'
});

if (response.data.success) {
  toast.success(`Successfully made ${userName} an Administrator`);
  // Refresh member list
  onMembersChanged();
}
```

### Getting Community Members by Role

```javascript
// Get all administrators
const response = await api.get(`/community/${communityId}/members?role=ADMIN`);

// Get all members
const response = await api.get(`/community/${communityId}/members?role=MEMBER`);
```

### Checking Current User Role

```javascript
// Check if current user is admin
const response = await api.get(`/community/${communityId}/my-role`);
const userRole = response.data.data.role;

if (userRole === 'ADMIN') {
  // Show admin controls
  showAdminPanel();
}
```

## Troubleshooting

### Common Issues

1. **Role Change Fails**
   - Check if user is subscribed to community
   - Verify user has admin permissions
   - Ensure valid role is provided

2. **UI Not Updating**
   - Check if `onMembersChanged` callback is provided
   - Verify Redux state updates
   - Check for JavaScript errors in console

3. **Notifications Not Sent**
   - Verify notification service is running
   - Check email configuration
   - Review notification service logs

### Debug Information

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'community:role-management');
```

This will log detailed information about role changes, API calls, and state updates.

## Future Enhancements

1. **Role Templates**
   - Predefined role sets for different community types
   - Custom permission configurations

2. **Audit Trail**
   - Complete history of role changes
   - Admin action logging

3. **Bulk Operations**
   - Bulk role changes
   - Mass member management

4. **Advanced Permissions**
   - Granular permission system
   - Custom role creation

5. **Integration Features**
   - Webhook support for role changes
   - Third-party system integration
   - API rate limiting and monitoring

---


