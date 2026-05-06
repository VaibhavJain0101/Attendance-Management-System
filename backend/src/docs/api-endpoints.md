# API Endpoints

Base path: `/api/v1`

## Auth

### POST `/auth/signup`
Create employee account.

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password@123",
  "managerId": "665df46a4b569ec82a5164f1"
}
```

### POST `/auth/login`
Login user and get JWT.

Request:
```json
{
  "email": "john@example.com",
  "password": "Password@123"
}
```

### POST `/auth/change-password` (Authenticated user)
Change current logged-in user password.

Request:
```json
{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@123",
  "confirmPassword": "NewPass@123"
}
```

## Attendance

### POST `/attendance/punch-in` (EMPLOYEE)
Request:
```json
{
  "selfie": "data:image/jpeg;base64,/9j/4AAQ...",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.209
  }
}
```

### POST `/attendance/punch-out` (EMPLOYEE)
Request:
```json
{
  "selfie": "data:image/jpeg;base64,/9j/4AAQ...",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.209
  }
}
```

### GET `/attendance` (Scoped by role)
Query params:
- `page`, `limit`
- `startDate`, `endDate`
- `status` (`PENDING|COMPLETED|INCOMPLETE`)
- `userId` (manager/admin scope only)

### PATCH `/attendance/:attendanceId/validate` (MANAGER, ADMIN)
Request:
```json
{
  "status": "VALID",
  "remarks": "Face matched and location verified"
}
```

## Overtime

### POST `/overtime/request` (EMPLOYEE)
Request:
```json
{
  "attendanceId": "665eb8820ad16e39708ba205",
  "requestedHours": 2,
  "reason": "Client deployment after shift"
}
```

### GET `/overtime` (Scoped by role)
Query params:
- `page`, `limit`
- `status` (`PENDING|APPROVED|REJECTED`)
- `employeeId` (manager/admin scope only)
- `startDate`, `endDate`

### PATCH `/overtime/:overtimeId/review` (MANAGER, ADMIN)
Request:
```json
{
  "status": "APPROVED",
  "reviewComment": "Approved for release activities"
}
```

## Reports

### GET `/reports/daily` (Scoped by role)
Query params:
- `date` (single day report)
- or `startDate` + `endDate`
- `page`, `limit`
- `userId` (manager/admin scope only)

Response row includes:
- employee name/email
- punch-in/out time
- selfie references
- location
- total working hours
- completion status
- validation details

### GET `/reports/daily/export` (Scoped by role)
Download report with all matching rows (no pagination).

Query params:
- `format`: `csv | xlsx | pdf`
- `date` (single day report)
- or `startDate` + `endDate`
- `userId` (manager/admin scope only)

## Users

### GET `/users` (ADMIN)
Query params:
- `page`, `limit`
- `role`
- `managerId`

### POST `/users` (ADMIN)
Create user with role assignment.

Request:
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "password": "SecurePass@123",
  "role": "MANAGER",
  "managerId": null
}
```

Notes:
- For `EMPLOYEE`, `managerId` can be set to a manager/admin user id.
- For `MANAGER` or `ADMIN`, `managerId` is ignored and stored as `null`.

### PATCH `/users/:userId` (ADMIN)
Update user role, manager linkage, status, and name.

Request:
```json
{
  "role": "EMPLOYEE",
  "managerId": "665df46a4b569ec82a5164f1",
  "isActive": true
}
```

### PATCH `/users/:userId/reset-password` (ADMIN)
Reset any user password.

Request:
```json
{
  "newPassword": "FreshPass@123",
  "confirmPassword": "FreshPass@123"
}
```

### GET `/users/team` (MANAGER, ADMIN)
For managers: returns their team.
For admin: use optional `managerId` to filter specific team.

## Notifications

### GET `/notifications` (Authenticated user)
Query params:
- `page`, `limit`
- `isRead` (`true|false`)
- `type`

### PATCH `/notifications/:notificationId/read` (Authenticated user)
Mark a single notification as read.

### PATCH `/notifications/read-all` (Authenticated user)
Mark all unread notifications of current user as read.

## Common Response Format

Success:
```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {}
}
```

## Realtime Events (Socket.IO)

Socket auth:
- connect with JWT in `auth.token`

Client event received:
- `notification`

Notification types emitted:
- `SYSTEM`
- `OVERTIME_REQUESTED`
- `OVERTIME_REVIEWED`
- `ATTENDANCE_VALIDATED`

Error:
```json
{
  "success": false,
  "message": "...",
  "details": [],
  "stack": "..."
}
```
