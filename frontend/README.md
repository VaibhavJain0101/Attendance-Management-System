# Attendance Management System - Frontend

React + Vite frontend with Redux Toolkit and RTK Query for role-based attendance workflows.

## Stack

- React 18 (Vite)
- Redux Toolkit
- RTK Query
- React Router v6
- Socket.IO Client (Realtime notifications)

## Setup

```bash
cd frontend
npm install
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

## Environment

Create `frontend/.env` :

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
GOOGLE_MAP_API: ......```

## Features Implemented

- Login with JWT-based session persistence (localStorage)
- Role-protected routes:
  - Employee dashboard
  - Manager dashboard
  - Admin dashboard
- Attendance page:
  - Punch in/out
  - Live selfie capture using `getUserMedia`
  - Geolocation capture using browser Geolocation API
  - Overtime request form
- Manager/Admin validation workflows:
  - Mark attendance valid/invalid
  - Approve/reject overtime requests
- Admin user management:
  - Create users (Employee/Manager/Admin)
  - Update role, manager mapping, and active/inactive status
  - Reset user password
- Account settings:
  - Change own password
- Reports page with date filters and scoped data access
  - Export reports as CSV, Excel, and PDF
- Realtime notifications panel:
  - Overtime requested
  - Overtime reviewed
  - Attendance validated
  - Persistent unread/read notifications with mark-read actions

## Frontend Structure

```text
src/
  app/
    router/
    store/
  components/
    common/
    layout/
  features/
    auth/
    attendance/
    overtime/
    reports/
    users/
    notifications/
  pages/
  styles/
  utils/
```

## Notes

- API integration is centralized through RTK Query `apiSlice`.
- Unauthorized API responses automatically logout users.
- Tables are responsive via horizontal scrolling on small screens.
