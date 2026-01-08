# Malaysian Hospital Pharmacy Counter System

A comprehensive, production-grade web application for Hospital Pharmacy Counter (Kaunter Farmasi) operations in Malaysia, featuring bilingual support (BM/EN), complete workflow management, and realistic mock data.

## 🎯 Features Overview

### Core Modules Implemented

1. **Dashboard** - Real-time KPIs and operational overview
2. **Outpatient Counter** - Prescription screening, dispensing, and counseling
3. **Inpatient & Discharge (TTO)** - Ward supply and discharge prescriptions
4. **SPUB & VAS** - Value-added services including:
   - SPUB (Sistem Pendispensan Ubat Bersepadu)
   - Drive-Through Pharmacy
   - UMP (Ubat Melalui Pos)
   - Locker4U
   - Pharmacy Appointment System
5. **Clinical Touchpoints** - MTAC clinics and clinical pharmacy services
6. **Counseling** - Medication counseling with teach-back and device training
7. **Master Checklist** - Comprehensive service catalogue
8. **Quality & Safety** - ADR reporting and incident management
9. **Inventory & DD Register** - Dangerous drugs tracking and inventory management
10. **Queue & Appointments** - Queue management and appointment scheduling
11. **Settings** - System configuration and user management

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **State**: React Hooks (TanStack Query ready)
- **Data**: In-memory mock API with JSON seed files

## 📁 Project Structure

```
src/
├── app/
│   ├── api/pharmacy/          # Mock API route handlers
│   │   ├── patients/
│   │   ├── medications/
│   │   ├── prescriptions/
│   │   ├── appointments/
│   │   ├── interactions/
│   │   ├── facilities/
│   │   ├── dd-registers/
│   │   └── adr-incidents/
│   └── dispensing/            # Main pharmacy counter routes
│       ├── page.tsx           # Dashboard
│       ├── outpatient/        # Outpatient module
│       ├── inpatient/         # TTO module
│       ├── vas/               # VAS services
│       ├── clinical/          # MTAC and clinical services
│       ├── counseling/        # Counseling module
│       ├── checklist/         # Master checklist
│       ├── quality/           # Quality & Safety
│       ├── inventory/         # Inventory & DD register
│       ├── queue/             # Queue & Appointments
│       ├── settings/          # Settings
│       └── help/              # Help & documentation
│
├── features/pharmacy-counter/
│   ├── components/            # Reusable components
│   │   ├── MedicationPicker.tsx      # Smart medication search
│   │   ├── InteractionAlert.tsx      # Drug interaction warnings
│   │   ├── PatientSearch.tsx         # Patient lookup
│   │   ├── PharmacyLayout.tsx        # Main layout with navigation
│   │   └── Providers.tsx             # Context providers
│   ├── contexts/              # React contexts
│   │   ├── LanguageContext.tsx       # BM/EN i18n
│   │   └── AuthContext.tsx           # Mock authentication
│   ├── i18n/                  # Internationalization
│   │   └── dictionary.ts             # Bilingual translations
│   ├── routes/                # Feature pages
│   │   ├── Dashboard.tsx
│   │   ├── OutpatientCounter.tsx
│   │   ├── InpatientTto.tsx
│   │   ├── VasServices.tsx
│   │   ├── ClinicalTouchpoints.tsx
│   │   ├── Counseling.tsx
│   │   ├── MasterChecklist.tsx
│   │   ├── QualitySafety.tsx
│   │   ├── InventoryDd.tsx
│   │   ├── QueueAppointments.tsx
│   │   └── Settings.tsx
│   ├── seed/                  # Mock data (JSON)
│   │   ├── facilities.json
│   │   ├── patients.json
│   │   ├── medications.json
│   │   ├── prescriptions.json
│   │   ├── appointments.json
│   │   ├── interactions.json
│   │   ├── dd-registers.json
│   │   └── adr-incidents.json
│   ├── lib/
│   │   └── seed-loader.ts     # In-memory data store
│   └── types/
│       └── entities.ts        # TypeScript type definitions
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   Open [http://localhost:3000/dispensing](http://localhost:3000/dispensing)

## 👥 Demo Credentials (Mock Auth)

The system includes a role switcher in the top bar. Switch between roles:

| Role | Description |
|------|-------------|
| **Admin** | Dr. Aminah Rahman (ADM-001) |
| **Counter Pharmacist** | Pharmacist Sarah Tan (PHAR-12345) |
| **Clinical Pharmacist** | Pharmacist Dr. Kumar Velan (PHAR-23456) |
| **Supervisor** | Supervisor Wong Mei Ling (SUP-001) |
| **Clerk** | Siti Nurhaliza (CLK-001) |

Roles are persisted in `localStorage`.

## 🌐 Bilingual Support (BM/EN)

### Toggle Language
Click the language toggle button in the top bar to switch between **English (EN)** and **Bahasa Malaysia (BM)**.

### Key Terms Translated

- **Pharmacy Appointment** / **Temujanji Farmasi**
- **Outpatient Pharmacy Counter** / **Kaunter Farmasi Pesakit Luar**
- **Dangerous Drugs (DD)** / **Ubat Terkawal (DD)**
- **Psychotropic** / **Psikotropik**
- **Cold Chain** / **Rantaian Sejuk**
- **Look-Alike Sound-Alike (LASA)** / **Amaran Kelihatan Serupa / Bunyi Serupa**
- **SPUB** / **Sistem Pendispensan Ubat Bersepadu**
- **UMP** / **Ubat Melalui Pos**

## 📊 Mock Data

### Seed Data Included

- **Facilities**: 8 facilities (Hospitals & Klinik Kesihatan)
- **Patients**: 10 patients with realistic Malaysian demographics
- **Medications**: 20 medications (includes DD, psychotropics, cold chain, LASA, high-alert)
- **Prescriptions**: 6 prescriptions with various statuses
- **Appointments**: 5 appointments (various types and channels)
- **Drug Interactions**: 11 clinically relevant interactions
- **DD Registers**: 4 register movements
- **ADR Incidents**: 3 incidents with various severities

### Medication Examples

The system includes realistic Malaysian hospital medications:

```
1. Tab. Paracetamol 500 mg
   1000 mg QID PRN × 5/7 — 20 pcs

