# Attendance Management System (MERN)

Complete Attendance Management System with JWT auth, RBAC, attendance capture, overtime approval, validation workflows, realtime notifications, and reporting.

## Project Layout

- Backend: [backend](D:\Attadance management system\backend)
- Frontend: [frontend](D:\Attadance management system\frontend)

## Quick Start

1. Backend
```bash
cd backend
npm install
npm run dev
```

2. Frontend
```bash
cd frontend
npm install

npm run dev
```



## Core Capabilities

- JWT Authentication (`/auth/signup`, `/auth/login`)
- Password management:
  - Change own password (`/auth/change-password`)
  - Admin reset user password (`/users/:userId/reset-password`)
- Role-Based Access Control (Employee, Manager, Admin)
- Attendance Punch In/Out with:
  - Selfie (base64)
  - Geolocation (lat/long)
  - Working hours computation
- Overtime workflow:
  - Employee request
  - Manager/Admin approve or reject
- Attendance validation:
  - Manager/Admin mark records valid/invalid
  - Remarks support
- Realtime notifications (Socket.IO):
  - Overtime requested
  - Overtime reviewed
  - Attendance validated
  - Persistent inbox with read/unread tracking
- Daily report API with role-scoped data
  - Download reports in CSV/Excel/PDF

## Architecture Summary

Backend follows layered clean architecture:
- Routes -> Controllers -> Services -> Repositories -> Models

Frontend follows feature-based modular architecture:
- Pages + shared components
- Redux Toolkit for state
- RTK Query for API and caching

## API Docs

Detailed backend endpoint documentation:


## Detailed Module Docs

- Backend setup and architecture: [backend README](D:\Attadance management system\backend\README.md)
- Frontend setup and architecture: [frontend README](D:\Attadance management system\frontend\README.md)
