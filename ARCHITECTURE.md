# Hospital Management System - Architecture Overview

## 📊 Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 15)                    │
├─────────────────────────────────────────────────────────────────┤
│  Pages/Routes                                                    │
│  ├── /dispensing          (Pharmacy Counter)                    │
│  ├── /emergency           (Emergency Department)                │
│  ├── /inpatient           (Inpatient Pharmacy)                  │
│  ├── /front-desk          (Front Desk)                          │
│  ├── /laboratory          (Lab)                                 │
│  ├── /radiology           (Radiology)                           │
│  └── ... (many more departments)                                │
│                                                                  │
│  Components                                                      │
│  ├── UI Components        (buttons, tables, modals)            │
│  ├── Feature Components   (department-specific)                │
│  └── Charts & Analytics   (lightweight-charts)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↕ fetch()
┌─────────────────────────────────────────────────────────────────┐
│                    API ROUTES (Next.js API)                      │
├─────────────────────────────────────────────────────────────────┤
│  /api/pharmacy/                                                  │
│  ├── patients/route.ts         GET, POST, PATCH                │
│  ├── prescriptions/route.ts    GET, POST, PATCH                │
│  ├── medications/route.ts      GET                             │
│  ├── appointments/route.ts     GET, POST, PATCH                │
│  ├── facilities/route.ts       GET                             │
│  ├── interactions/route.ts     GET                             │
│  ├── adr-incidents/route.ts    GET, POST                       │
│  └── dd-registers/route.ts     GET, POST                       │
└─────────────────────────────────────────────────────────────────┘
                              ↕
         ┌────────────────────┴────────────────────┐
         │                                          │
         ↓ (Current: USE_REAL_DATABASE=false)      ↓ (Future: USE_REAL_DATABASE=true)
┌─────────────────────┐                   ┌─────────────────────┐
│   MOCK DATA STORE   │                   │   PRISMA CLIENT     │
├─────────────────────┤                   ├─────────────────────┤
│  DataStore class    │                   │  @prisma/client     │
│  In-memory arrays   │                   │  Type-safe queries  │
│  JSON seed files    │                   │  Migrations         │
└─────────────────────┘                   └─────────────────────┘
                                                     ↕
                                          ┌─────────────────────┐
                                          │   POSTGRESQL DB     │
                                          ├─────────────────────┤
                                          │  Docker Container   │
                                          │  Port: 5432         │
                                          │  pgAdmin: 5050      │
                                          └─────────────────────┘
```

---

## 🔄 Data Flow

### Current Flow (Mock Data)
```
User Action → Frontend Component → API Route → DataStore → In-Memory Array → API Response → UI Update
```

### Future Flow (Real Database)
```
User Action → Frontend Component → API Route → Prisma Client → PostgreSQL → API Response → UI Update
```

---

## 📁 Project Structure

```
hospital-management/
│
├── 📱 FRONTEND
│   └── src/
│       ├── app/                    # Next.js App Router pages
│       │   ├── dispensing/        # Pharmacy counter pages
│       │   ├── emergency/         # Emergency dept pages
│       │   ├── front-desk/        # Front desk pages
│       │   └── api/               # ✨ API routes
│       │       └── pharmacy/      # Pharmacy API endpoints
│       │
│       ├── components/            # Reusable UI components
│       │   ├── ui/               # Base components (buttons, inputs)
│       │   └── *.tsx             # Feature components
│       │
│       ├── features/             # Feature-specific code
│       │   ├── pharmacy-counter/ # Pharmacy counter feature
│       │   │   ├── routes/      # Page components
│       │   │   ├── components/  # Feature components
│       │   │   ├── types/       # TypeScript types
│       │   │   ├── lib/         # 📦 Mock data store
│       │   │   └── seed/        # 📄 JSON seed files
│       │   │
│       │   ├── emergency/        # Emergency feature
│       │   └── ...               # Other features
│       │
│       └── lib/                  # Shared utilities
│           ├── db.ts            # 🆕 Prisma client
│           ├── api-response.ts  # 🆕 API helpers
│           └── validation.ts    # 🆕 Validation helpers
│
├── 🗄️ DATABASE
│   └── prisma/
│       ├── schema.prisma        # 🆕 Database schema
│       ├── seed.ts             # 🆕 Seed script
│       └── migrations/         # Database migrations
│
├── 🐳 DOCKER
│   └── docker-compose.yml      # 🆕 PostgreSQL + pgAdmin
│
└── 📋 CONFIG
    ├── package.json            # Dependencies + scripts
    ├── tsconfig.json           # TypeScript config
    ├── next.config.ts          # Next.js config
    └── .env                    # 🆕 Environment variables
```

---

## 🎯 Database Schema

### Core Entities

```
┌─────────────┐
│   Patient   │
├─────────────┤
│ id          │──┐
│ mrn         │  │
│ nric        │  │
│ name        │  │
│ dob         │  │
│ gender      │  │
│ allergies[] │  │
└─────────────┘  │
                 │
                 │ 1:N
                 ↓
         ┌──────────────┐
         │ Prescription │
         ├──────────────┤
         │ id           │──┐
         │ patientId    │  │
         │ status       │  │
         │ prescribedAt │  │
         │ prescribedBy │  │
         └──────────────┘  │
                           │ 1:N
                           ↓
                  ┌─────────────────┐
                  │ PrescriptionItem│
                  ├─────────────────┤
                  │ id              │
                  │ prescriptionId  │
                  │ drugCode        │──→ Medication
                  │ quantity        │
                  │ dosage          │
                  │ frequency       │
                  └─────────────────┘
