# 🏥 MediBook Pro

> A full-stack medical appointment booking platform built with React, Node.js, and MongoDB.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

---

## 📋 Overview

MediBook Pro is a full-stack web application that streamlines the process of booking medical appointments. Patients can discover and book doctors, doctors can manage their schedules and patient data, and admins have full oversight of the platform through a dedicated dashboard.

**Live Demo:** [medibook-app.vercel.app](https://medibook-app-rouge.vercel.app/)

---

## ✨ Features

### 👤 Patients
- Search for doctors by specialty, price range, and rating
- View detailed doctor profiles with reviews and availability
- Book, reschedule, and cancel appointments
- Access personal medical records
- Receive real-time notifications

### 🩺 Doctors
- Dashboard with upcoming appointments at a glance
- Manage weekly schedule and time-slot availability
- Complete a guided professional onboarding flow
- Track patient history and appointment status

### 🔧 Administrators
- Platform-wide statistics and analytics dashboard
- User management — activate, deactivate, and assign roles
- Doctor verification workflow
- Monthly analytics reports

---

## 🗂️ Project Structure

```
medibook-pro/
├── medibook-app/               # Frontend — React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/         # Landing, Login, Register, Search, Booking
│   │   │   ├── patient/        # Dashboard, Appointments, Medical Records, Profile
│   │   │   ├── doctor/         # Dashboard, Schedule, Onboarding
│   │   │   └── admin/          # Dashboard, Users, Analytics, Appointments
│   │   ├── components/
│   │   │   ├── layout/         # Navbar, AdminSidebar
│   │   │   └── ui/             # DoctorCard, Toast
│   │   └── context/            # AuthContext (JWT-based auth state)
│   ├── vercel.json
│   └── .env.example
│
└── medibook-backend/           # Backend — Node.js + Express + MongoDB
    ├── src/
    │   ├── controllers/        # auth, doctor, appointment, admin, notification, medicalRecord
    │   ├── models/             # User, Appointment, MedicalRecord, Notification, Review
    │   ├── routes/             # Modular Express routers
    │   ├── middleware/         # JWT authentication guard
    │   └── config/             # Database connection, Multer, seed script
    ├── vercel.json
    └── .env.example
```

---

## 🛣️ Routes Reference

### Frontend

| Route | Page | Access |
|-------|------|--------|
| `/` | Landing Page | Public |
| `/search` | Doctor Search | Public |
| `/doctor/:id` | Doctor Profile | Public |
| `/book/:id` | Booking Confirmation | Patient |
| `/booking-success` | Booking Success | Patient |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/patient/dashboard` | Patient Dashboard | Patient |
| `/patient/appointments` | My Appointments | Patient |
| `/patient/records` | Medical Records | Patient |
| `/patient/settings` | Profile Settings | Patient |
| `/doctor/dashboard` | Doctor Dashboard | Doctor |
| `/doctor/schedule` | Schedule Manager | Doctor |
| `/doctor/onboarding` | Profile Setup | Doctor |
| `/admin` | Admin Dashboard | Admin |
| `/admin/users` | User Management | Admin |
| `/admin/analytics` | Analytics | Admin |
| `/admin/appointments` | All Appointments | Admin |
| `/notifications` | Notifications | Authenticated |

### Backend API

```
# Authentication
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PATCH  /api/auth/update-profile

# Doctors
GET    /api/doctors/search?q=&specialty=&maxPrice=&minRating=
GET    /api/doctors/:id
GET    /api/doctors/:id/availability?date=YYYY-MM-DD
POST   /api/doctors/:id/reviews
PATCH  /api/doctors/:id/verify                    — Admin only

# Appointments
POST   /api/appointments
GET    /api/appointments/my                       — Patient
GET    /api/appointments/doctor                   — Doctor
PATCH  /api/appointments/:id/cancel
PATCH  /api/appointments/:id/complete             — Doctor only

# Admin
GET    /api/admin/stats
GET    /api/admin/analytics
GET    /api/admin/users
PATCH  /api/admin/users/:id/toggle-active
PATCH  /api/admin/users/:id/role

# Notifications
GET    /api/notifications
PATCH  /api/notifications/:id/read

# Medical Records
GET    /api/medical-records
POST   /api/medical-records
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- A free [MongoDB Atlas](https://cloud.mongodb.com) account

### 1. Clone the repository

```bash
git clone https://github.com/Tarekattallah/medibook-pro.git
cd medibook-pro
```

### 2. Set up the Backend

```bash
cd medibook-backend
npm install
cp .env.example .env       # Fill in your values (see below)
npm run seed               # Seed demo data (first time only)
npm run dev                # Runs on http://localhost:5000
```

### 3. Set up the Frontend

```bash
cd ../medibook-app
npm install
cp .env.example .env       # Set VITE_API_URL=http://localhost:5000
npm run dev                # Runs on http://localhost:3000
```

### Environment Variables

**`medibook-backend/.env`**
```env
PORT=5000
MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/medibook
JWT_SECRET=your_long_random_secret_minimum_32_characters
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**`medibook-app/.env`**
```env
VITE_API_URL=http://localhost:5000
```

### Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | password |
| Patient | patient@demo.com | password |
| Doctor | doctor@demo.com | password |

---

## ☁️ Deploying to Vercel

### Step 1 — Set up MongoDB Atlas

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Create a free **M0** cluster
3. Under **Security → Database Access**, create a user with Read/Write permissions
4. Under **Security → Network Access**, add `0.0.0.0/0` to allow connections from anywhere
5. Click **Connect → Drivers** and copy your connection string

### Step 2 — Deploy the Backend

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New Project** and import `medibook-pro`
3. Set the **Root Directory** to `medibook-backend`
4. Add the following environment variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | A random string, 32+ characters |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | *(add after deploying the frontend)* |

5. Click **Deploy** and save the backend URL (e.g. `https://medibook-backend.vercel.app`)

### Step 3 — Seed the Database

Open the following URL in your browser after the backend is live:

```
https://your-backend.vercel.app/api/setup-admin
```

### Step 4 — Deploy the Frontend

1. Click **Add New Project** again and import `medibook-pro`
2. Set the **Root Directory** to `medibook-app`
3. Add the environment variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your backend URL from Step 2 |

4. Click **Deploy** and save the frontend URL

### Step 5 — Connect Frontend & Backend

1. Go back to the backend project in Vercel
2. Navigate to **Settings → Environment Variables**
3. Update `FRONTEND_URL` with your frontend URL
4. Click **Redeploy**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Vite 5 |
| Backend | Node.js, Express 4 |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcryptjs |
| Security | Helmet, CORS, express-rate-limit |
| File Uploads | Multer |
| Deployment | Vercel |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free to use, modify, and distribute.
