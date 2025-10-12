# 🚀 Supabase Backend Setup Guide

## Why Supabase is Perfect For Your Project

✅ **No Docker needed** - Fully managed cloud database  
✅ **Free tier** - Perfect for development  
✅ **Built-in authentication** - No need for NextAuth  
✅ **Auto-generated APIs** - REST API automatically created  
✅ **Real-time subscriptions** - Live data updates  
✅ **PostgreSQL** - Same powerful database  
✅ **Dashboard** - Visual database management  
✅ **Storage** - File uploads built-in  

---

## 🎯 Quick Start (15 Minutes)

### Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. It's free!

### Step 2: Create a New Project

1. Click "New Project"
2. Fill in:
   - **Name**: Hospital Management
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Singapore (closest to Malaysia)
   - **Pricing Plan**: Free (perfect for development)
3. Click "Create new project"
4. Wait ~2 minutes for setup

### Step 3: Get Your Connection Details

1. In your Supabase dashboard, go to **Settings** → **Database**
2. You'll see:
   - **Host**: `db.xxx.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: [the one you set]

3. Scroll down to **Connection string** and copy the **Connection pooling** string

---

## 📦 Setup Your Project

### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js @prisma/client prisma tsx
```

### Step 2: Create .env File

Create `.env` in your project root:

```env
# ===========================================
# SUPABASE CONFIGURATION
# ===========================================

# Get these from: Supabase Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Get this from: Supabase Dashboard → Settings → Database → Connection pooling
DATABASE_URL="postgresql://postgres.xxxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Direct connection (for migrations)
DIRECT_DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"

# Feature flag
USE_REAL_DATABASE=false

# ===========================================
# OPTIONAL: Service Role Key (for admin operations)
# ===========================================
# Get from: Supabase Dashboard → Settings → API
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**How to get these values:**

1. **NEXT_PUBLIC_SUPABASE_URL**: 
   - Dashboard → Settings → API → Project URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**:
   - Dashboard → Settings → API → Project API keys → anon/public

3. **DATABASE_URL**:
   - Dashboard → Settings → Database → Connection string → Connection pooling
   - Mode: Transaction (recommended)
   - Replace `[YOUR-PASSWORD]` with your actual password

4. **DIRECT_DATABASE_URL**:
   - Dashboard → Settings → Database → Connection string → URI
   - Replace `[YOUR-PASSWORD]` with your actual password

### Step 3: Setup Prisma

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}

// Copy all the models from the existing schema.prisma
// (I already created this in the prisma folder)
```

### Step 4: Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to Supabase (creates tables)
npx prisma db push

# Seed with sample data
npm run db:seed
```

### Step 5: View Your Database

**Option A: Supabase Dashboard**
- Go to your project → Table Editor
- Visual interface, built-in!

**Option B: Prisma Studio**
```bash
npm run db:studio
```

---

## 🎨 Two Ways to Use Supabase

### Option 1: Prisma (Recommended - Keep Your Current API Routes)

**Pros:**
- ✅ Keep your existing API route structure
- ✅ Type-safe with TypeScript
- ✅ Works exactly like the PostgreSQL setup
- ✅ Easy migration from mock data

**Use this if:** You want to keep control of your API logic

### Option 2: Supabase Client (Direct Access)

**Pros:**
- ✅ Auto-generated REST API
- ✅ Real-time subscriptions
- ✅ Row Level Security (RLS)
- ✅ Less code to write

**Use this if:** You want Supabase to handle more

**You can use BOTH!** Use Prisma for complex operations, Supabase client for real-time features.

---

## 🔧 Setup Option 1: Using Prisma (Recommended)

This is what I already set up for you. Just change the DATABASE_URL to point to Supabase!

Your API routes will work exactly as designed:

```typescript
// src/app/api/pharmacy/patients/route.ts
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const patients = await prisma.patient.findMany();
  return NextResponse.json(patients);
}
```

**Setup:**
1. ✅ Already done! Just update `.env` with Supabase URLs
2. ✅ Run `npx prisma db push`
3. ✅ Run `npm run db:seed`
4. ✅ Done!

---

## 🔧 Setup Option 2: Using Supabase Client

### Create Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Create Client-Side Hook

Create `src/lib/supabase-client.ts`:

```typescript
'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Example: Fetch Data Directly from Frontend

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    async function loadPatients() {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('name');
      
      if (data) setPatients(data);
    }
    
    loadPatients();
  }, []);

  return (
    <div>
      {patients.map(patient => (
        <div key={patient.id}>{patient.name}</div>
      ))}
    </div>
  );
}
```

---

## 🔐 Authentication with Supabase

One of the best features! Built-in authentication with no extra setup needed.

### Step 1: Enable Authentication

In Supabase Dashboard:
1. Go to **Authentication** → **Providers**
2. Enable **Email** (already enabled by default)
3. Optional: Enable **Google**, **GitHub**, etc.

### Step 2: Create Auth Helper

Create `src/lib/auth.ts`:

```typescript
import { supabase } from './supabase-client';

