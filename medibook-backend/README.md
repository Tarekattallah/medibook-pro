# MediBook Pro — Backend

## Setup

```bash
# 1. Install
npm install

# 2. Create .env
cp .env.example .env
# عدّل MONGODB_URI

# 3. Seed database (أول مرة فقط)
npm run seed

# 4. Run
npm run dev
# http://localhost:5000/api/health
```

## API Endpoints

### Auth
- `POST /api/auth/register` — إنشاء حساب
- `POST /api/auth/login` — تسجيل دخول
- `GET  /api/auth/me` — بيانات المستخدم
- `PATCH /api/auth/update-profile` — تحديث الملف

### Doctors
- `GET /api/doctors/search` — بحث (query: q, specialty, maxPrice, minRating)
- `GET /api/doctors/:id` — ملف طبيب + reviews
- `GET /api/doctors/:id/availability?date=YYYY-MM-DD`
- `POST /api/doctors/:id/reviews` — إضافة تقييم
- `PATCH /api/doctors/:id/verify` — (Admin) توثيق طبيب

### Appointments
- `POST /api/appointments` — حجز موعد
- `GET  /api/appointments/my` — مواعيد المريض
- `GET  /api/appointments/doctor` — جدول الطبيب
- `PATCH /api/appointments/:id/cancel` — إلغاء
- `PATCH /api/appointments/:id/complete` — إنهاء (Doctor)

### Admin
- `GET /api/admin/stats` — إحصائيات
- `GET /api/admin/analytics` — تحليلات شهرية
- `GET /api/admin/users` — كل المستخدمين
- `PATCH /api/admin/users/:id/toggle-active`
- `PATCH /api/admin/users/:id/role`
