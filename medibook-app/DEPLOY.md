# 🚀 Deploy Guide — MediBook Pro

## الخطوة 1: MongoDB Atlas (Database)

1. روح على https://cloud.mongodb.com
2. سجّل حساب مجاني
3. اضغط **"Build a Database"** → اختار **Free (M0)**
4. اختار أي region → اضغط **Create**
5. في **Security**:
   - Username: `medibook`
   - Password: اختار password واحتفظ بيه
6. في **Network Access** → اضغط **Add IP Address** → اختار **Allow Access from Anywhere** (0.0.0.0/0)
7. في **Database** → اضغط **Connect** → **Drivers** → انسخ الـ connection string:
   ```
   mongodb+srv://medibook:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/medibook?retryWrites=true&w=majority
   ```

---

## الخطوة 2: Deploy Backend على Vercel

1. روح على https://vercel.com وسجّل بـ GitHub
2. اضغط **"Add New Project"**
3. اضغط **"Upload"** أو ارفع مجلد `medibook-backend`
4. في **Environment Variables** أضف:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | connection string من Atlas |
| `JWT_SECRET` | أي نص طويل عشوائي مثلاً: `medibook_jwt_secret_2024_xK9mP2qR` |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | هتحطه بعدين لما تعرف رابط الـ frontend |

5. اضغط **Deploy**
6. **احتفظ بالرابط** اللي هيطلع مثلاً: `https://medibook-backend.vercel.app`

---

## الخطوة 3: Seed الـ Database

بعد الـ deploy، افتح في المتصفح:
```
https://medibook-backend.vercel.app/api/setup-admin
```

ولو عندك Postman ابعت POST request على:
```
https://medibook-backend.vercel.app/api/setup-admin
```

---

## الخطوة 4: Deploy Frontend على Vercel

1. اضغط **"Add New Project"** تاني
2. ارفع مجلد `medibook-app`
3. في **Environment Variables** أضف:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | رابط الـ backend مثلاً: `https://medibook-backend.vercel.app` |

4. اضغط **Deploy**
5. **احتفظ بالرابط** مثلاً: `https://medibook-app.vercel.app`

---

## الخطوة 5: ربط الـ Frontend بالـ Backend

1. ارجع لـ backend project في Vercel
2. **Settings** → **Environment Variables**
3. عدّل `FRONTEND_URL` وحط رابط الـ frontend
4. اضغط **Redeploy**

---

## ✅ تجربة الـ Deploy

افتح رابط الـ frontend وادخل بـ:
- **Admin:** admin@demo.com / password
- **Patient:** patient@demo.com / password  
- **Doctor:** doctor@demo.com / password

---

## لو محتاج تعمل Seed كامل (أطباء + مواعيد)

اعمل ملف `.env` في مجلد `medibook-backend`:
```
MONGODB_URI=your_atlas_connection_string
```

ثم شغّل:
```bash
npm run seed
```
