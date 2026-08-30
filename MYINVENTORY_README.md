# BUKU PANDUAN PENGGUNA LENGKAP & SPESIFIKASI OPERASI SISTEM: MODUL MYINVENTORY (100% ASLI)
## Hospital Operation Management Ecosystem (HOME)
*Sistem Pengurusan Inventori, Stor Farmasi, Kawalan FEFO, Pengimbas Kod QR, Pengurusan Kontrak & Lejar Digital KEW.PS-4 Bersepadu*
*Dokumen Standard Kualiti Enterprise untuk Pengguna Baharu, Pegawai Stor, Pegawai Farmasi, Pentadbir & Juruaudit Awam*

---

# KANDUNGAN DOKUMEN

* [BAB 1: PENGENALAN & PERSEDIAAN AWAL SISTEM](#bab-1-pengenalan--persediaan-awal-sistem)
  * [1.1 Pengenalan Ekosistem MyInventory & Transformasi Digital](#11-pengenalan-ekosistem-myinventory--transformasi-digital)
  * [1.2 Cara Log Masuk & Navigasi Antaramuka](#12-cara-log-masuk--navigasi-antaramuka)
  * [1.3 Struktur 5 Peranan & Matriks Kebenaran Pengguna (RBAC)](#13-struktur-5-peranan--matriks-kebenaran-pengguna-rbac)
* [BAB 2: PANDUAN LANGKAH DEMI LANGKAH MENGIKUT SENARIO OPERASI HARIAN (12 TUTORIAL BERPANDU)](#bab-2-panduan-langkah-demi-langkah-mengikut-senario-operasi-harian-12-tutorial-berpandu)
* [BAB 3: CONTOH VISUAL FORMAT CETAKAN & EKSPORT DOKUMEN BERKANUN](#bab-3-contoh-visual-format-cetakan--eksport-dokumen-berkanun)
  * [3.1 Contoh Cetakan Rasmi 1: Dokumen Lejar Digital KEW.PS-4 (Jata Negara MOF)](#31-contoh-cetakan-rasmi-1-dokumen-lejar-digital-kewps-4-jata-negara-mof)
  * [3.2 Contoh Cetakan Rasmi 2: Plakad Kod QR Petak Rak (100mm x 70mm)](#32-contoh-cetakan-rasmi-2-plakad-kod-qr-petak-rak-100mm-x-70mm)
  * [3.3 Contoh Cetakan Rasmi 3: Lembaran Pelekat Kod QR Kotak Ubat (Grid 24 A4)](#33-contoh-cetakan-rasmi-3-lembaran-pelekat-kod-qr-kotak-ubat-grid-24-a4)
  * [3.4 Contoh Cetakan Rasmi 4: Sijil Verifikasi Pemeriksaan Stor KEW.PS-14](#34-contoh-cetakan-rasmi-4-sijil-verifikasi-pemeriksaan-stor-kewps-14)
  * [3.5 Contoh Cetakan Rasmi 5: Laporan Kedudukan Semasa Stok KEW.PS-13](#35-contoh-cetakan-rasmi-5-laporan-kedudukan-semasa-stok-kewps-13)
  * [3.6 Contoh Cetakan Rasmi 6: Laporan Nilai Pegangan Stok Farmasi (RM)](#36-contoh-cetakan-rasmi-6-laporan-nilai-pegangan-stok-farmasi-rm)
* [BAB 4: DIREKTORI LENGKAP SEMUA BUTANG, MODAL & TINDAKAN SISTEM (ZERO ASSUMPTIONS)](#bab-4-direktori-lengkap-semua-butang-modal--tindakan-sistem-zero-assumptions)
  * [4.1 Butang di Halaman Ringkasan Dashboard (`InventoryOverviewPage.tsx`)](#41-butang-di-halaman-ringkasan-dashboard-inventoryoverviewpagetsx)
  * [4.2 Butang Toolbar Lejar KEW.PS-4 (`KewPs4LedgerPage.tsx`)](#42-butang-toolbar-lejar-kewps-4-kewps4ledgerpagetsx)
  * [4.3 Butang di Halaman Pengimbas QR (`StockMovementScannerPage.tsx`)](#43-butang-di-halaman-pengimbas-qr-stockmovementscannerpagetsx)
  * [4.4 Butang di Halaman Katalog Induk Ubat (`DrugInventoryPage.tsx`)](#44-butang-di-halaman-katalog-induk-ubat-druginventorypagetsx)
  * [4.5 Butang di Halaman Katalog Bukan Ubat (`NonDrugInventoryPage.tsx`)](#45-butang-di-halaman-katalog-bukan-ubat-nondruginventorypagetsx)
  * [4.6 Butang di Halaman Kawalan Stok Hampir Luput (`NearExpiryPage.tsx`)](#46-butang-di-halaman-kawalan-stok-hampir-luput-nearexpirypagetsx)
  * [4.7 Butang di Halaman Lokasi Stor & Bilik Simpanan (`StoreLocationManagementPage.tsx`)](#47-butang-di-halaman-lokasi-stor--bilik-simpanan-storelocationmanagementpagetsx)
  * [4.8 Butang di Halaman Laporan Berkanun & Kewangan (`InventoryReportPage.tsx`)](#48-butang-di-halaman-laporan-berkanun--kewangan-inventoryreportpagetsx)
* [BAB 5: SENIBINA DATA, FORMULA MATEMATIK & INVARIAN KESELAMATAN](#bab-5-senibina-data-formula-matematik--invarian-keselamatan)
* [BAB 6: PANDUAN MENGHADAPI AUDIT & SOALAN LAZIM (FAQ)](#bab-6-panduan-menghadapi-audit--soalan-lazim-faq)

---

# BAB 1: PENGENALAN & PERSEDIAAN AWAL SISTEM

## 1.1 Pengenalan Ekosistem MyInventory & Transformasi Digital
Modul **MyInventory** merupakan sistem pengurusan inventori pintar bertaraf *enterprise-grade* di bawah platform **Hospital Operation Management Ecosystem (HOME)**. Modul ini direkabentuk secara khusus untuk mentransformasikan operasi stor farmasi, stor perubatan, stor guna habis, dan stor satelit di seluruh fasiliti kesihatan kerajaan Malaysia.

Sistem ini menggantikan kad petak kertas manual tradisional dengan **Lejar Digital KEW.PS-4 Bersepadu** yang mematuhi sepenuhnya Pekeliling Perbendaharaan Malaysia (**1PP AM 6: Tatacara Pengurusan Stor Kerajaan - TPS**), Arahan Perbendaharaan (AP 3), dan Akta Keterangan 1950 (Seksyen 90A bagi Dokumen Cetakan Komputer).

---

## 1.2 Cara Log Masuk & Navigasi Antaramuka
1. **Langkah 1:** Buka pelayar web (Google Chrome, Microsoft Edge, atau Safari) pada komputer atau tablet hospital.
2. **Langkah 2:** Masukkan ID Pengguna (Emel KKM) dan Kata Laluan rasmi anda.
3. **Langkah 3:** Pada Menu Navigasi Utama di sebelah kiri skrin, klik pada menu **`Logistik Farmasi`** $\rightarrow$ pilih **`Pengurusan Inventori (MyInventory)`**.
4. **Langkah 4:** Anda akan dibawa terus ke **Halaman Ringkasan Inventori Stor (`/pharmacy/inventory`)**.

---

## 1.3 Struktur 5 Peranan & Matriks Kebenaran Pengguna (RBAC)

| Peranan Pengguna | Kod Sistem | Kebenaran Akses & Tanggungjawab Operasi |
| :--- | :--- | :--- |
| **Pengarah Farmasi / Pengarah Hospital** | `pharmacy_director` | Akses penuh 100%, kelulusan dasar stok, penetapan siling perolehan, verifikasi stor tertinggi, dan pengesahan pelupusan KEW.PS-19. |
| **Ketua Pegawai Farmasi / Pengurus** | `pharmacy_manager` | Pengurusan kontrak APPL/Pusat, kelulusan permohonan indent wad, pelarasan stok jumpa, dan pengesahan agihan inter-hospital. |
| **Pegawai Farmasi** | `pharmacist` | Pendaftaran ubat baharu, pindaan harga/paras buffer, kuarantin ubat luput, penyelarasan lejar KEW.PS-4, dan verifikasi tahunan. |
| **Penolong Pegawai Farmasi / Pembantu Stor** | `pharmacy_storekeeper` | Perekodan imbasan penerimaan stok dari pembekal (LPO), pengeluaran ubat ke wad berasaskan FEFO, dan cetakan tag kod QR rak. |
| **Juruaudit Dalaman / Juruaudit Negara** | `auditor` | Akses paparan lejar KEW.PS-4 (*Read-Only*), arkib log audit keselamatan, semakan dokumen verifikasi, dan eksport laporan berkanun. |

---

# BAB 2: PANDUAN LANGKAH DEMI LANGKAH MENGIKUT SENARIO OPERASI HARIAN (12 TUTORIAL BERPANDU)

### Senario 1: Merekod Penerimaan Ubat Baharu dari Pembekal (LPO / DO)
1. Pergi ke **Lejar Digital KEW.PS-4** (`/pharmacy/inventory/ledger`).
2. Pilih ubat yang diterima daripada menu carian (Contoh: *Paracetamol 500mg Tablet*).
3. Pada palang butang atas (*toolbar*), klik butang hijau **`[+ Terima]`** (`PlusCircle`).
4. Masukkan No. LPO (`LPO/2026/08/1102`), pilih Pembekal (`Pharmaniaga Logistics Sdn Bhd`), No. Kelompok (`LOT-2026-99A`), Tarikh Luput (`31/08/2028`), Kuantiti (`5,000`), dan Kos Seunit (`RM 0.045`).
5. Klik **`[Simpan & Kemaskini Lejar]`**. Baki stok bertambah secara automatik ($+5,000$).

### Senario 2: Mengeluarkan Ubat ke Wad Berasaskan FEFO Pintar
1. Buka lejar ubat berkenaan di `KewPs4LedgerPage`.
2. Klik butang merah **`[- Keluar]`** (`MinusCircle`).
3. Sistem memaparkan kelompok dengan tarikh luput terawal secara automatik (Saranan FEFO Pintar).
4. Pilih Wad Penerima (Contoh: *Wad Kenanga*), masukkan No. Indent (`IND-WAD-2026/04`) dan Kuantiti (`500`).
5. Klik **`[Keluarkan Stok]`**. Baki kelompok ditolak ($-500$).

### Senario 3: Imbasan Pantas Menggunakan Kamera Telefon / Tablet
1. Buka halaman **Pengimbas Pergerakan Stok** (`/pharmacy/inventory/movement`).
2. Halakan kamera peranti ke arah Plakad QR rak ubat. Sistem mengeluarkan **bunyi chime dwiton** dalam masa $<2$ saat.
3. Pilih Tab `[Penerimaan Stok]` atau `[Pengeluaran Stok]`, masukkan kuantiti, dan klik Simpan.

### Senario 4: Menjana dan Mencetak Plakad QR Petak Rak & Pelekat Helaian A4
1. Di lejar KEW.PS-4, klik butang **`[Tag QR Petak]`**. Sistem menjana plakad ($100\text{mm} \times 70\text{mm}$). Klik **`[Cetak Plakad]`**.
2. Di Katalog Ubat, klik **`[🏷️ Jana Tag Kod QR]`** untuk mencetak helaian grid 24 pelekat A4 bagi kotak ubat.

### Senario 5: Mengendalikan Ubat Hampir Luput (Kuarantin & Pemindahan)
1. Buka **Kawalan Stok Hampir Luput** (`/pharmacy/inventory/near-expiry`).
2. Semak nilai kewangan berisiko (*Value at Risk RM*).
3. Klik **`[🛡️ Kuarantin Kelompok]`** untuk menyekat pengeluaran di kaunter, atau **`[🚚 Pindah ke Wad Penggunaan Tinggi]`** untuk agihan pantas.

### Senario 6: Pemeriksaan Stok Tahunan KEW.PS-14 & Pengiraan Variance
1. Di lejar KEW.PS-4, klik butang hijau **`[Store Verification]`** (`ShieldCheck`).
2. Masukkan angka kiraan fizikal rak pada medan **`Kiraan Fizikal Sebenar`**. Sistem mengira perbezaan (*Variance = Fizikal - Sistem*).
3. Masukkan nama Pegawai Pemeriksa Luar dan klik **`[Kunci Verifikasi KEW.PS-14]`**.

---

# BAB 3: CONTOH VISUAL FORMAT CETAKAN & EKSPORT DOKUMEN BERKANUN

---

## 3.1 Contoh Cetakan Rasmi 1: Dokumen Lejar Digital KEW.PS-4 (Jata Negara MOF)

Berikut adalah contoh susun atur format dokumen rasmi **KEW.PS-4** yang dijana oleh sistem apabila butang **`[Cetak KEW.PS-4]`** ditekan:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       KERAJAAN MALAYSIA                                          │
│                                    TATACARA PENGURUSAN STOR                                      │
│                                           KEW.PS-4                                               │
│                                          KAD PETAK                                               │
│                              (Digital Statutory Ledger System)                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ BAHAGIAN A: MAKLUMAT KAWALAN STOK                                                                │
│ Perihal Stok  : Paracetamol 500mg Tablet (Oral)       No. Kod Barang : DRG-PAR-500               │
│ Kumpulan Stok : Kumpulan A (Ubat Kritikal)            Unit Pengukuran: TABLET                    │
│ Lokasi Stor   : Stor Utama Farmasi -> Bilik A -> Rak 02 -> Tingkat 3 -> Petak P1                 │
│ ──────────────────────────────────────────────────────────────────────────────────────────────── │
│ PARAS STOK TAHUNAN:                                                                              │
│ • Tahun Kewangan : 2026                                                                          │
│ • Kuantiti Minimum (Min Stock)    : 2,000 TABLET                                                 │
│ • Kuantiti Menokok (Buffer Level) : 5,000 TABLET                                                 │
│ • Kuantiti Maksimum (Max Stock)   : 15,000 TABLET                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ BAHAGIAN B: REKOD TRANSAKSI PERGERAKAN STOK                                                      │
├────────────┬──────────────────┬──────────────────────┬─────────┬─────────┬────────┬──────────────┤
│ Tarikh     │ No. Rujukan      │ Dari / Kepada        │ Terima  │ Keluar  │ Baki   │ Kelompok/T.T │
├────────────┼──────────────────┼──────────────────────┼─────────┼─────────┼────────┼──────────────┤
│ 01/01/2026 │ BAKI-AWAL-2026   │ Baki Bawa Ke Hadapan │ —       │ —       │ 3,200  │ B/F (Sistem) │
│ 15/01/2026 │ LPO/2026/08/011  │ Pharmaniaga Log.     │ +5,000  │ —       │ 8,200  │ LOT-99A (SA) │
│ 28/01/2026 │ IND/WAD-1A/042   │ Wad Kenanga (Lelaki) │ —       │ -500    │ 7,700  │ LOT-99A (SA) │
│ 12/02/2026 │ IND/ETD/089      │ Unit Kecemasan ETD   │ —       │ -1,200  │ 6,500  │ LOT-99A (SA) │
│ 20/02/2026 │ STOK-JUMPA/001   │ Pelarasan Fizikal    │ +50     │ —       │ 6,550  │ LOT-99A (SA) │
│ 28/02/2026 │ VERIFIKASI-2026  │ Verifikasi KEW.PS-14 │ [KIRAAN FIZIKAL: 6,550]│ 6,550  │ SAH (Auditor)│
└────────────┴──────────────────┴──────────────────────┴─────────┴─────────┴────────┴──────────────┘
  Dokumen ini dijana secara digital di bawah Seksyen 90A Akta Keterangan 1950.
  Disahkan oleh: ............................................ (Pegawai Farmasi Hospital Lawas)
```

---

## 3.2 Contoh Cetakan Rasmi 2: Plakad Kod QR Petak Rak ($100\text{mm} \times 70\text{mm}$)

Format kad plakad keras yang dicetak dan diselitkan pada bingkai pemegang kad di hadapan rak simpanan:

```
┌────────────────────────────────────────────────────────────────┐
│   KEMENTERIAN KESIHATAN MALAYSIA                               │
│   HOSPITAL LAWAS, SARAWAK                                      │
├────────────────────────────────┬───────────────────────────────┤
│                                │ KOD UBAT: DRG-PAR-500         │
│         ██████████████         │ KOD APPL: 5001-PHARM          │
│         ██  ██████  ██         │                               │
│         ██  ██████  ██         │ PARACETAMOL 500MG TABLET      │
│         ██████████████         │ Bentuk: Tablet | UOM: TABLET  │
│         ████  ██  ████         │                               │
│         ██  ██████  ██         │ LOKASI SIMPANAN:              │
│         ██████████████         │ Bilik A -> Rak 02 -> Petak P1 │
│                                │                               │
│   [ IMBAS UNTUK LEJAR KEW.PS-4]│ PARAS: Min 2k | Buffer 5k     │
└────────────────────────────────┴───────────────────────────────┘
```

---

## 3.3 Contoh Cetakan Rasmi 3: Lembaran Pelekat Kod QR Kotak Ubat (Grid 24 A4)

Susun atur helaian pelekat pelekat sendiri (*Self-Adhesive A4 Sticker Sheet*) untuk ditampal terus pada kotak ubat:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             HELAIAN PELEKAT KOD QR RAK UBAT (GRID 24 A4)                         │
├───────────────────────────────┬───────────────────────────────┬──────────────────────────────────┤
│ ┌───────────────────────────┐ │ ┌───────────────────────────┐ │ ┌──────────────────────────────┐ │
│ │ [QR] DRG-PAR-500          │ │ │ [QR] DRG-AMX-500          │ │ │ [QR] DRG-MET-500             │ │
│ │ Paracetamol 500mg Tab     │ │ │ Amoxicillin 500mg Cap     │ │ │ Metformin 500mg Tab          │ │
│ │ Rak: A-02-P1 | UOM: TAB   │ │ │ Rak: A-02-P2 | UOM: CAP   │ │ │ Rak: A-03-P1 | UOM: TAB      │ │
│ └───────────────────────────┘ │ └───────────────────────────┘ │ └──────────────────────────────┘ │
│ ┌───────────────────────────┐ │ ┌───────────────────────────┐ │ ┌──────────────────────────────┐ │
│ │ [QR] DRG-AML-010          │ │ │ [QR] DRG-INS-100          │ │ │ [QR] DRG-SAL-004             │ │
│ │ Amlodipine 10mg Tab       │ │ │ Human Insulin 100IU/ml    │ │ │ Salbutamol 4mg Tab           │ │
│ │ Rak: A-03-P2 | UOM: TAB   │ │ │ Rak: BILIK-SEJUK-01       │ │ │ Rak: A-04-P1 | UOM: TAB      │ │
│ └───────────────────────────┘ │ └───────────────────────────┘ │ └──────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3.4 Contoh Cetakan Rasmi 4: Sijil Verifikasi Pemeriksaan Stor KEW.PS-14

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       KERAJAAN MALAYSIA                                          │
│                                    TATACARA PENGURUSAN STOR                                      │
│                                           KEW.PS-14                                              │
│                                 LAPORAN PEMERIKSAAN STOK TAHUNAN                                 │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Nama Stor       : Stor Utama Farmasi Hospital Lawas     Tarikh Pemeriksaan : 15 Ogos 2026        │
│ Pegawai Pemeriksa: Dr. Ahmad Faizal bin Kassim          Jawatan            : Pegawai Perubatan   │
├─────┬─────────────┬─────────────────────┬─────────┬─────────┬──────────┬──────────┬──────────────┤
│ Bil │ Kod Barang  │ Perihal Stok        │ Rekod   │ Fizikal │ Variance │ Status   │ Justifikasi  │
├─────┼─────────────┼─────────────────────┼─────────┼─────────┼──────────┼──────────┼──────────────┤
│ 1.  │ DRG-PAR-500 │ Paracetamol 500mg   │ 6,550   │ 6,550   │ 0        │ Sama     │ Baki tepat   │
│ 2.  │ DRG-AMX-500 │ Amoxicillin 500mg   │ 1,200   │ 1,200   │ 0        │ Sama     │ Baki tepat   │
│ 3.  │ DRG-MET-500 │ Metformin 500mg     │ 4,000   │ 4,000   │ 0        │ Sama     │ Baki tepat   │
└─────┴─────────────┴─────────────────────┴─────────┴─────────┴──────────┴──────────┴──────────────┘
  Tandatangan Pegawai Pemeriksa: .................................... Tarikh: 15/08/2026
```

---

# BAB 4: DIREKTORI LENGKAP SEMUA BUTANG, MODAL & TINDAKAN SISTEM (ZERO ASSUMPTIONS)

---

## 4.1 Butang di Halaman Ringkasan Dashboard (`InventoryOverviewPage.tsx`)

| Nama Butang | Lokasi Skrin | Ikon & Warna | Tindakan Apabila Ditekan | Modal / Fungsi Terbuka |
| :--- | :--- | :--- | :--- | :--- |
| **`[📷 Pengimbas Pergerakan]`** | Sudut Kanan Atas | `Camera` (Slate) | Menavigasi ke `StockMovementScannerPage`. | Membuka kamera pengimbas pergerakan stok live. |
| **`[📖 Lejar KEW.PS-4]`** | Sudut Kanan Atas | `FileText` (Slate) | Menavigasi ke `KewPs4LedgerPage`. | Membuka lejar kad petak digital. |
| **Kad `[Jumlah Item]`** | Baris Kad Metrik 1 | `Package` (Kelabu) | Menapis senarai semua ubat & bukan ubat aktif. | Memaparkan 1,800+ item. |
| **Kad `[Stok Kurang]`** | Baris Kad Metrik 2 | `AlertTriangle` (Kuning) | Menapis item di bawah paras pesanan menokok. | Memaparkan senarai pesanan indent mendesak. |
| **Kad `[Hampir Luput]`** | Baris Kad Metrik 3 | `Clock` (Merah) | Menapis kelompok ubat yang akan luput $\le 180$ hari. | Membuka halaman kawalan luput. |
| **Kad `[Stok Perlahan]`** | Baris Kad Metrik 4 | `AlertCircle` (Indigo) | Menapis item tanpa pergerakan 90 hari lepas. | Membuka analisis baki bulan stok (MOS). |
| **Kad `[Penggunaan Tinggi]`** | Baris Kad Metrik 5 | `TrendingUp` (Hijau) | Menapis item dengan kadar pengeluaran tertinggi. | Memaparkan ubat *fast-moving*. |
| **Tab `[Semua / Ubat / Bukan Ubat]`** | Baris Tab Penapis | Tab Teks | Menukar paparan jadual inventori serta-merta. | Penapisan masa-nyata jadual. |
| **`[Buka Kad Petak KEW.PS-4]`** | Baris Jadual (Hujung Kanan) | `ArrowRight` (Biru) | Membuka lejar khusus bagi ubat pada baris tersebut. | Menavigasi terus ke lejar KEW.PS-4 item berkenaan. |

---

## 4.2 Butang Toolbar Lejar KEW.PS-4 (`KewPs4LedgerPage.tsx`)

| Nama Butang | Lokasi Skrin | Ikon & Warna | Modal Yang Terbuka & Medan Form | Kesan Pangkalan Data |
| :--- | :--- | :--- | :--- | :--- |
| **`+ Terima`** | Palang Butang Kiri | `PlusCircle` (🟢 Emerald) | **Modal Penerimaan:** No LPO, Pembekal, Batch No, Mfg Date, Expiry Date, Kuantiti, Kos, Lokasi Rak. | Baki naik (+), kelompok dicipta, transaksi `receipt` direkod. |
| **`- Keluar`** | Palang Butang Kiri | `MinusCircle` (🔴 Rose) | **Modal Pengeluaran (FEFO):** Saranan Kelompok Luput Terdekat, Wad/Destinasi, No Indent, Kuantiti. | Baki tolak (-), transaksi `issue` direkod (disekat jika baki tak cukup). |
| **`Store Verification`** | Palang Butang Kanan | `ShieldCheck` (🟢 Emerald) | **Modal KEW.PS-14:** Baki Sistem, Kiraan Fizikal, Pengiraan Variance, Nama & Jawatan Pemeriksa. | Rekod dikunci ke `pharmacy_store_verifications`. |
| **`Check & Found`** | Palang Butang Kanan | `ClipboardCheck` (⚪ Slate) | **Modal Stok Jumpa:** Kuantiti Jumpa, Batch No, Tarikh Luput, Justifikasi Lebihan. | Baki diselaraskan (`adjust_in`), transaksi rujukan `STOK-JUMPA`. |
| **`Bring Forward`** | Palang Butang Kanan | `FastForward` (⚪ Slate) | **Modal Tutup Buku:** Tahun Asal, Baki Akhir Ditutup, Tahun Baharu. | Menutup lejar lama & membuka baris `Baki Bawa Ke Hadapan`. |
| **`Set Semula Ledger`** | Palang Butang Kanan | `Lock` (🟠 Amber) | **Modal Reset Transaksi:** Kata Laluan Pentadbir & Pengesahan Pemadaman. | Transaksi dipadam & dicatat ke `resetAuditLogs`. |
| **`Cetak KEW.PS-4`** | Palang Atas Kanan | `Printer` (🟢 Teal) | **Pratonton Cetakan Berkanun:** Format rasmi Jata Negara MOF, Bahagian A & B sedia cetak. | Menjana fail PDF / cetakan fizikal. |
| **`Tag QR Petak`** | Palang Atas Kanan | `QrCode` (⚪ Slate) | **Modal Plakad QR:** Penjanaan kad rak standard $100\text{mm} \times 70\text{mm}$. | Menjana fail cetakan plakad QR ubat. |
| **`Kemaskini Lokasi & Paras`**| Bahagian A (Atas) | `Pencil` (⚪ Slate) | **Modal Kemaskini:** Pindaan lokasi rak, paras minimum, maksimum, dan pesanan menokok. | Mengemas kini data di jadual `drugs` / `non_drugs`. |

---

## 4.3 Butang di Halaman Pengimbas QR (`StockMovementScannerPage.tsx`)

| Nama Butang | Lokasi Skrin | Ikon & Warna | Tindakan Apabila Ditekan | Kesan Sistem |
| :--- | :--- | :--- | :--- | :--- |
| **`[Guna Kamera Live]`** | Tab Mod Pengimbas | `Camera` (Biru) | Mengaktifkan aliran kamera video peranti (*jsQR*). | Mengimbas kod QR rak secara live. |
| **`[Input Barcode Manual]`** | Tab Mod Pengimbas | `Keyboard` (Kelabu) | Membuka kotak carian kod ubat secara manual. | Mengelakkan gangguan jika pelekat QR kotor/rosak. |
| **Tab `[Penerimaan Stok]`** | Tab Operasi Transaksi | `ArrowDownCircle` (Hijau) | Menukar borang ke mod terimaan ubat dari pembekal. | Memaparkan medan LPO, Kos, Kelompok. |
| **Tab `[Pengeluaran Stok]`** | Tab Operasi Transaksi | `ArrowUpCircle` (Biru) | Menukar borang ke mod pengeluaran ubat ke wad (FEFO). | Memaparkan pilihan kelompok & wad pemohon. |
| **`[Terima & Simpan Stok]`** | Butang Utama Bawah | `CheckCircle2` (Hijau Besar) | Mengunci transaksi penerimaan ke pangkalan data. | Mengeluarkan bunyi chime dwiton & menambah baki. |
| **`[Keluarkan Stok]`** | Butang Utama Bawah | `CheckCircle2` (Biru Besar) | Mengunci transaksi pengeluaran ke pangkalan data. | Menolak baki kelompok & mengeluarkan audio chime. |

---

## 4.4 Butang di Halaman Katalog Induk Ubat (`DrugInventoryPage.tsx`)

| Nama Butang | Lokasi Skrin | Ikon & Warna | Tindakan Apabila Ditekan | Kesan Sistem |
| :--- | :--- | :--- | :--- | :--- |
| **`[+ Tambah Ubat Baharu]`** | Sudut Kanan Atas | `Plus` (Biru) | Membuka modal pendaftaran ubat baharu. | Menambah ubat ke jadual `drugs`. |
| **`[✏️ Edit]`** | Baris Ubat (Kanan) | `Pencil` (Kuning) | Membuka modal suntingan ubat. | Mengemas kini harga siling, pembekal & buffer. |
| **`[🏷️ Jana Tag Kod QR]`** | Baris Ubat (Kanan) | `QrCode` (Ungu) | Menjana helaian pelekat kod QR sedia cetak (Grid 24 A4). | Menghasilkan dokumen cetakan pelekat kotak ubat. |
| **`[📦 Papar Batches]`** | Baris Ubat (Kanan) | `Layers` (Teal) | Membuka laci pecahan baki setiap kelompok aktif. | Memaparkan baki kuantiti & tarikh luput setiap batch. |
| **`[⬇️ Eksport Senarai]`** | Sudut Kanan Atas | `Download` (Hijau) | Memuat turun direktori ubat ke format Excel / CSV. | Menghasilkan fail Microsoft Excel (.xlsx). |

---

## 4.5 Butang di Halaman Kawalan Stok Hampir Luput (`NearExpiryPage.tsx`)

| Nama Butang | Lokasi Skrin | Ikon & Warna | Tindakan Apabila Ditekan | Kesan Sistem |
| :--- | :--- | :--- | :--- | :--- |
| **`[🛡️ Kuarantin Kelompok]`** | Baris Kelompok | `ShieldAlert` (Kuning) | Menukar status kelompok kepada `quarantine`. | Menyekat pengeluaran ubat di kaunter farmasi. |
| **`[🚚 Pindah ke Wad Penggunaan Tinggi]`** | Baris Kelompok | `Truck` (Biru) | Memulakan pemindahan stok ke wad berkeperluan tinggi. | Memindahkan baki ke lokasi wad aktif (ETD/ICU). |
| **`[📋 Cadang Pelupusan]`** | Baris Kelompok | `FileCheck` (Merah) | Menyenaraikan ubat luput untuk borang KEW.PS-19. | Menyediakan laporan pelupusan untuk JKPAK. |

---

# BAB 5: SENIBINA DATA, FORMULA MATEMATIK & INVARIAN KESELAMATAN

### 5.1 Algoritma FEFO (First-Expiry, First-Out)
$$\text{ORDER BY } \text{expiry\_date ASC, } \text{received\_date ASC}$$
Kelompok ubat yang mempunyai tarikh luput paling awal akan sentiasa dipilih secara automatik oleh sistem bagi sebarang transaksi pengeluaran.

### 5.2 Formula Purata Penggunaan Bulanan (AMC) & Baki Bulan Stok (MOS)
$$\text{AMC (Average Monthly Consumption)} = \frac{\text{Jumlah Pengeluaran dalam Tempoh 90 Hari}}{3}$$

$$\text{MOS (Months of Stock)} = \frac{\text{Baki Kuantiti Fizikal Semasa}}{\text{AMC}}$$

* **Klasifikasi Tindakan Sistem:**
  * $\text{MOS} < 1.0 \text{ Bulan}$ $\longrightarrow$ **Stok Rendah / Kritikal** (Pesanan segera).
  * $1.0 \le \text{MOS} \le 3.0 \text{ Bulan}$ $\longrightarrow$ **Paras Stok Optimum** (Operasi normal).
  * $\text{MOS} > 6.0 \text{ Bulan}$ $\longrightarrow$ **Stok Perlahan / Berlebihan** (Kurangkan pesanan / cadang pemindahan stok).

### 5.3 Tiga (3) Invarian Keselamatan Mutlak
1. **Strict Double-Entry:** Setiap pergerakan stok mesti mempunyai rekod berkembar di dalam `pharmacy_stock_transactions`.
2. **Kalis Baki Negatif:** $\text{quantity\_on\_hand} \ge \text{quantity\_to\_issue}$.
3. **Mandatori FEFO:** Tiada kelompok baharu boleh dikeluarkan jika kelompok lama masih belum habis tempoh penggunaan melainkan dengan justifikasi khas.

---

# BAB 6: PANDUAN MENGHADAPI AUDIT & SOALAN LAZIM (FAQ)

| No | Masalah / Soalan | Punca Masalah | Tindakan Penyelesaian Langkah Demi Langkah |
| :---: | :--- | :--- | :--- |
| **1** | **Baki sistem tidak sama dengan baki fizikal di rak.** | Salah kira, pulangan wad tidak direkod, atau kesilapan pengeluaran. | 1. Buka lejar KEW.PS-4 ubat berkenaan.<br>2. Klik butang **`[Check & Found]`** jika fizikal lebih, atau laksanakan **`[Store Verification]`**.<br>3. Masukkan angka kiraan fizikal dan catatkan justifikasi perbezaan. |
| **2** | **Kamera pengimbas QR tidak mahu terbuka.** | Sekatan kebenaran pelayar web (*Camera Permission Blocked*). | 1. Klik ikon kunci/kamera di sebelah bar alamat URL pelayar web.<br>2. Pilih **Allow Camera**.<br>3. Muat semula halaman (*Refresh / F5*) atau gunakan Tab **`[Input Barcode Manual]`**.<br> |
| **3** | **Tersalah kunci masuk kuantiti terimaan stok (LPO).** | Kesilapan menaip angka kuantiti. | 1. Buka lejar KEW.PS-4 ubat berkenaan.<br>2. Klik ikon pensil **`[Edit Transaksi]`** pada baris transaksi yang tersilap.<br>3. Masukkan kuantiti yang betul berserta catatan pembetulan (direkodkan dalam jejak audit). |
| **4** | **Sistem menyekat pengeluaran ubat (Ralat Baki Tidak Mencukupi).** | Kuantiti diminta melebihi baki fizikal kelompok terpilih. | 1. Semak baki kelompok di dalam **Laci Batches**.<br>2. Pilih kelompok tambahan atau gunakan mod **Multi-Batch FEFO Allocation** untuk membekalkan pesanan daripada dua kelompok berbeza. |
| **5** | **Ubat telah tamat tempoh dan tidak boleh dikeluarkan.** | Kelompok melepasi tarikh luput (*Expired*). | 1. Buka halaman **Kawalan Luput** (`/pharmacy/inventory/near-expiry`).<br>2. Klik **`[Kuarantin Kelompok]`** bagi mengasingkan ubat secara fizikal.<br>3. Klik **`[Cadang Pelupusan (KEW.PS-19)]`** untuk proses pelupusan berkanun. |

---

*Manual pengguna ini merupakan dokumen panduan rasmi dan komprehensif bagi modul MyInventory di bawah platform Hospital Operation Management Ecosystem (HOME).*