2. Tab. Metformin 500 mg  
   500 mg BD with meals × 1/12 — 60 pcs

3. Inj. Insulin Aspart 100 units/mL (Novorapid) [Cold Chain]
   
4. Tab. Warfarin 5 mg [High Alert]
   
5. Tab. Morphine Sulfate 10 mg SR [DD]
```

## 🔑 Key Features

### 1. Medication Picker (Smart Auto-Fill)

When selecting a medication, the system:
- Auto-fills default dose, frequency, and route from medication database
- Shows medication flags (DD, Psychotropic, Cold Chain, LASA, High Alert)
- All fields are editable after auto-fill
- Displays full Malaysian-style medication names

### 2. Drug Interaction Checking

Real-time interaction detection with:
- Severity levels (Contraindicated, Major, Moderate, Minor)
- Bilingual warnings and recommendations
- Acknowledge & Proceed workflow with reason capture

### 3. Duration Shortcuts

Quick duration selection:
- **3/7, 5/7, 7/7** (days)
- **1/52** (1 week)
- **1/12** (1 month)
- Custom date option

### 4. Patient Search

Smart patient lookup by:
- MRN (Medical Record Number)
- NRIC/Passport
- Patient name

Displays allergies and chronic conditions prominently.

### 5. DD Register

Dangerous Drugs register with:
- Running balance tracking
- Witness requirement
- Movement types: Receipt, Issue, Return, Disposal
- Reconciliation wizard (planned)

### 6. Counseling Module

Structured counseling with:
- Context selection (new medication, high-risk, discharge, device training, adherence)
- Topic checklists (medication name, dosage, side effects, storage, etc.)
- Device training topics (MDI, DPI, Spacer, Insulin pen, Glucometer)
- Teach-back assessment
- Patient information leaflet tracking

### 7. VAS Services

Value-Added Services including:
- **SPUB**: Inter-facility medication transfers
- **Drive-Through**: Pre-scheduled pickup
- **UMP**: Medication delivery via post
- **Locker4U**: 24/7 automated locker pickup
- **Appointments**: Pre-packed refills
- MyUBAT integration placeholder

### 8. MTAC Clinics

Clinical pharmacy touchpoints:
- DMTAC (Diabetes)
- WMTAC (Warfarin)
- Respiratory
- Nephrology
- Cardiology
- Psychiatry

## 🎨 UI/UX Features

### Modern Hospital-Grade Interface
- Clean, professional design
- Soft cards with good whitespace
- Responsive layout (1440px/1024px/768px)
- Sticky section headers
- Accessible color contrasts

### Accessibility
- Keyboard navigable
- Semantic HTML headings
- Form labels properly associated
- Focus rings on interactive elements
- Screen reader friendly

### Color Coding
- **Blue**: Primary actions, informational
- **Green**: Success, completed, available
- **Yellow/Orange**: Warnings, pending
- **Red**: Errors, critical alerts, DD
- **Purple**: Psychotropic, special categories
- **Cyan**: Cold chain

## 📱 Navigation

### Left Sidebar
- Collapsible (icon-only mode)
- Active route highlighting
- Grouped by function
- Tooltips in collapsed mode

### Top Bar
- Facility selector
- Current date (localized)
- Role switcher (demo)
- Language toggle (BM/EN)
- User information badge

## 🔄 Data Flow

### In-Memory Data Store

The `getDataStore()` function provides:
- Singleton pattern for data consistency
- CRUD operations for all entities
- Smart search and filtering
- Cross-reference lookups (e.g., prescription with patient and medication details)

### API Routes

RESTful-style endpoints:
```
GET    /api/pharmacy/patients?q=search
GET    /api/pharmacy/medications?code=PARA500
GET    /api/pharmacy/prescriptions?status=new
POST   /api/pharmacy/prescriptions
PATCH  /api/pharmacy/prescriptions?id=RX001
GET    /api/pharmacy/interactions?drugs=WARF5,ASA100
```

## 🚧 Future Enhancements (Supabase Ready)

The architecture is designed for easy migration to Supabase:

1. **Data Adapters**: Clear separation between API and UI
2. **Type Safety**: All entities have TypeScript definitions
3. **Service Layer**: Ready for real API integration
4. **Authentication**: Context-based auth ready for Supabase Auth
5. **Real-time**: Structure supports Supabase real-time subscriptions

### Migration Steps (Future)
1. Create Supabase project
2. Generate types from database schema
3. Replace mock API routes with Supabase client calls
4. Update `seed-loader.ts` to use Supabase queries
5. Implement Supabase Auth in `AuthContext.tsx`
6. Add Row Level Security (RLS) policies

## 📋 Acceptance Criteria ✅

- [x] All modules present and navigable
- [x] Bilingual labels (BM/EN) throughout
- [x] Realistic mock data with Malaysian context
- [x] Medication picker with auto-fill and editable fields
- [x] Full Malaysian-style medication names displayed
- [x] Duration shortcuts (3/7, 5/7, 1/52, 1/12, custom)
- [x] Drug interaction detection with severity levels
- [x] DD register with running balance
- [x] VAS services (SPUB, Drive-Through, UMP, Locker4U, Appointments)
- [x] Counseling with teach-back and leaflet tracking
- [x] Master checklist with progress tracking
- [x] ADR incident reporting
- [x] Queue management
- [x] Settings configuration
- [x] Role-based access (mock)
- [x] No external database required
- [x] Modern, accessible UI

## 🎓 Demo Scenarios

### Scenario 1: New Outpatient Prescription

1. Navigate to **Outpatient Counter**
2. Search and select a patient (e.g., "Ahmad")
3. Add medications using the medication picker
4. System auto-fills dose/frequency/route (editable)
5. System checks for interactions and displays alerts
6. Save prescription
7. View in prescription history

### Scenario 2: Counseling Session

1. Navigate to **Counseling**
2. Search and select patient
3. Choose counseling context (e.g., "Device Training")
4. Select topics covered from checklist
5. Mark teach-back assessment
6. Indicate leaflet given
7. Add notes and save record

### Scenario 3: DD Register Entry

1. Navigate to **Inventory & DD**
2. View current DD register
3. Click "New DD Entry"
4. Enter movement details (Issue to patient)
5. System updates running balance
6. Witness field captures approver

### Scenario 4: VAS Service

1. Navigate to **SPUB & VAS**
2. Select a VAS service (e.g., Drive-Through)
3. View scheduled pickups
4. Process and mark as collected

## 📝 Notes

### Pharmacy Counter Department Scope

**IMPORTANT**: All changes and features are isolated to the pharmacy counter department only:
- Routes under `/dispensing/*`
- Features in `src/features/pharmacy-counter/`
- No modifications to other departments

### Mock Data Limitations

- Data is in-memory and resets on server restart
- No persistent storage (by design for demo)
- Realistic but limited dataset
- Easy to expand by editing JSON files in `src/features/pharmacy-counter/seed/`

## 🤝 Contributing

To add more mock data:

1. Edit JSON files in `src/features/pharmacy-counter/seed/`
2. Follow existing data structure
3. Ensure IDs are unique
4. Test with the application

## 📞 Support

For questions or issues:
- Check the code comments
- Review type definitions in `types/entities.ts`
- Examine API routes in `src/app/api/pharmacy/`

## 🎉 Conclusion

This comprehensive Malaysian Hospital Pharmacy Counter system demonstrates:
- Production-grade architecture
- Bilingual support (BM/EN)
- Real-world pharmacy workflows
- Modern, accessible UI
- Clean, maintainable code
- Easy migration path to real database

**Ready for demo and further development!**

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Department**: Pharmacy Counter (Kaunter Farmasi) Only

