# IT ERP

Internal ERP application for employees, projects, attendance, leave, payroll, support tickets, and analytics.

## Current Workflow

- Super Admin manages users, departments, payroll base salary, and company records.
- Admin manages attendance timing settings and can import attendance.
- Manager handles projects, teams, employee lookup, and departmental workflows.
- Team Leads manage tasks and approvals within their team scope.
- Employees use the portal for attendance, leave, payroll, support tickets, and notifications.

## Repository Layout

- `backend` - Node.js, Express, Prisma, PostgreSQL API
- `frontend` - React web dashboard
- `mobile-app` - Android Studio app
- `docs` - SRS, API list, role matrix, ER diagram
- `assets` - Shared project assets

## Docs

- `docs/ERP_SRS.docx` - project requirements and scope
- `docs/API_List.xlsx` - API reference
- `docs/Role_Matrix.xlsx` - role and permission mapping
- `docs/ER_Diagram.drawio` - database diagram
- `docs/Attendance_Import_Template.xlsx` - attendance upload template
- `docs/Attendance_Import_Guide.md` - attendance file format guide

## Backend

Open:

```text
K:\IT\IT_ERP\backend
```

Run:

```powershell
npm install
npx prisma migrate dev
npm start
```

Backend URL:

```text
http://localhost:3000
```

## Frontend

Open:

```text
K:\IT\IT_ERP\frontend
```

Run:

```powershell
npm install
npm run dev
```

## Android App

Open:

```text
K:\IT\IT_ERP\mobile-app
```

For the Android emulator:

```text
http://10.0.2.2:3000
```

For a physical phone, use your PC's local network IP:

```text
http://YOUR_PC_IP:3000
```

## PostgreSQL

Configure `backend\.env`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/it_erp
JWT_SECRET=your_secret_key
PORT=3000
```

## API Checks

Use the sample requests in:

```text
K:\IT\IT_ERP\backend\test_full.http
```

Common endpoints:

- `POST /auth/login`
- `GET /dashboard`
- `GET /projects`
- `GET /tasks`
- `GET /attendance`
- `GET /leave-requests`
- `GET /notifications`

## Attendance Import Format

Attendance import uses these columns:

- `employeeId`
- `date`
- `checkIn`
- `checkOut`

Optional columns:

- `remarks`

The backend calculates late minutes and overtime from the admin-defined office timing rules.
