# FixMate Frontend

A React (Vite) frontend for the FixMate Spring Boot backend — covers all three roles: **Customer**, **Provider**, and **Admin**.

## 1. Where this goes

Put this `fixmate-frontend` folder **next to** your `fixmate` backend folder, e.g.:

```
MY PROJECTS/
 ├── fixmate/            ← your Spring Boot backend
 └── fixmate-frontend/   ← this folder
```

They are two separate projects (Java vs. Node) and run independently, on different ports.

## 2. Prerequisites

- Node.js 18+ and npm. Check with:
  ```powershell
  node -v
  npm -v
  ```
  If missing, install from https://nodejs.org (LTS version).

## 3. Setup & run

```powershell
cd fixmate-frontend
npm install
npm run dev
```

Vite will start the dev server, normally at **http://localhost:5173**. Open that in your browser.

Your backend must already be running (e.g. `mvn spring-boot:run` in the `fixmate` folder) for login/register and everything else to work.

## 4. Pointing at your backend

The frontend reads the backend URL from `VITE_API_URL`. Copy the example env file:

```powershell
copy .env.example .env
```

Then edit `.env` if your backend isn't on port 8081:
```
VITE_API_URL=http://localhost:8081
```
(Change `8081` to whatever port your Spring Boot app is actually running on — check your `application.properties`.)

## 5. What's included

- **Login / Register** — role picker (Customer or Provider) on registration; JWT stored in `localStorage`, attached automatically to every API call.
- **Customer**: browse services (filter by category), book a service, view my bookings, cancel a pending booking, leave a review after a booking is completed.
- **Provider**: manage my services (create/edit/deactivate), view bookings received, accept/reject/complete bookings.
- **Admin**: dashboard stats, approve pending providers, enable/disable users, view all bookings platform-wide.

## 6. Project structure

```
src/
 ├── api/client.js          Axios instance + JWT header injection
 ├── context/AuthContext.jsx  Login/register/logout state, persisted in localStorage
 ├── components/            Sidebar, ProtectedRoute, StatusPill, Modal
 ├── pages/                 One file per screen (Login, Register, Customer*, Provider*, Admin*)
 ├── App.jsx                 Routes, role-based redirects
 ├── main.jsx                 Entry point
 └── index.css                All styling (design tokens at the top)
```

## 7. Build for production

```powershell
npm run build
```
Outputs a static site to `dist/` — deploy it anywhere that serves static files (Netlify, Vercel, GitHub Pages, or your own server). Remember to set `VITE_API_URL` to your deployed backend's URL before building.

## 8. Troubleshooting

- **CORS errors in the browser console**: the backend's `SecurityConfig` already allows all origins (`*`), so this shouldn't happen if the backend is running. If it does, double-check `VITE_API_URL` matches the backend's actual address and port.
- **"Network Error" on login**: backend isn't running, or `.env`'s `VITE_API_URL` points to the wrong port.
- **Blank page after `npm run dev`**: check the terminal for a build error, and the browser console (F12) for a runtime error.
