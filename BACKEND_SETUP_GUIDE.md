# Backend Setup Guide for Hospital Management System

## 📋 Current State Analysis

Your application is currently using:
- **Next.js 15** with App Router
- **In-memory mock data** via DataStore class
- **API routes** in `/src/app/api/pharmacy/` (already partially implemented)
- **JSON seed files** for pharmacy counter module

### What You Have:
✅ API structure already in place (`/api/pharmacy/*`)
✅ TypeScript types defined
✅ DataStore pattern for data management
✅ Frontend already fetching from API routes

---

## 🎯 Step-by-Step Backend Implementation Plan

### Phase 1: Database Setup (Choose Your Path)

#### Option A: PostgreSQL (Recommended for Production)
#### Option B: MongoDB (Flexible Schema)
#### Option C: SQLite (Simple, File-based)

---

## 🚀 IMPLEMENTATION: PostgreSQL Setup

### Step 1: Install Dependencies

```bash
npm install @prisma/client prisma
npm install --save-dev @types/pg
```

### Step 2: Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Database schema
- `.env` - Environment variables

### Step 3: Configure Database Connection

Update `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/hospital_management?schema=public"
```

For local development with Docker:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hospital_management?schema=public"
```

### Step 4: Define Your Schema

Create/update `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Patient Model
model Patient {
  id            String         @id @default(cuid())
  mrn           String         @unique
  nric          String         @unique
  name          String
  dob           DateTime
  gender        String
  phone         String?
  email         String?
  address       String?
  allergies     String[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  prescriptions Prescription[]
  appointments  Appointment[]
  
  @@index([mrn])
  @@index([nric])
}

// Medication Model
model Medication {
  code            String   @id
  nameFull        String
  genericName     String
  strength        String?
  form            String
  route           String?
  isControlled    Boolean  @default(false)
  requiresColdChain Boolean @default(false)
  stockLevel      Int      @default(0)
  reorderLevel    Int      @default(0)
  unitPrice       Decimal  @db.Decimal(10, 2)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  prescriptionItems PrescriptionItem[]
  
  @@index([genericName])
  @@index([isControlled])
}

// Prescription Model
model Prescription {
  id                String             @id @default(cuid())
  patientId         String
  source            String             // 'Outpatient', 'Ward', 'Emergency'
  status            String             // 'new', 'screening', 'verified', 'dispensing', 'ready', 'collected', 'cancelled'
  prescribedBy      String
  prescribedAt      DateTime
  verifiedBy        String?
  verifiedAt        DateTime?
  dispensedBy       String?
  dispensedAt       DateTime?
  collectedBy       String?
  collectedAt       DateTime?
  notes             String?
  priority          String?            // 'normal', 'urgent', 'stat'
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  
  patient           Patient            @relation(fields: [patientId], references: [id])
  items             PrescriptionItem[]
  
  @@index([patientId])
  @@index([status])
  @@index([prescribedAt])
}

// Prescription Items (many-to-many with additional data)
model PrescriptionItem {
  id              String        @id @default(cuid())
  prescriptionId  String
  drugCode        String
  quantity        Int
  dosage          String
  frequency       String
  duration        String?
  instructions    String?
  
  prescription    Prescription  @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  medication      Medication    @relation(fields: [drugCode], references: [code])
  
  @@index([prescriptionId])
  @@index([drugCode])
}

// Appointment Model
model Appointment {
  id          String   @id @default(cuid())
  patientId   String
  dateTime    DateTime
  type        String   // 'Counseling', 'MTAC', 'Follow-up'
  status      String   // 'scheduled', 'completed', 'cancelled', 'no-show'
  pharmacist  String?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  patient     Patient  @relation(fields: [patientId], references: [id])
  
  @@index([patientId])
  @@index([dateTime])
  @@index([status])
}

// Facility Model (for inter-facility transfer)
model Facility {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  type        String   // 'Hospital', 'Clinic', 'Health Centre'
  state       String
  district    String?
  address     String?
  phone       String?
  email       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([state])
  @@index([type])
}

// Drug Interaction Model
model DrugInteraction {
  id          String   @id @default(cuid())
  drug1Code   String
  drug2Code   String
  severity    String   // 'minor', 'moderate', 'major'
  description String
  management  String?
  createdAt   DateTime @default(now())
  
  @@unique([drug1Code, drug2Code])
  @@index([drug1Code])
  @@index([drug2Code])
}

// ADR Incident Model
model AdrIncident {
  id              String   @id @default(cuid())
  patientId       String
  medicationCode  String
  reaction        String
  severity        String   // 'mild', 'moderate', 'severe'
  onset           DateTime
  reportedBy      String
  reportedAt      DateTime @default(now())
  status          String   // 'reported', 'investigating', 'resolved'
  notes           String?
  
  @@index([patientId])
  @@index([medicationCode])
  @@index([severity])
}

// Dangerous Drug Register
model DdRegister {
  id              String   @id @default(cuid())
  medicationCode  String
  batchNumber     String
  transactionType String   // 'received', 'dispensed', 'destroyed', 'adjustment'
  quantity        Int
  balance         Int
  prescriptionId  String?
  performedBy     String
  witnessedBy     String?
  timestamp       DateTime @default(now())
  notes           String?
  
  @@index([medicationCode])
  @@index([timestamp])
}

// User Model (for authentication)
model User {
  id          String   @id @default(cuid())
  username    String   @unique
  password    String   // Hashed
  name        String
  email       String   @unique
  department  String
  role        String   // 'pharmacist', 'technician', 'admin'
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([username])
  @@index([department])
}
```

### Step 5: Create Database Migration

```bash
npx prisma migrate dev --name init
```

This will:
- Create the database schema
- Generate Prisma Client
- Apply migrations

### Step 6: Create Database Client

Create `src/lib/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Step 7: Create Seed Script

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import facilitiesData from '../src/features/pharmacy-counter/seed/facilities.json';
import patientsData from '../src/features/pharmacy-counter/seed/patients.json';
import medicationsData from '../src/features/pharmacy-counter/seed/medications.json';
// ... import other seed files

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Facilities
  console.log('📍 Seeding facilities...');
  for (const facility of facilitiesData) {
    await prisma.facility.upsert({
      where: { code: facility.code },
      update: facility,
      create: facility,
    });
  }

  // Seed Patients
  console.log('👤 Seeding patients...');
  for (const patient of patientsData) {
    await prisma.patient.upsert({
      where: { mrn: patient.mrn },
      update: patient,
      create: {
        ...patient,
        dob: new Date(patient.dob),
      },
    });
  }

  // Seed Medications
  console.log('💊 Seeding medications...');
  for (const medication of medicationsData) {
    await prisma.medication.upsert({
      where: { code: medication.code },
      update: medication,
      create: medication,
    });
  }

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

Update `package.json`:

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

Install tsx:
```bash
npm install --save-dev tsx
```

### Step 8: Update API Routes to Use Database

Update `src/app/api/pharmacy/patients/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const id = searchParams.get('id');

    // Get single patient
    if (id) {
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          prescriptions: {
            include: {
              items: {
                include: {
                  medication: true,
                },
              },
            },
            orderBy: { prescribedAt: 'desc' },
            take: 10,
          },
          appointments: {
            orderBy: { dateTime: 'desc' },
            take: 10,
          },
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(patient);
    }

    // Search patients
    if (query) {
      const patients = await prisma.patient.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { mrn: { contains: query, mode: 'insensitive' } },
            { nric: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 20,
        orderBy: { name: 'asc' },
      });

      return NextResponse.json(patients);
    }

    // Get all patients (paginated)
    const patients = await prisma.patient.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const patient = await prisma.patient.create({
      data: {
        ...body,
        dob: new Date(body.dob),
      },
    });

    return NextResponse.json(patient, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}
```

Update `src/app/api/pharmacy/prescriptions/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const withDetails = searchParams.get('withDetails') === 'true';

    // Get single prescription
    if (id) {
      const include = withDetails
        ? {
            patient: true,
            items: {
              include: {
                medication: true,
              },
            },
          }
        : undefined;

      const prescription = await prisma.prescription.findUnique({
        where: { id },
        include,
      });

      if (!prescription) {
        return NextResponse.json(
          { error: 'Prescription not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(prescription);
    }

    // Build query filters
    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        patient: true,
        items: {
          include: {
            medication: true,
          },
        },
      },
      orderBy: { prescribedAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const prescription = await prisma.prescription.create({
      data: {
        patientId: body.patientId,
        source: body.source,
        status: body.status || 'new',
        prescribedBy: body.prescribedBy,
        prescribedAt: new Date(body.prescribedAt),
        notes: body.notes,
        priority: body.priority || 'normal',
        items: {
          create: body.items.map((item: any) => ({
            drugCode: item.drugCode,
            quantity: item.quantity,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions,
          })),
        },
      },
      include: {
        items: {
          include: {
            medication: true,
          },
        },
      },
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const body = await request.json();

    const prescription = await prisma.prescription.update({
      where: { id },
      data: body,
      include: {
        patient: true,
        items: {
          include: {
            medication: true,
          },
        },
      },
    });

    return NextResponse.json(prescription);
  } catch (error) {
    console.error('Error updating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to update prescription' },
      { status: 500 }
    );
  }
}
```

---

## 🐳 Docker Setup for Development

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: hospital_db
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hospital_management
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Start database:
```bash
docker-compose up -d
```

---

## 📝 Migration Strategy: Mock to Real Data

### Phase 1: Parallel Running (Safe Migration)

1. **Keep both systems running**
   - Mock data API endpoints
   - New database API endpoints

2. **Create feature flag in `.env`**:
   ```env
   USE_REAL_DATABASE=false
   ```

3. **Update API routes to check flag**:
   ```typescript
   // src/app/api/pharmacy/patients/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { prisma } from '@/lib/db';
   import { getDataStore } from '@/features/pharmacy-counter/lib/seed-loader';

   export async function GET(request: NextRequest) {
     const useRealDb = process.env.USE_REAL_DATABASE === 'true';

     if (!useRealDb) {
       // Legacy mock implementation
       const store = getDataStore();
       const id = request.nextUrl.searchParams.get('id');
       if (id) {
         const patient = store.getPatient(id);
         if (!patient) {
           return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
         }
         return NextResponse.json(patient);
       }
       return NextResponse.json(store.getPatients());
     }

     // New database implementation
     // ... (database code as shown above)
   }
   ```

4. **Test with mock data** (`USE_REAL_DATABASE=false`)
5. **Seed database and test** (`USE_REAL_DATABASE=true`)
6. **Once confident, remove mock code**

### Phase 2: Data Migration

Create migration script `scripts/migrate-data.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { getDataStore } from '../src/features/pharmacy-counter/lib/seed-loader';

const prisma = new PrismaClient();

async function migrateData() {
  console.log('🚀 Starting data migration...');

  const store = getDataStore();

  // Migrate patients
  const patients = store.getPatients();
  for (const patient of patients) {
    await prisma.patient.upsert({
      where: { mrn: patient.mrn },
      update: patient,
      create: {
        ...patient,
        dob: new Date(patient.dob),
      },
    });
  }
  console.log(`✅ Migrated ${patients.length} patients`);

  // Migrate medications
  const medications = store.getMedications();
  for (const med of medications) {
    await prisma.medication.upsert({
      where: { code: med.code },
      update: med,
      create: med,
    });
  }
  console.log(`✅ Migrated ${medications.length} medications`);

  // Continue for other entities...

  console.log('✨ Migration completed!');
}

migrateData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run migration:
```bash
npx tsx scripts/migrate-data.ts
```

---

## 🔐 Authentication Setup

### Install Dependencies

```bash
npm install next-auth@beta bcryptjs
npm install --save-dev @types/bcryptjs
```

### Configure NextAuth

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
});

export { handler as GET, handler as POST };
```

---

## 📊 API Response Patterns

### Standard Response Format

Create `src/lib/api-response.ts`:

```typescript
import { NextResponse } from 'next/server';

export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function errorResponse(message: string, status: number = 400, errors?: any) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        errors,
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
```

Usage:
```typescript
return successResponse(patients);
return errorResponse('Patient not found', 404);
```

---

## 🧪 Testing Your Backend

### Step 1: Start Database
```bash
docker-compose up -d
```

### Step 2: Run Migrations
```bash
npx prisma migrate dev
```

### Step 3: Seed Database
```bash
npm run db:seed
```

### Step 4: Start Dev Server
```bash
npm run dev
```

### Step 5: Test API Endpoints

Using curl or Postman:

```bash
# Get all patients
curl http://localhost:3000/api/pharmacy/patients

# Search patients
curl http://localhost:3000/api/pharmacy/patients?q=John

# Get patient by ID
curl http://localhost:3000/api/pharmacy/patients?id=abc123

# Create prescription
curl -X POST http://localhost:3000/api/pharmacy/prescriptions \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "abc123",
    "source": "Outpatient",
    "prescribedBy": "Dr. Smith",
    "prescribedAt": "2025-01-15T10:00:00Z",
    "items": [
      {
        "drugCode": "PARA500",
        "quantity": 30,
        "dosage": "500mg",
        "frequency": "TDS"
      }
    ]
  }'
```

### Step 6: View Database
```bash
npm run db:studio
```

This opens Prisma Studio at `http://localhost:5555`

---

## 🎯 Quick Start Commands

```bash
# 1. Install dependencies
npm install @prisma/client prisma tsx bcryptjs
npm install --save-dev @types/bcryptjs

# 2. Initialize Prisma
npx prisma init

# 3. Start database
docker-compose up -d

# 4. Create schema (copy from above)
# Edit prisma/schema.prisma

# 5. Run migration
npx prisma migrate dev --name init

# 6. Generate client
npx prisma generate

# 7. Seed database
npm run db:seed

# 8. Start dev server
npm run dev

# 9. View database
npm run db:studio
```

---

## 📁 Recommended Project Structure After Backend Setup

```
hospital-management/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed script
│   └── migrations/            # Migration history
├── src/
│   ├── lib/
│   │   ├── db.ts              # Prisma client
│   │   ├── api-response.ts    # API utilities
│   │   └── validations.ts     # Input validation
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   └── pharmacy/
│   │   │       ├── patients/
│   │   │       │   └── route.ts
│   │   │       ├── prescriptions/
│   │   │       │   └── route.ts
│   │   │       └── ...
│   │   └── ...
│   └── ...
├── scripts/
│   └── migrate-data.ts        # Data migration
├── docker-compose.yml          # Database container
├── .env                        # Environment variables
└── package.json
```

---

## ✅ Checklist

- [ ] Install Prisma and dependencies
- [ ] Initialize Prisma
- [ ] Create database schema
- [ ] Setup Docker for PostgreSQL
- [ ] Create database client
- [ ] Create seed script
- [ ] Update API routes to use database
- [ ] Test API endpoints
- [ ] Setup authentication
- [ ] Create migration script
- [ ] Update frontend (no changes needed if API contracts stay same!)
- [ ] Deploy to production

---

## 🚨 Common Issues & Solutions

### Issue: "Can't reach database server"
**Solution**: Make sure Docker is running and database is started:
```bash
docker-compose up -d
docker ps  # Check if container is running
```

### Issue: "Migration failed"
**Solution**: Reset database and start over:
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### Issue: "Client not generated"
**Solution**: Regenerate Prisma Client:
```bash
npx prisma generate
```

### Issue: "Type errors in API routes"
**Solution**: Types are in `@prisma/client`:
```typescript
import type { Patient, Prescription } from '@prisma/client';
```

---

## 📚 Next Steps

1. **Implement remaining API routes** for all modules
2. **Add input validation** using Zod or Yup
3. **Add API middleware** for rate limiting
4. **Implement caching** with Redis
5. **Add comprehensive logging**
6. **Setup error tracking** (Sentry)
7. **Write API tests** (Jest/Vitest)
8. **Add API documentation** (OpenAPI/Swagger)
9. **Setup CI/CD pipeline**
10. **Deploy to production**

---

## 🎓 Learning Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [NextAuth.js Documentation](https://next-auth.js.org/)

---

**Questions?** Open an issue or reach out to the development team!