export async function signUp(email: string, password: string, metadata: any) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata, // Store user info like name, department
    },
  });
  
  return { data, error };
}

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

export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
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
    
    // Redirect based on user role
    router.push('/dispensing');
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Step 4: Create Protected Route Middleware

Update `src/middleware.ts`:

```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Allow access to login page
  if (request.nextUrl.pathname.startsWith('/login')) {
    return res;
  }

  // Redirect to login if not authenticated
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 📊 Setting Up Your Database Schema

### Step 1: Push Schema to Supabase

```bash
npx prisma db push
```

This creates all your tables in Supabase!

### Step 2: Enable Row Level Security (Optional but Recommended)

In Supabase Dashboard:
1. Go to **Table Editor**
2. Select a table (e.g., `patients`)
3. Click **Settings** → **Enable RLS**

**Example RLS Policy** (Allow users to read only their department's data):

```sql
-- In Supabase SQL Editor
CREATE POLICY "Users can read their department data"
ON patients
FOR SELECT
USING (
  auth.jwt() ->> 'department' = department
);
```

### Step 3: Seed Data

Run the seed script:

```bash
npm run db:seed
```

Or manually add data in Supabase Dashboard → Table Editor

---

## 🔄 Migration from Mock Data

### Phase 1: Keep Both Systems

Update your API routes to support both:

```typescript
// src/app/api/pharmacy/patients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getDataStore } from '@/features/pharmacy-counter/lib/seed-loader';

const USE_REAL_DATABASE = process.env.USE_REAL_DATABASE === 'true';

export async function GET(request: NextRequest) {
  // Mock data path
  if (!USE_REAL_DATABASE) {
    const store = getDataStore();
    return NextResponse.json(store.getPatients());
  }

  // Supabase path
  const patients = await prisma.patient.findMany();
  return NextResponse.json(patients);
}
```

### Phase 2: Test with Supabase

1. Set `USE_REAL_DATABASE=true` in `.env`
2. Restart dev server
3. Test all features
4. If issues, set back to `false`

### Phase 3: Go Full Supabase

1. Remove mock data code
2. Enable RLS policies
3. Setup authentication
4. Deploy to production

---

## 🎯 Supabase-Specific Features

### Real-Time Subscriptions

Listen for changes to your data:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function PrescriptionsQueue() {
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    // Load initial data
    loadPrescriptions();

    // Subscribe to changes
    const channel = supabase
      .channel('prescriptions')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'prescriptions',
          filter: 'status=eq.new', // Only new prescriptions
        },
        (payload) => {
          console.log('Change received!', payload);
          loadPrescriptions(); // Reload data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadPrescriptions() {
    const { data } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('status', 'new')
      .order('prescribedAt', { ascending: false });
    
    if (data) setPrescriptions(data);
  }

  return (
    <div>
      {prescriptions.map(rx => (
        <div key={rx.id}>{rx.id}</div>
      ))}
    </div>
  );
}
```

### File Storage

Store files (e.g., patient documents, prescription images):

```typescript
import { supabase } from '@/lib/supabase';

// Upload file
async function uploadPrescriptionImage(file: File, prescriptionId: string) {
  const { data, error } = await supabase.storage
    .from('prescriptions')
    .upload(`${prescriptionId}/${file.name}`, file);

  return { data, error };
}

// Get file URL
async function getPrescriptionImageUrl(path: string) {
  const { data } = supabase.storage
    .from('prescriptions')
    .getPublicUrl(path);

  return data.publicUrl;
}
```

---

## 🛠️ Useful Supabase Commands

### Database Operations
```bash
# Push schema to Supabase
npx prisma db push

# Generate Prisma Client
npx prisma generate

# View database
npm run db:studio

# Seed data
npm run db:seed

# Reset database
npx prisma migrate reset
```

