# MySuhu — Temperature Monitoring Submodule
**MVP Product Requirements Document**
Version 1.0 | Status: Draft | Scope: Submodule (integrated into parent system)

---

## 1. Overview

**MySuhu** is a temperature monitoring submodule embedded within the hospital digital operations platform. It enables facilities — particularly pharmacy, laboratory, and clinical units — to register monitoring points, log temperature readings, configure safe thresholds, and visualise trends through interactive charts.

Temperature control is a regulatory requirement under **KKM and MSQH standards**. MySuhu replaces manual paper-based log sheets with a structured digital trail that supports audits, early breach detection, and long-term trend analysis.

> **Scope note:** MySuhu is a submodule. It inherits the parent system's authentication, navigation shell, and user management. This document covers only MySuhu-specific product scope.

---

## 2. Problem Statement

Hospital units (pharmacy, labs, stores) must monitor equipment temperatures — freezers, refrigerators, and ambient room conditions — multiple times daily. Current pain points:

- Paper log books are lost, missed, or hard to audit
- No automated alerting when temperature goes out of range
- No visual trend analysis across shifts or days
- No centralised view across multiple units or locations
- Compliance audits require manual aggregation of paper records

---

## 3. Personas

| Persona | Role | Primary Need |
|---|---|---|
| **Juruteknik / Staff** | Logs temperature readings (manual entry) | Fast, friction-free entry; one tap per reading |
| **Pegawai Farmasi / Unit Head** | Reviews unit status daily | Dashboard view across all monitoring points under their unit |
| **Pentadbir Sistem** | Sets up locations, units, and thresholds | Management CRUD with confidence |
| **Pegawai Kualiti / QA Officer** | Audits compliance records | Downloadable charts, date-range filtering, breach logs |

---

## 4. Core Concepts & Terminology

```
Lokasi (Location)
  └── Unit Pemantauan (Monitoring Unit)
        ├── Konfigurasi Ambang (Threshold Config: Min / Max)
        └── Bacaan Suhu (Temperature Readings)
              ↳ Plotted as time-series chart
```

**Lokasi** — A physical place. Example: `Farmasi Logistik`, `Bilik Specimen Lab`, `Stor Ubat`.

**Unit Pemantauan** — A specific monitoring point within a location. Example: `Peti Beku 1`, `Peti Beku 2`, `Suhu Bilik`. Each unit has its own threshold and reading history.

**Ambang Suhu** — The acceptable temperature range for a unit (Min °C / Max °C). Readings outside this range are flagged as breach events.

**Bacaan Suhu** — A logged temperature reading with timestamp and staff reference.

---

## 5. Feature Scope (MVP)

### 5.1 Location Management

- Create, edit, deactivate Lokasi
- Fields: Nama Lokasi, Kod Lokasi (auto-generated), Bahagian/Jabatan, description (optional)
- A Lokasi can contain many Monitoring Units
- Lokasi list view with unit count and overall status badge

### 5.2 Monitoring Unit Registration

- Create, edit, deactivate Monitoring Units under a Lokasi
- Fields:
  - Nama Unit (e.g., `Peti Beku 1`)
  - Jenis Unit: `Peti Beku (Freezer)` / `Peti Sejuk (Refrigerator)` / `Suhu Bilik (Ambient)` / `Inkubator` / `Lain-lain`
  - Unit ID (auto-generated, e.g., `SHU-001`)
  - Nota / Jenama Peralatan (optional)
- Status indicator: Active / Inactive
- A Monitoring Unit belongs to exactly one Lokasi

### 5.3 Threshold Configuration

- Per Monitoring Unit, set:
  - **Min °C** — lower safe limit
  - **Max °C** — upper safe limit
- Threshold history is preserved (timestamped) — if threshold is updated, old readings retain their original threshold context
- Visual preview: shows the range band on the chart after configuration
- Default suggestion based on Unit Type:

  | Jenis Unit | Min °C | Max °C |
  |---|---|---|
  | Peti Beku (Freezer) | -25 | -15 |
  | Peti Sejuk (Refrigerator) | 2 | 8 |
  | Suhu Bilik (Ambient) | 18 | 28 |
  | Inkubator | 35 | 37 |
  | Lain-lain | User defined | User defined |

### 5.4 Temperature Logging (Manual Entry)

- Staff selects: Lokasi → Unit Pemantauan → enters reading
- Fields: Suhu (°C), Tarikh & Masa (defaults to now, editable), Nama Pegawai (pre-filled from auth), Nota (optional)
- On submit:
  - If reading is within range → saved, shown as normal ✅
  - If reading is outside min/max → saved, flagged as **Breach** 🔴, inline warning shown immediately
  - If reading is approaching threshold (within 10% of breach) → flagged as **Warning** 🟡
