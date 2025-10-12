# Quick Start: Backend Setup

This guide will get your backend up and running in ~15 minutes.

## Prerequisites

- Node.js 20+ installed
- Docker Desktop installed and running
- Basic knowledge of terminal/command line

---

## 🚀 Quick Setup (Copy & Paste)

### Step 1: Install Dependencies

```bash
npm install @prisma/client prisma tsx
```

### Step 2: Create Environment File

Copy `.env.example` to `.env`:

```bash
# On Windows
copy .env.example .env

# On Mac/Linux
cp .env.example .env
```

Then edit `.env` and set:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hospital_management?schema=public"
USE_REAL_DATABASE=false
```

### Step 3: Start Database with Docker

```bash
docker-compose up -d
```

Wait 10 seconds for the database to initialize, then verify it's running:

```bash
docker ps
```

You should see `hospital_db` in the list.

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

### Step 5: Create Database Tables

```bash
npx prisma migrate dev --name init
```

When prompted, press `y` to create the database.

### Step 6: View Your Database (Optional)

Open Prisma Studio to see your database:

```bash
npm run db:studio
```

This opens at `http://localhost:5555`

Also, you can access PgAdmin at `http://localhost:5050`:
- Email: `admin@hospital.local`
- Password: `admin`

---

## 🎯 Testing the Backend

### Option A: Use the Frontend (Recommended)

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   - Go to `http://localhost:3000`
   - Navigate to a pharmacy counter page
   - The API routes will automatically use the database

### Option B: Test API Directly with curl

**Get all patients:**
```bash
curl http://localhost:3000/api/pharmacy/patients
```

**Search for a patient:**
```bash
curl "http://localhost:3000/api/pharmacy/patients?q=John"
```

**Get a specific patient:**
```bash
curl "http://localhost:3000/api/pharmacy/patients?id=abc123"
```

**Create a patient:**
```bash
curl -X POST http://localhost:3000/api/pharmacy/patients \
  -H "Content-Type: application/json" \
  -d '{
    "mrn": "MRN001234",
    "nric": "900101-01-1234",
    "name": "Ahmad bin Abdullah",
    "dob": "1990-01-01",
    "gender": "Male",
    "phone": "0123456789",
    "allergies": ["Penicillin"]
  }'
```

---

## 🔄 Switching Between Mock and Real Data

### Use Mock Data (Current)
```env
USE_REAL_DATABASE=false
```

### Use Real Database
```env
USE_REAL_DATABASE=true
```

**No code changes needed!** Just change the environment variable and restart your dev server.

---

## 📊 Adding Seed Data

### Step 1: Create Seed Script

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample patients
  await prisma.patient.createMany({
    data: [
      {
        mrn: 'MRN001',
        nric: '900101-01-1234',
        name: 'Ahmad bin Abdullah',
        dob: new Date('1990-01-01'),
        gender: 'Male',
        allergies: ['Penicillin'],
      },
      {
        mrn: 'MRN002',
        nric: '850505-02-5678',
        name: 'Siti binti Hassan',
        dob: new Date('1985-05-05'),
        gender: 'Female',
        allergies: [],
      },
    ],
    skipDuplicates: true,
  });

  // Create sample medications
  await prisma.medication.createMany({
    data: [
      {
        code: 'PARA500',
        nameFull: 'Paracetamol 500mg Tablet',
        genericName: 'Paracetamol',
        strength: '500mg',
        form: 'Tablet',
        unitPrice: 0.50,
        stockLevel: 1000,
        reorderLevel: 200,
      },
      {
        code: 'AMOX250',
        nameFull: 'Amoxicillin 250mg Capsule',
        genericName: 'Amoxicillin',
        strength: '250mg',
        form: 'Capsule',
        unitPrice: 1.20,
        stockLevel: 500,
        reorderLevel: 100,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Step 2: Update package.json

Add to your `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "scripts": {
    "db:seed": "npx prisma db seed",
    "db:reset": "npx prisma migrate reset",
    "db:studio": "npx prisma studio"
  }
}
```

### Step 3: Run Seed

```bash
npm run db:seed
```

---

## 🐛 Troubleshooting

### "Can't reach database server"

**Problem:** Docker is not running or database failed to start.

**Solution:**
```bash
# Check Docker is running
docker ps

# Restart database
docker-compose down
docker-compose up -d

# Check logs
docker logs hospital_db
```

### "Migration failed"

**Problem:** Database is in a bad state.

**Solution:** Reset and recreate:
```bash
npx prisma migrate reset
npx prisma migrate dev --name init
```

### "Client not generated"

**Problem:** Prisma Client needs to be regenerated.

**Solution:**
```bash
npx prisma generate
```

### Port 5432 already in use

**Problem:** Another PostgreSQL instance is running.

**Solution:**
```bash
# Option 1: Stop other PostgreSQL
# On Windows, use Services app

# Option 2: Change port in docker-compose.yml
# Change '5432:5432' to '5433:5432'
# Then update DATABASE_URL to use port 5433
```

### TypeScript errors in API routes

**Problem:** Prisma types not found.

**Solution:**
```bash
# Regenerate Prisma Client
npx prisma generate

# Restart your editor/TypeScript server
# In VS Code: Ctrl+Shift+P > "TypeScript: Restart TS Server"
```

---

## 📝 Next Steps

### 1. **Test with Mock Data First**
   - Keep `USE_REAL_DATABASE=false`
   - Verify everything works

### 2. **Seed Your Database**
   - Create seed script with your existing JSON data
   - Run `npm run db:seed`

### 3. **Switch to Real Database**
   - Set `USE_REAL_DATABASE=true`
   - Restart dev server
   - Test all features

### 4. **Update Other API Routes**
   - Use `route-new.ts` as a template
   - Update medications, prescriptions, etc.

### 5. **Remove Mock Code**
   - Once everything works with real database
   - Clean up old mock implementation

---

## 🎓 Useful Commands

```bash
# View database in browser
npm run db:studio

# Reset database (WARNING: Deletes all data)
npm run db:reset

# Create new migration after schema changes
npx prisma migrate dev --name your_migration_name

# Check database status
docker logs hospital_db

# Stop database
docker-compose down

# Start database
docker-compose up -d

# View all running containers
docker ps

# Access database shell
docker exec -it hospital_db psql -U postgres -d hospital_management
```

---

## 💡 Tips

1. **Always test with mock data first** before switching to real database
2. **Use Prisma Studio** to view and edit data visually
3. **Check logs** if something doesn't work: `docker logs hospital_db`
4. **Backup your data** before making big changes
5. **Use migrations** for all schema changes (don't edit the database directly)

---

## 🎉 You're Ready!

Once you complete these steps, you'll have:
- ✅ PostgreSQL database running in Docker
- ✅ Prisma ORM connected to your database
- ✅ API routes that can switch between mock and real data
- ✅ Seed data for testing
- ✅ Database management tools (Prisma Studio, PgAdmin)

**Questions?** Check `BACKEND_SETUP_GUIDE.md` for detailed information.

