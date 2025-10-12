# 🚀 Supabase Quick Start - Hospital Management

**Perfect! Supabase is actually easier than Docker!**

---

## ⚡ 5-Minute Setup

### Step 1: Create Supabase Account (2 minutes)

1. Go to **[supabase.com](https://supabase.com)**
2. Click "Start your project" 
3. Sign up (use GitHub for fastest signup)
4. Create new project:
   - Name: `hospital-management`
   - Password: (choose & save it!)
   - Region: **Singapore** (closest to Malaysia)
   - Plan: **Free** ✅

⏳ Wait ~2 minutes while Supabase creates your database...

### Step 2: Get Your Credentials (1 minute)

In your Supabase dashboard:

**A. API Credentials**
- Go to: **Settings** → **API**
- Copy:
  - ✅ **Project URL** (looks like: `https://xxx.supabase.co`)
  - ✅ **anon/public key** (long string starting with `eyJ...`)

**B. Database URL**
- Go to: **Settings** → **Database**
- Scroll to **Connection string**
- Select: **Connection pooling** → **Transaction mode**
- Copy the URL
- Replace `[YOUR-PASSWORD]` with your actual password

### Step 3: Configure Your Project (2 minutes)

**A. Install Supabase**
```bash
npm install @supabase/supabase-js
```

**B. Create `.env` file** in your project root:
```env
# Supabase API (for auth & real-time)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...

# Database (for Prisma)
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Feature flag (keep false for now)
USE_REAL_DATABASE=false
```

Replace:
- `xxxxx` with your project ID
- `[PASSWORD]` with your database password
- `eyJxxxxx...` with your actual anon key

**C. Setup Database Tables**
```bash
# Generate Prisma client
npx prisma generate

# Create tables in Supabase
npx prisma db push

# Add sample data
npm run db:seed
```

---

## ✅ You're Done!

### View Your Database

**Option 1: Supabase Dashboard** (Built-in!)
- Go to your project → **Table Editor**
- See all your data visually

**Option 2: Prisma Studio**
```bash
npm run db:studio
```
Opens at http://localhost:5555

---

## 🔄 Switch to Real Database

When you're ready to test with real data:

**1. Update `.env`:**
```env
USE_REAL_DATABASE=true  👈 Change this
```

**2. Restart dev server:**
```bash
# Press Ctrl+C to stop
npm run dev
```

**That's it!** Your app now uses Supabase! 🎉

---

## 🔐 Bonus: Setup Authentication (Optional)

Supabase has built-in authentication! No extra packages needed.

### Step 1: Create Auth Helper

Create `src/lib/supabase-client.ts`:

```typescript
'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Step 2: Add Login Function

Create `src/lib/auth.ts`:

```typescript
import { supabase } from './supabase-client';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

### Step 3: Update Login Page

```typescript
'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await signIn(email, password);
    
    if (error) {
      alert(error.message);
      return;
    }
    
    router.push('/dispensing');
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 border rounded"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full p-2 border rounded"
      />
      <button 
        type="submit"
        className="w-full bg-blue-500 text-white p-2 rounded"
      >
        Login
      </button>
    </form>
  );
}
```

### Step 4: Create First User

In **Supabase Dashboard**:
1. Go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter email & password
4. Click **Create user**

Now you can login! 🎉

---

## 🎯 What You Get with Supabase

✅ **PostgreSQL Database** (same as Docker setup)  
✅ **Visual Dashboard** (see your data)  
✅ **Built-in Auth** (no NextAuth needed)  
✅ **Real-time Updates** (live data)  
✅ **File Storage** (upload documents)  
✅ **Auto Backups** (free tier: point-in-time recovery)  
✅ **No Server Management** (Supabase handles everything)  
✅ **Free Forever** (up to 500MB database)  

---

## 📊 Your Setup

```
Your Frontend (Next.js)
         ↓
    API Routes (Prisma)
         ↓
    Supabase PostgreSQL ☁️
         ↓
    [All managed in the cloud!]
```

**No Docker needed!** ✨

---

## 🛠️ Useful Commands

```bash
# View database in browser
npm run db:studio

# Add sample data
npm run db:seed

# Update database schema
npx prisma db push

# Generate Prisma types
npx prisma generate
```

---

## 🆘 Common Issues

### "Can't connect to database"
**Check:**
- Is your DATABASE_URL correct?
- Did you replace `[YOUR-PASSWORD]`?
- Is your Supabase project active?

### "Prisma Client not found"
**Fix:**
```bash
npx prisma generate
```

### "Tables don't exist"
**Fix:**
```bash
npx prisma db push
```

---

## 📱 View Your Database

**Supabase Dashboard:**
https://supabase.com/dashboard/project/[your-project-id]/editor

**Prisma Studio:**
```bash
npm run db:studio
```
http://localhost:5555

---

## 🎓 Next Steps

1. **Today**: 
   - ✅ Setup Supabase
   - ✅ Create tables
   - ✅ View data in dashboard

2. **This Week**:
   - Test with `USE_REAL_DATABASE=true`
   - Setup authentication
   - Add real-time updates (optional)

3. **Next Week**:
   - Update all API routes
   - Test all features
   - Deploy to production!

---

## 💡 Pro Tips

1. **Supabase Dashboard is your friend**
   - Use Table Editor to view/edit data
   - Check logs in the Logs section
   - Monitor usage in Settings

2. **Keep mock data for now**
   - Set `USE_REAL_DATABASE=false`
   - Test Supabase separately
   - Switch when confident

3. **Use both Prisma & Supabase**
   - Prisma for API routes (what you have)
   - Supabase client for real-time features
   - Best of both worlds!

---

## 🚀 Deploy to Production

When ready:

1. **Update Environment Variables** (Vercel/Netlify):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   DATABASE_URL=your-database-url
   USE_REAL_DATABASE=true
   ```

2. **Deploy**:
   ```bash
   npm run build
   ```

3. **Done!** Supabase handles the database automatically.

---

## 🆚 Supabase vs Docker

| Feature | Supabase | Docker PostgreSQL |
|---------|----------|------------------|
| **Setup Time** | ⚡ 5 minutes | ⏰ 15 minutes |
| **Cost** | 💰 Free tier | 🆓 Free (but need server) |
| **Maintenance** | ✅ Zero | ⚠️ You manage |
| **Backups** | ✅ Automatic | ⚠️ Manual |
| **Authentication** | ✅ Built-in | ❌ Need to add |
| **Real-time** | ✅ Built-in | ❌ Need to add |
| **Dashboard** | ✅ Beautiful | ⚠️ Basic (pgAdmin) |
| **Production** | ✅ Ready | ⚠️ Need setup |

**Winner: Supabase!** 🏆

---

## 📚 Learn More

- [Supabase Docs](https://supabase.com/docs)
- [Supabase + Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- Full guide: `SUPABASE_SETUP_GUIDE.md`

---

## ✅ Checklist

- [ ] Created Supabase account
- [ ] Created project
- [ ] Copied credentials to `.env`
- [ ] Ran `npm install @supabase/supabase-js`
- [ ] Ran `npx prisma db push`
- [ ] Ran `npm run db:seed`
- [ ] Viewed data in Supabase dashboard
- [ ] Tested with `USE_REAL_DATABASE=true`

**All done?** You're ready to build! 🎉

---

**Questions?** Check `SUPABASE_SETUP_GUIDE.md` for detailed documentation!

