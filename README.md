# 🏥 MediBook Pro

> منصة حجز مواعيد أطباء — Full-Stack Web Application

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)

---

## 📋 نظرة عامة

MediBook Pro هو تطبيق ويب متكامل لحجز مواعيد الأطباء. يتيح للمرضى البحث عن الأطباء وحجز مواعيد، وللأطباء إدارة جداولهم، وللمدراء الإشراف على المنصة بالكامل.

**Live Demo:** [medibook-app.vercel.app](https://medibook-app.vercel.app) *(بعد الـ deploy)*

---

## ✨ المميزات

### 👤 للمرضى
- البحث عن الأطباء بالتخصص والسعر والتقييم
- عرض ملف الطبيب الكامل مع المراجعات
- حجز مواعيد وإلغاؤها
- عرض السجلات الطبية
- استقبال الإشعارات

### 🩺 للأطباء
- لوحة تحكم بالمواعيد القادمة
- إدارة الجدول الزمني والإتاحة
- استكمال الملف المهني (Onboarding)
- تتبع المواعيد والمرضى

### 🔧 للمدراء
- لوحة إحصائيات شاملة
- إدارة المستخدمين (تفعيل/تعطيل/تغيير الصلاحيات)
- توثيق الأطباء
- تقارير تحليلية شهرية

---

## 🗂️ هيكل المشروع

```
medibook-pro/
├── medibook-app/          # Frontend — React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/    # Landing, Login, Register, Search, BookingPage
│   │   │   ├── patient/   # Dashboard, Appointments, MedicalRecords, Profile
│   │   │   ├── doctor/    # Dashboard, Schedule, Onboarding
│   │   │   └── admin/     # Dashboard, Users, Analytics, Appointments
│   │   ├── components/    # Navbar, Sidebar, DoctorCard, Toast
│   │   └── context/       # AuthContext
│   ├── vercel.json
│   └── .env.example
│
└── medibook-backend/      # Backend — Node.js + Express + MongoDB
    ├── src/
    │   ├── controllers/   # auth, doctor, appointment, admin, notification, medicalRecord
    │   ├── models/        # User, Appointment, MedicalRecord, Notification, Review
    │   ├── routes/        # auth, doctors, appointments, admin, notifications, medicalRecords
    │   ├── middleware/    # auth (JWT)
    │   ├── config/        # db, multer, seed
    │   └── index.js
    ├── vercel.json
    └── .env.example
```

---

## 🛣️ الـ Routes

### Frontend Routes

| Route | الصفحة | الصلاحية |
|-------|---------|----------|
| `/` | Landing Page | الكل |
| `/search` | البحث عن أطباء | الكل |
| `/doctor/:id` | ملف الطبيب | الكل |
| `/book/:id` | حجز موعد | مريض |
| `/login` | تسجيل الدخول | الكل |
| `/register` | إنشاء حساب | الكل |
| `/patient/dashboard` | لوحة المريض | مريض |
| `/patient/appointments` | مواعيدي | مريض |
| `/patient/records` | السجلات الطبية | مريض |
| `/patient/settings` | إعدادات الملف | مريض |
| `/doctor/dashboard` | لوحة الطبيب | طبيب |
| `/doctor/schedule` | إدارة الجدول | طبيب |
| `/admin` | لوحة الأدمن | أدمن |
| `/admin/users` | إدارة المستخدمين | أدمن |
| `/admin/analytics` | التحليلات | أدمن |
| `/admin/appointments` | إدارة المواعيد | أدمن |

### Backend API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PATCH  /api/auth/update-profile

GET    /api/doctors/search?q=&specialty=&maxPrice=&minRating=
GET    /api/doctors/:id
GET    /api/doctors/:id/availability?date=YYYY-MM-DD
POST   /api/doctors/:id/reviews
PATCH  /api/doctors/:id/verify        (Admin)

POST   /api/appointments
GET    /api/appointments/my           (Patient)
GET    /api/appointments/doctor       (Doctor)
PATCH  /api/appointments/:id/cancel
PATCH  /api/appointments/:id/complete (Doctor)

GET    /api/admin/stats
GET    /api/admin/analytics
GET    /api/admin/users
PATCH  /api/admin/users/:id/toggle-active
PATCH  /api/admin/users/:id/role

GET    /api/notifications
PATCH  /api/notifications/:id/read

GET    /api/medical-records
POST   /api/medical-records
```

---

## 🚀 التشغيل المحلي

### المتطلبات
- Node.js 18+
- حساب على [MongoDB Atlas](https://cloud.mongodb.com) (مجاني)

### 1. Backend

```bash
cd medibook-backend
npm install
cp .env.example .env
# عدّل الـ .env بقيم حقيقية
npm run seed    # تعبئة بيانات تجريبية (أول مرة فقط)
npm run dev     # يشتغل على http://localhost:5000
```

### 2. Frontend

```bash
cd medibook-app
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000
npm run dev     # يشتغل على http://localhost:3000
```

### متغيرات البيئة

**medibook-backend/.env**
```env
PORT=5000
MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/medibook
JWT_SECRET=your_long_random_secret_min_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**medibook-app/.env**
```env
VITE_API_URL=http://localhost:5000
```

### حسابات تجريبية (بعد الـ Seed)

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| أدمن | admin@demo.com | password |
| مريض | patient@demo.com | password |
| طبيب | doctor@demo.com | password |

---

## ☁️ الـ Deploy على Vercel

### الخطوة 1: MongoDB Atlas

1. اذهب إلى [cloud.mongodb.com](https://cloud.mongodb.com) وأنشئ حساباً مجانياً
2. أنشئ Cluster مجاني (M0)
3. في **Security** أضف مستخدم بصلاحيات Read/Write
4. في **Network Access** أضف `0.0.0.0/0` (Allow from Anywhere)
5. انسخ الـ Connection String

### الخطوة 2: Deploy Backend

1. ادخل [vercel.com](https://vercel.com) وسجّل بحساب GitHub
2. اضغط **Add New Project** → ارفع مجلد `medibook-backend`
3. أضف متغيرات البيئة التالية:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Connection string من Atlas |
| `JWT_SECRET` | نص عشوائي طويل (32+ حرف) |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | *(هتضيفه بعدين)* |

4. اضغط **Deploy** واحتفظ برابط الـ Backend

### الخطوة 3: Seed الـ Database

افتح في المتصفح بعد الـ Deploy:
```
https://your-backend.vercel.app/api/setup-admin
```

### الخطوة 4: Deploy Frontend

1. اضغط **Add New Project** → ارفع مجلد `medibook-app`
2. أضف متغير البيئة:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | رابط الـ Backend من الخطوة 2 |

3. اضغط **Deploy** واحتفظ برابط الـ Frontend

### الخطوة 5: ربط الـ Frontend بالـ Backend

1. ارجع لمشروع الـ Backend في Vercel
2. **Settings → Environment Variables**
3. عدّل `FRONTEND_URL` وضع رابط الـ Frontend
4. اضغط **Redeploy**

---

## 🛠️ التقنيات المستخدمة

### Frontend
- **React 18** — UI Library
- **React Router v6** — Client-side routing
- **Vite** — Build tool
- **CSS** — Custom styling

### Backend
- **Node.js + Express** — API server
- **MongoDB + Mongoose** — Database
- **JWT** — Authentication
- **bcryptjs** — Password hashing
- **Helmet + CORS** — Security
- **express-rate-limit** — Rate limiting
- **Multer** — File uploads

---

## 📄 الرخصة

MIT License — يمكن استخدامه وتعديله بحرية.