### Supabase CLI (Optional)
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local
```

---

## 📋 Comparison: Prisma vs Supabase Client

| Feature | Prisma | Supabase Client |
|---------|--------|-----------------|
| **Type Safety** | ✅ Excellent | ⚠️ Manual types |
| **Complex Queries** | ✅ Easy | ⚠️ More verbose |
| **Real-time** | ❌ No | ✅ Yes |
| **File Storage** | ❌ No | ✅ Yes |
| **Auth Integration** | ⚠️ Manual | ✅ Built-in |
| **Learning Curve** | ⚠️ Moderate | ✅ Easy |
| **API Routes** | ✅ Full control | ⚠️ Limited |

**My Recommendation:** Use Prisma for your API routes (you already have them set up!), and use Supabase Client for real-time features when needed.

---

## 🎓 Example: Full Implementation

### API Route (with Prisma)

```typescript
// src/app/api/pharmacy/patients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (id) {
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          prescriptions: {
            include: { items: { include: { medication: true } } },
            orderBy: { prescribedAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!patient) {
        return errorResponse('Patient not found', 404);
      }

      return successResponse(patient);
    }

    const patients = await prisma.patient.findMany({
      take: 50,
      orderBy: { name: 'asc' },
    });

    return successResponse(patients);
  } catch (error) {
    console.error('Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
```

### Frontend Component (with Real-time)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function PrescriptionQueue() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    loadQueue();

    // Real-time updates
    const subscription = supabase
      .channel('prescription_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prescriptions' },
        () => loadQueue()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadQueue() {
    // Use your existing API route
    const response = await fetch('/api/pharmacy/prescriptions?status=new');
    const data = await response.json();
    setQueue(data.data || data);
  }

  return (
    <div>
      <h1>Prescription Queue ({queue.length})</h1>
      {queue.map(rx => (
        <div key={rx.id}>{rx.id}</div>
      ))}
    </div>
  );
}
```

---

## 🚀 Deployment

### Step 1: Environment Variables

In your production environment (Vercel, Netlify, etc.), add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=your-connection-pooling-url
DIRECT_DATABASE_URL=your-direct-connection-url
USE_REAL_DATABASE=true
```

### Step 2: Build & Deploy

```bash
npm run build
```

Deploy to your hosting platform. Supabase handles the database automatically!

---

## 💰 Pricing

### Free Tier (Perfect for Development & Small Projects)
- ✅ 500MB Database space
- ✅ 1GB File storage
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests
- ✅ Social OAuth providers
- ✅ 7-day log retention

### Pro Tier ($25/month - When You Need More)
- ✅ 8GB Database space
- ✅ 100GB File storage
- ✅ 100,000 monthly active users
- ✅ Daily backups
- ✅ 90-day log retention

---

## 🎯 Quick Start Checklist

- [ ] Create Supabase account
- [ ] Create new project
- [ ] Copy connection strings to `.env`
- [ ] Install `@supabase/supabase-js`
- [ ] Run `npx prisma db push`
- [ ] Run `npm run db:seed`
- [ ] Test with `USE_REAL_DATABASE=true`
- [ ] Setup authentication (optional)
- [ ] Enable RLS (optional)
- [ ] Deploy!

---

## 🆘 Troubleshooting

### "Error connecting to database"
- Check your DATABASE_URL is correct
- Verify password is correct
- Make sure Supabase project is active

### "Prisma Client not found"
- Run `npx prisma generate`

### "Authentication not working"
- Check NEXT_PUBLIC_SUPABASE_URL and ANON_KEY
- Verify they're prefixed with NEXT_PUBLIC_

### "Real-time not working"
- Make sure you're using the client-side Supabase client
- Check subscription is properly set up
- Verify table name is correct

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase + Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

---

## 🎉 Why This Setup is Perfect

✅ **No Infrastructure Management** - Supabase handles everything  
✅ **Free to Start** - No credit card required  
✅ **Scales Automatically** - From development to production  
✅ **Built-in Features** - Auth, storage, real-time included  
✅ **Keep Your Code** - Use your existing API routes  
✅ **Easy Migration** - Just change environment variables  
✅ **Great Dashboard** - Visual database management  

You get the best of both worlds: your custom API logic + Supabase's powerful features!

---

**Ready to start?** Create your Supabase account and let's go! 🚀