```

### Supporting Entities
- **Appointment**: Patient pharmacy appointments (counseling, MTAC)
- **Medication**: Drug catalog with stock levels
- **Facility**: Healthcare facilities for transfers
- **DrugInteraction**: Drug-drug interactions
- **AdrIncident**: Adverse drug reaction reports
- **DdRegister**: Dangerous drug (controlled substance) register
- **User**: Staff authentication and authorization
- **AuditLog**: System activity tracking

---

## 🔌 API Endpoints

### Patients API (`/api/pharmacy/patients`)

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/pharmacy/patients` | List all patients | `page`, `limit` |
| GET | `/api/pharmacy/patients?id=xxx` | Get patient details | `id` |
| GET | `/api/pharmacy/patients?q=search` | Search patients | `q` (search term) |
| POST | `/api/pharmacy/patients` | Create new patient | - |
| PATCH | `/api/pharmacy/patients?id=xxx` | Update patient | `id` |

### Prescriptions API (`/api/pharmacy/prescriptions`)

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/pharmacy/prescriptions` | List prescriptions | `status`, `patientId` |
| GET | `/api/pharmacy/prescriptions?id=xxx` | Get prescription | `id`, `withDetails` |
| POST | `/api/pharmacy/prescriptions` | Create prescription | - |
| PATCH | `/api/pharmacy/prescriptions?id=xxx` | Update prescription | `id` |

### Other APIs
- `/api/pharmacy/medications` - Drug catalog
- `/api/pharmacy/appointments` - Pharmacy appointments
- `/api/pharmacy/facilities` - Healthcare facilities
- `/api/pharmacy/interactions` - Drug interactions
- `/api/pharmacy/adr-incidents` - ADR reports
- `/api/pharmacy/dd-registers` - Dangerous drug register

---

## 🎨 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Icons**: Heroicons, Lucide React
- **Charts**: Lightweight Charts
- **Notifications**: Sonner

### Backend (API)
- **Runtime**: Next.js API Routes (Node.js)
- **ORM**: Prisma (🆕)
- **Database**: PostgreSQL 16 (🆕)
- **Auth**: NextAuth.js (planned)

### DevOps
- **Containerization**: Docker + Docker Compose
- **Database Tools**: Prisma Studio, pgAdmin
- **Development**: Hot reload with Turbopack

---

## 🔐 Authentication Flow (Planned)

```
Login Page
    ↓
Credentials → NextAuth.js
    ↓
JWT Token → Stored in cookie/localStorage
    ↓
Protected Routes → Middleware checks auth
    ↓
API Calls → Include auth token
    ↓
API Routes → Verify token → Access database
```

---

## 📊 Key Features by Module

### 💊 Pharmacy Counter (Dispensing)
- Patient search & registration
- Prescription screening & verification
- Drug interaction checking
- ADR (Adverse Drug Reaction) reporting
- Dangerous drug register
- Appointment scheduling (MTAC, counseling)
- Multi-language support (EN, MY)

### 🚑 Emergency Department
- Patient triage
- Emergency prescriptions
- Rapid dispensing
- Critical stock monitoring

### 🏥 Inpatient Pharmacy
- Ward-based prescriptions
- TTO (To Take Out) medications
- Medication reconciliation
- Antimicrobial stewardship (AMS)

### 🧪 Laboratory
- Test order queue
- Results entry
- Sample tracking
- Equipment monitoring

### 📋 Front Desk
- Patient registration
- Visit management
- Appointment scheduling
- Queue management

### 📦 Inventory & Logistics
- Stock management
- Purchase orders
- Inter-facility transfers
- Near-expiry tracking
- Medical oxygen tracking

---

## 🚀 Migration Strategy

### Phase 1: Setup (You are here! 👈)
✅ Install Prisma and dependencies  
✅ Create database schema  
✅ Setup Docker for PostgreSQL  
✅ Create seed data  

### Phase 2: Parallel Running
- Keep both mock and real database  
- Use feature flag to switch  
- Test thoroughly with real data  

### Phase 3: Full Migration
- Update all API routes  
- Remove mock data code  
- Deploy to production  

### Phase 4: Enhancements
- Add authentication  
- Implement caching  
- Add API rate limiting  
- Setup monitoring & logging  

---

## 🎓 Next Steps for You

1. **Start Docker Database**
   ```bash
   docker-compose up -d
   ```

2. **Run Migrations**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Seed Database**
   ```bash
   npm run db:seed
   ```

4. **View Database**
   ```bash
   npm run db:studio
   ```

5. **Test API**
   - Keep `USE_REAL_DATABASE=false` (default)
   - Test with mock data first
   - Switch to `true` when ready

6. **Update Routes**
   - Use `route-new.ts` as template
   - Gradually update all API routes
   - Test each one thoroughly

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Docker Documentation](https://docs.docker.com/)

---

## 🆘 Support

Check these files for help:
- `QUICK_START.md` - Fast setup guide
- `BACKEND_SETUP_GUIDE.md` - Detailed documentation
- `prisma/schema.prisma` - Database schema reference

**Questions?** Open an issue or check the troubleshooting section in `QUICK_START.md`

---

**Last Updated**: October 2025  
**Version**: 1.0.0

