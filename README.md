# IT ERP Project

This is the clean project copy inside the correct `K:\IT` folder.

## Folder Structure

```text
K:\IT\IT_ERP
├── backend      Node.js, Express, Prisma, PostgreSQL API
├── frontend     React web dashboard
├── mobile-app   Android Studio app
├── docs         SRS, API list, role matrix, ER diagram
├── database     Database-related project files
└── assets       Shared project assets
```

## Backend

Open in VS Code:

```text
K:\IT\IT_ERP\backend
```

Run:

```powershell
npm install
npx prisma migrate dev
node src/app.js
```

Backend URL:

```text
http://localhost:3000
```

## Frontend

Open in VS Code:

```text
K:\IT\IT_ERP\frontend
```

Run:

```powershell
npm install
npm run dev
```

## Android App

Open in Android Studio:

```text
K:\IT\IT_ERP\mobile-app
```

For the Android emulator, use this backend URL in the app:

```text
http://10.0.2.2:3000
```

For a real phone, use your computer's local network IP:

```text
http://YOUR_PC_IP:3000
```

## pgAdmin 4

Create a PostgreSQL database, then configure `backend\.env`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/it_erp
JWT_SECRET=your_secret_key
PORT=3000
```

## Postman

Use the request examples in:

```text
K:\IT\IT_ERP\backend\test_full.http
```

Main API checks:

- `POST /auth/login`
- `GET /dashboard`
- `GET /projects`
- `GET /tasks`
- `GET /attendance`
- `GET /leave-requests`
- `GET /notifications`
