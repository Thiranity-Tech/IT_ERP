# IT ERP Android App

Native Android client for the IT ERP backend in this repository.

## What is included

- Login with `/auth/login`.
- JWT storage and automatic `Authorization: Bearer <token>` headers.
- Dashboard counters from `/dashboard`.
- List screens for projects, tasks, attendance, leave requests, notifications, daily scrums, users, teams, departments, clients, support tickets, payrolls, incentives, reports, and analytics.
- Leave request submission through `/leave-requests`.
- Daily scrum submission through `/daily-scrums`.
- Password update through `/auth/change-password`.
- Leave approval/rejection for manager-level users and above.
- Notification mark-as-read action.
- Debug-only backend base URL override for emulator and physical devices.

## Tools workflow

### 1. PostgreSQL and pgAdmin 4

1. Open pgAdmin 4.
2. Create a database named `it_erp`.
3. Keep your PostgreSQL username, password, host, and port ready for `DATABASE_URL`.

Example backend `.env`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/it_erp
JWT_SECRET=your_secret_key
PORT=3000
```

### 2. Backend in VS Code

Open `backend` in VS Code and run:

```powershell
npm install
npx prisma migrate dev
node src/app.js
```

The API should respond at:

```text
http://localhost:3000
```

### 3. Postman

Use the backend endpoints from `backend/test_full.http` as the Postman request list.

Important mobile endpoints:

- `POST /auth/login`
- `GET /dashboard`
- `GET /projects`
- `GET /tasks`
- `GET /attendance`
- `GET /leave-requests`
- `POST /leave-requests`
- `PUT /leave-requests/:id/status`
- `GET /notifications`
- `PUT /notifications/:id/read`
- `POST /daily-scrums`
- `PUT /auth/change-password`

Set an environment variable in Postman:

```text
base_url = http://localhost:3000
```

For protected requests, add:

```text
Authorization: Bearer {{token}}
```

### 4. Android Studio

1. Open this `mobile-app` folder in Android Studio.
2. Let Gradle sync and install any missing Android SDK packages.
3. Start the backend first.
4. Run the app on an emulator.
5. The app default API URL is:

```text
http://10.0.2.2:3000
```

`10.0.2.2` is the Android emulator address for your computer's `localhost`.

For a real phone in debug builds, connect the phone and computer to the same Wi-Fi network, then set the app API URL to your computer IPv4 address:

```text
http://YOUR_PC_IP:3000
```

Example:

```text
http://192.168.1.10:3000
```

For a published release build, pass the backend URL at build time so the app packages it automatically:

```powershell
./gradlew assembleRelease -PAPI_BASE_URL=https://api.yourdomain.com
```

The release APK hides the API settings screen and always uses the packaged URL.

## Default login

The backend has a create-super-admin endpoint that creates:

```text
employeeId: SA001
password: admin123
```

If you changed the password while testing, use the latest password from your backend database or reset it through `/auth/forgot-password`.

## Notes

- This app intentionally uses native Android Java and platform views only, so it does not need Retrofit, Compose, Material, or AndroidX dependencies.
- Android blocks plain HTTP by default on newer versions; this project enables cleartext HTTP for local development.
- The docs mention some endpoint names that differ from the implemented backend. The app follows the implemented Express routes.
