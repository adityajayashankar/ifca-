# Partner API Documentation

This document describes the Partner API endpoints for creating and managing partners in the IFCA system.

## Authentication

All endpoints require authentication using JWT tokens. Admin endpoints require admin-level authentication.

## Endpoints

### 1. Create Single Partner

**POST** `/api/v1/partner`

Creates a new partner with proper signup logic, password hashing, and email notifications.

#### Request Headers
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "email": "partner@example.com",
  "name": "Partner Name",
  "phone": "9876543210",
  "address": "123 Partner Street, City",
  "pincode": "123456",
  "photoURL": "https://example.com/photo.jpg",
  "desc": "Partner description",
  "password": "Abcd@123"
}
```

#### Validation Rules
- **email**: Required, must be valid email format, unique across all user types
- **name**: Required, minimum 2 characters
- **phone**: Required, minimum 10 characters, unique across all user types
- **address**: Required, minimum 5 characters
- **pincode**: Required, minimum 5 characters
- **photoURL**: Optional, must be valid URL if provided
- **desc**: Optional, defaults to "Hey there! I am a partner"
- **password**: Optional, defaults to "Abcd@123"

#### Response (201 Created)
```json
{
  "message": "Partner created successfully",
  "partner": {
    "id": 1,
    "email": "partner@example.com",
    "name": "Partner Name",
    "phone": "9876543210",
    "photoURL": "https://example.com/photo.jpg",
    "credits": 0
  },
  "credentials": {
    "email": "partner@example.com",
    "password": "Abcd@123"
  }
}
```

#### Error Responses
- **400 Bad Request**: Validation errors
- **409 Conflict**: Email or phone already registered
- **500 Internal Server Error**: Server error

### 2. Bulk Upload Partners

**POST** `/api/v1/partner/bulk-upload`

Uploads multiple partners from an Excel file with validation and error handling.

#### Request Headers
```
Authorization: Bearer <admin_jwt_token>
Content-Type: multipart/form-data
```

#### Request Body
```
file: Excel file (.xlsx or .xls)
```

#### Excel File Format
The Excel file should have the following columns:
- **email**: Partner email address
- **name**: Partner name
- **phone**: Phone number
- **address**: Address
- **pincode**: Pincode
- **photoURL**: (Optional) Photo URL
- **desc**: (Optional) Description

#### Response (200 OK)
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
        "id": 1,
        "email": "partner1@example.com",
        "name": "Partner 1",
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

#### Error Responses
- **400 Bad Request**: No file uploaded or empty file
- **500 Internal Server Error**: Server error

### 3. Get All Partners

**GET** `/api/v1/partner`

Retrieves all partners with active/inactive status.

#### Response (200 OK)
```json
{
  "activePartners": [...],
  "inactivePartners": [...]
}
```

### 4. Get Partner by ID

**GET** `/api/v1/partner/:id`

Retrieves a specific partner by ID.

#### Response (200 OK)
```json
{
  "partner": {
    "id": 1,
    "email": "partner@example.com",
    "name": "Partner Name",
    "phone": "9876543210",
    "address": "123 Partner Street",
    "pincode": "123456",
    "credits": 0,
    "photoURL": "https://example.com/photo.jpg",
    "desc": "Partner description",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "unifiedUserId": {
      "id": 1,
      "email": "partner@example.com",
      "isActive": true
    }
  }
}
```

### 5. Update Partner

**PATCH** `/api/v1/partner/:id`

Updates partner information.

#### Request Body
```json
{
  "phone": "9876543211",
  "address": "Updated Address",
  "credits": 100
}
```

### 6. Delete Partner

**DELETE** `/api/v1/partner/:id`

Deactivates a partner (soft delete).

#### Response (200 OK)
```json
{
  "msg": "Partner deactivated successfully"
}
```

### 7. Enable Partner

**PATCH** `/api/v1/partner/:id/enable`

Reactivates a previously deactivated partner.

#### Response (200 OK)
```json
{
  "msg": "Partner enabled successfully"
}
```

### 8. Get Partner Communities

**GET** `/api/v1/partner/:id/communities`

Retrieves communities associated with a partner.

### 9. Get Partner Community Requests

**GET** `/api/v1/partner/:id/communitiesRequests`

Retrieves pending community requests for a partner.

### 10. Get Partner Sessions

**GET** `/api/v1/partner/:id/sessions`

Retrieves sessions associated with a partner.

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 10
2. **Duplicate Prevention**: Email and phone uniqueness across all user types
3. **Input Validation**: Comprehensive validation for all input fields
4. **File Upload Security**: Excel file validation and size limits (5MB)
5. **Authentication**: JWT-based authentication with role-based access control
6. **Transaction Safety**: Database operations use transactions for data consistency

## Email Notifications

When a partner is created (single or bulk), a welcome email is sent automatically with:
- Login credentials
- Dashboard access link
- Welcome message

## Error Handling

The API provides detailed error messages for:
- Validation failures
- Duplicate entries
- File upload issues
- Database errors
- Authentication failures

## File Upload Requirements

- **File Format**: Excel (.xlsx or .xls)
- **File Size**: Maximum 5MB
- **Required Columns**: email, name, phone, address, pincode
- **Optional Columns**: photoURL, desc

## Database Schema

Partners are stored in the `Partner` table with the following key fields:
- `id`: Primary key
- `email`: Unique email address
- `name`: Partner name
- `phone`: Unique phone number
- `address`: Address
- `pincode`: Pincode
- `password`: Hashed password
- `credits`: Available credits
- `photoURL`: Profile photo URL
- `desc`: Description
- `adminId`: Associated admin ID
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

Each partner also has a corresponding entry in the `unifiedUser` table for system-wide user management. 