- Entry history per unit (table view, paginated, filterable by date range)
- Readings are never deleted — only annotated if entered in error (with reason)

### 5.5 Dashboard

A summary screen that answers: **"What is the current temperature status across all units right now?"**

Layout:
- **Status Cards** — one card per active Monitoring Unit, grouped by Lokasi
- Each card shows:
  - Unit name and type icon
  - Latest temperature reading + timestamp
  - Status badge: Normal / Warning / Breach / No Reading (if >4 hours with no log)
  - Min–Max range label
- **Breach Banner** — if any unit is in breach state, a prominent banner appears at the top
- **Filter** — filter cards by Lokasi, status (Normal / Warning / Breach / Tiada Bacaan)
- Click on any card → navigates to that unit's chart view

### 5.6 Temperature Chart

The core visualisation — a **time-series line chart** with exactly 3 lines:

| Line | Colour | Meaning |
|---|---|---|
| **Max threshold** | `--danger` red, dashed | Upper safe limit (horizontal reference) |
| **Min threshold** | `--info` blue, dashed | Lower safe limit (horizontal reference) |
| **Current / Actual** | `--accent` or `--success` | Logged temperature over time |

Chart behaviour:
- X-axis: Time (configurable: Last 24 hours / Last 7 days / Last 30 days / Custom range)
- Y-axis: Temperature in °C, auto-scaled with padding above/below thresholds
- Hover tooltip: shows exact temperature, timestamp, staff name, and any notes
- Breach zones: background shading (subtle red fill) when actual line crosses outside threshold band
- Chart is interactive (zoom, pan)
- **"Muat Turun" (Download) button** — exports chart as:
  - PNG image (default)
  - PDF report (includes unit name, location, date range, threshold values, breach summary)

### 5.7 Breach Log

- Dedicated view listing all breach events across all units
- Columns: Unit, Lokasi, Suhu Tercatat, Ambang Dilanggar (Min/Max), Tarikh & Masa, Pegawai, Status (Aktif / Selesai)
- Filterable by date range, lokasi, unit
- Exportable as CSV

---

## 6. Data Model

### `lokasi`
```
id                UUID        PK
kod_lokasi        VARCHAR     unique, auto e.g. LOK-001
nama_lokasi       VARCHAR     e.g. "Farmasi Logistik"
jabatan           VARCHAR
deskripsi         TEXT        nullable
status            ENUM        active | inactive
created_at        TIMESTAMP
updated_at        TIMESTAMP
created_by        UUID        FK → users
```

### `unit_pemantauan`
```
id                UUID        PK
lokasi_id         UUID        FK → lokasi
unit_id           VARCHAR     unique, auto e.g. SHU-001
nama_unit         VARCHAR     e.g. "Peti Beku 1"
jenis_unit        ENUM        freezer | refrigerator | ambient | incubator | other
nota              TEXT        nullable
status            ENUM        active | inactive
created_at        TIMESTAMP
updated_at        TIMESTAMP
created_by        UUID        FK → users
```

### `ambang_suhu`
```
id                UUID        PK
unit_id           UUID        FK → unit_pemantauan
min_suhu          DECIMAL(5,2)  minimum safe temperature
max_suhu          DECIMAL(5,2)  maximum safe temperature
effective_from    TIMESTAMP   when this threshold became active
effective_until   TIMESTAMP   nullable, set when superseded
created_by        UUID        FK → users
```

### `bacaan_suhu`
```
id                UUID        PK
unit_id           UUID        FK → unit_pemantauan
suhu              DECIMAL(5,2)  recorded temperature
status_bacaan     ENUM        normal | warning | breach
ambang_id         UUID        FK → ambang_suhu (snapshot at time of reading)
tarikh_masa       TIMESTAMP   time of actual reading (not just entry time)
dicatat_pada      TIMESTAMP   time of data entry
dicatat_oleh      UUID        FK → users
nota              TEXT        nullable
is_corrected      BOOLEAN     default false
correction_note   TEXT        nullable
```

---

## 7. UI/UX Design Principles

MySuhu follows the **luxury-ui** design system consistent with the parent platform — Linear-quality precision, not generic dashboard templates.

### Typography
- Inter Variable across all UI
- Tabular-nums on all temperature values and timestamps
- Monospace for Unit IDs (`SHU-001`, `LOK-001`)

### Color Semantics

