# Attendance Management System - Backend

Production-ready Express + MongoDB backend for attendance workflows with JWT authentication, RBAC, overtime approvals, realtime notifications, and report generation.

## 1. Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Joi Validation
- Winston + Morgan Logging
- Socket.IO (Realtime notifications)

## 2. Project Structure

```text
backend/
  logs/
  src/
    app.js
    server.js
    config/
      env.js
      db.js
      logger.js
    constants/
      roles.js
      attendance.js
    controllers/
    middlewares/
    models/
    repositories/
    routes/
    services/
    validations/
    utils/
    realtime/
      socket.js
    docs/
      api-endpoints.md
  .env
  package.json
```

The structure follows a clean layered approach:
- `routes` -> HTTP definitions + middleware composition
- `controllers` -> request/response handling only
- `services` -> core business logic
- `repositories` -> data-access abstraction
- `models` -> MongoDB schemas
- `middlewares` -> auth, RBAC, validation, error handling

## 3. Environment Variables

Create `backend/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://<mongoDBurl>/attendance_management
JWT_SECRET=replace_with_long_random_secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

## 4. Setup and Run

```bash
cd backend
npm install
npm run dev
```

Base URL:

```text
http://localhost:5000/api/v1
```

Health Check:

```text
GET /api/v1/health
```

## 5. Authentication and RBAC

Roles:
- `EMPLOYEE`
- `MANAGER`
- `ADMIN`

JWT flow:
1. Login/signup returns JWT token.
2. Send token in `Authorization: Bearer <token>` header.
3. RBAC middleware validates role-level access to protected APIs.

## 6. Core Domain Models

### User
- `name`
- `email` (unique)
- `password` (hashed)
- `role` (`EMPLOYEE`, `MANAGER`, `ADMIN`)
- `manager` (reference to manager/admin user)
- `isActive`

### Attendance
- `user`
- `dateKey` (`YYYY-MM-DD`)
- `punchIn`: `time`, `selfie` (base64), `location { latitude, longitude }`
- `punchOut`: `time`, `selfie`, `location`
- `totalWorkingHours`
- `workingStatus` (`PENDING`, `COMPLETED`, `INCOMPLETE`)
- `overtime`: `requestedHours`, `approvedHours`, `status`
- `validation`: `status`, `remarks`, `validatedBy`, `validatedAt`

### OvertimeRequest
- `attendance`
- `employee`
- `dateKey`
- `requestedHours`
- `reason`
- `status` (`PENDING`, `APPROVED`, `REJECTED`)
- `reviewedBy`, `reviewedAt`, `reviewComment`

## 7. Working Hours Logic

- Standard shift is `8` hours.
- On punch-out:
  - `COMPLETED` if `totalWorkingHours >= 8`
  - `INCOMPLETE` if `totalWorkingHours < 8`
- If overtime is approved, attendance status is re-evaluated using:
  - `totalWorkingHours + approvedOvertimeHours`

## 8. Logging

- `morgan` captures HTTP access logs.
- `winston` stores:
  - `logs/combined.log`
  - `logs/error.log`



Auth highlights:
- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/change-password` (authenticated user)

Reports highlights:
- `GET /reports/daily` (paginated records)
- `GET /reports/daily/export?format=csv|xlsx|pdf` (download file)

Realtime highlights:
- Socket.IO connection with JWT auth
- Notification events:
  - overtime requested
  - overtime reviewed
  - attendance validated
- Persistent notifications API:
  - `GET /notifications`
  - `PATCH /notifications/:notificationId/read`
  - `PATCH /notifications/read-all`

## 10. Security and Reliability

- `helmet` for secure HTTP headers
- `cors` for origin control
- `express-rate-limit` for basic abuse protection
- `express-mongo-sanitize` for Mongo operator injection protection
- centralized error handling with consistent response format
