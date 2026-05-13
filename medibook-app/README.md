# MediBook Pro — Frontend

## تشغيل

```bash
npm install
npm run dev
# http://localhost:3000
```

> الـ Backend لازم يشتغل على port 5000
> (راجع مجلد medibook-backend)

## الصفحات والـ Routes

| Route | الصفحة |
|-------|--------|
| `/` | Landing Page |
| `/search` | البحث عن أطباء |
| `/doctor/:id` | ملف الطبيب |
| `/book/:id` | تأكيد الحجز |
| `/booking-success` | تم الحجز |
| `/login` | تسجيل الدخول |
| `/register` | إنشاء حساب |
| `/patient/dashboard` | لوحة المريض |
| `/patient/appointments` | مواعيدي |
| `/patient/records` | السجلات الطبية |
| `/doctor/dashboard` | لوحة الطبيب |
| `/doctor/onboarding` | إكمال ملف الطبيب |
| `/admin` | لوحة الأدمن |
| `/admin/users` | إدارة المستخدمين |
| `/admin/analytics` | التحليلات |

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@demo.com | password |
| Doctor | doctor@demo.com | password |
| Admin | admin@demo.com | password |
