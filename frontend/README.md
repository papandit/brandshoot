# BrandShoot — Frontend

Single React (Vite) app for **both** the user-facing product and the admin panel.
There is **one login page**; the backend returns the account's `role` and the app
redirects accordingly:

- `role === "admin"` → `/admin` (Admin Dashboard)
- anything else → `/` (User Home)

## Structure

```
src/
  config.js                 # API base URL (points at the Flask backend on :5000)
  services/api.js           # axios instance + auth requests
  context/AuthContext.jsx   # login / logout / session restore, exposes isAdmin
  components/
    ProtectedRoute.jsx      # route guard (supports requireAdmin)
  pages/
    Login.jsx               # the single login page -> role-based redirect
    user/UserHome.jsx       # user landing screen
    admin/AdminDashboard.jsx# admin landing screen
  styles/theme.css          # all styling
  App.jsx                   # routes
```

## Run

```bash
npm install
npm run dev          # http://localhost:5173
```

The login talks to the backend at `http://127.0.0.1:5000` (see `src/config.js`),
so start the backend (`../backend`) and MongoDB first for login to succeed.

## Creating accounts

- A normal user can be created via the backend's `POST /auth/signup`, or seeded
  with `backend/seed_data.py`.
- Make an account an admin with `backend/promote_admin.py` (sets `role: "admin"`).
  Log in with those credentials and you land on the admin dashboard.