| State | Color Token | Usage |
|---|---|---|
| Normal | `--success` (#22c55e) | Within range badge, card border-left |
| Warning | `--warning` (#f59e0b) | Approaching threshold |
| Breach | `--danger` (#ef4444) | Out of range — badge, banner, chart zone fill |
| No Reading | `--text-tertiary` | >4h since last log |
| Chart Min line | `--info` blue | Lower threshold reference |
| Chart Max line | `--danger` red | Upper threshold reference |
| Chart Actual line | `--accent` or success | Actual temperature trend |

### Chart Line Styling
- Min / Max lines: **dashed**, weight 1.5px, with label at end of line
- Actual line: **solid**, weight 2px, with fill gradient below the line (subtle, 8% opacity)
- Breach zone: background fill with `--danger-subtle` (rgba 10% opacity)
- Data point dots: 4px radius, only shown on hover tooltip

### Status Cards (Dashboard)
- Cards use inset border, not shadow
- Status communicated via left border accent (3px) — not full card background colour
- Latest temperature is displayed large (`--text-xl`, tabular-nums, bold)
- "Tiada bacaan" state: card border dashed, temperature field shows `—`

### Empty States
- No monitoring units: "Tiada Unit Didaftarkan" + description + CTA to register
- No readings yet: "Belum ada bacaan dicatat" + CTA to log first reading

---

## 8. User Flows

### Flow 1: Setup (Admin)
```
Register Lokasi → Register Unit Pemantauan → Configure Threshold → Unit ready for logging
```

### Flow 2: Daily Logging (Staff)
```
Dashboard → Select Unit Card → Tap "Catat Suhu" → Enter °C → Confirm → 
  ├── Normal → Success toast, card updates
  └── Breach → Warning modal shown, reading saved, breach logged
```

### Flow 3: Review & Download (QA Officer)
```
Dashboard → Select Unit Card → View Chart → Set Date Range → 
Review 3-line chart → Click "Muat Turun" → Select PNG / PDF → Download
```

### Flow 4: Breach Investigation
```
Breach Log → Filter by unit / date → View breach entries → 
Annotate if false alarm → Export CSV for audit
```

---

## 9. Tech Stack (Recommended, aligned with parent system)

| Layer | Recommended |
|---|---|
| Frontend | React + TypeScript |
| Charting | Recharts (already available in parent system) |
| Chart Export PNG | `html2canvas` or `chart.js` native export |
| Chart Export PDF | `jsPDF` + canvas render |
| Backend | NestJS (Prisma ORM) |
| Database | PostgreSQL |
| State | Zustand or React Query |

---

## 10. Out of Scope (MVP)

These are intentionally excluded from v1 and noted for future phases:

| Feature | Reason deferred |
|---|---|
| Automated sensor / IoT integration | Hardware procurement not scoped |
| Push / SMS / email alerts on breach | Requires notification infrastructure decision |
| Multiple threshold ranges per unit (e.g., time-of-day) | Adds complexity; single range sufficient for MVP |
| QR code scan to log reading | Nice-to-have; manual form covers MVP need |
| Predictive breach forecast | Data science layer — post-MVP |
| Mobile app (native) | Web PWA covers MVP on mobile |
| Scheduled reminder to log | Notification system dependency |

---

## 11. Acceptance Criteria (MVP Done)

- [ ] Admin can register a Lokasi with at least one Unit Pemantauan
- [ ] Each Unit has one active Threshold (Min / Max) at any time
- [ ] Staff can log a temperature reading in under 30 seconds
- [ ] A breach reading is immediately flagged on submit with clear visual feedback
- [ ] Dashboard shows status of all active units with last reading timestamp
- [ ] Chart renders correctly with 3 distinct lines (Min, Max, Actual) over selected date range
- [ ] Breach zones visually shaded on chart when actual crosses threshold
- [ ] PNG download produces a clean, titled chart image
- [ ] PDF download includes unit metadata, date range, threshold values, and breach count
- [ ] Breach Log is filterable and exportable as CSV
- [ ] All temperature values rendered with tabular-nums, 1 decimal precision (e.g., 4.2°C)
- [ ] "Tiada bacaan" state surfaced on dashboard cards if no reading within 4 hours

---

## 12. Success Metrics (Post-Launch)

| Metric | Target |
|---|---|
| Logging compliance rate | >95% of units have at least 1 reading per shift |
| Breach detection time | Breach visible on dashboard within 1 minute of logging |
| Audit export adoption | QA officers download reports without manual assistance |
| Manual paper log elimination | 0 paper log books active in enrolled units within 60 days |

---

*MySuhu v1.0 MVP — Prepared for development handoff.*
*Parent system: KKM Digital Operations Platform*
*Language: Bilingual (BM primary, English technical terms preserved)*
