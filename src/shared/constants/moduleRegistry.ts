/**
 * Central Module Registry for H.O.M.E. (Hospital Operation & Management Ecosystem)
 * Defines all system modules, sub-features, granular action capabilities, and role presets.
 * Designed to be future-proof: any new module added here will automatically appear in RBAC matrices and access controls.
 */

export type ActionType = 'view' | 'create' | 'edit' | 'approve' | 'delete' | 'export' | 'admin'

export interface ModuleFeatureDef {
  code: string
  name: string
  description: string
  supportedActions: ActionType[]
}

export interface ModuleDefinition {
  code: string
  name: string
  officialName: string
  category: 'clinical' | 'pharmacy' | 'logistics' | 'facility' | 'administrative' | 'support'
  routePath: string
  iconName: string
  description: string
  features: ModuleFeatureDef[]
  defaultRoles: string[]
  isCore?: boolean
}

export const ACTION_DEFINITIONS: Record<ActionType, { label: string; description: string; icon: string }> = {
  view: {
    label: 'Lihat (View)',
    description: 'Melihat papan pemuka, rekod transaksi, dan senarai maklumat',
    icon: 'Eye',
  },
  create: {
    label: 'Cipta (Create)',
    description: 'Mencipta rekod baharu, pesanan, permohonan, atau pendaftaran',
    icon: 'PlusCircle',
  },
  edit: {
    label: 'Kemaskini (Edit)',
    description: 'Mengubah suai maklumat rekod sedia ada atau mengemas kini status',
    icon: 'Edit3',
  },
  approve: {
    label: 'Kelulusan (Approve)',
    description: 'Memberi pengesahan, meluluskan permohonan, inden, atau peruntukan',
    icon: 'CheckCircle2',
  },
  delete: {
    label: 'Padam (Delete)',
    description: 'Memadam rekod atau membatalkan transaksi yang telah dimasukkan',
    icon: 'Trash2',
  },
  export: {
    label: 'Eksport (Export)',
    description: 'Memuat turun lejar rasmi (KEW.PS-4), laporan PDF, dan data Excel',
    icon: 'Download',
  },
  admin: {
    label: 'Pentadbir (Admin)',
    description: 'Mengkonfigurasi tetapan modul, had kuota, dan parameter sistem',
    icon: 'Settings',
  },
}

export const SYSTEM_MODULE_REGISTRY: ModuleDefinition[] = [
  {
    code: 'pharmacy_logistics',
    name: 'MyWarrant',
    officialName: 'Pengurusan Waran & Perolehan Farmasi',
    category: 'pharmacy',
    routePath: '/pharmacy/dashboard',
    iconName: 'Banknote',
    description: 'Pengurusan waran KKM, bajet pengurusan, perolehan LPO, dan pemantauan perbelanjaan farmasi.',
    defaultRoles: ['system_admin', 'hospital_admin', 'pharmacy_director', 'pharmacy_manager', 'pharmacist', 'pharmacy_assistant'],
    features: [
      {
        code: 'warrant_allocation',
        name: 'Peruntukan Waran & Vot',
        description: 'Pengurusan dana waran kerajaan mengikut kod aktiviti dan peruntukan.',
        supportedActions: ['view', 'create', 'edit', 'approve', 'delete', 'export', 'admin'],
      },
      {
        code: 'lpo_procurement',
        name: 'Pesanan Tempatan (LPO)',
        description: 'Penjanaan LPO, penjejakan pesanan, dan pemprosesan baucar bayaran.',
        supportedActions: ['view', 'create', 'edit', 'approve', 'delete', 'export'],
      },
      {
        code: 'supplier_contracts',
        name: 'Kontrak Pembekal & Penalti',
        description: 'Penilaian prestasi pembekal, klausa penalti kelewatan, dan rekod LOU.',
        supportedActions: ['view', 'create', 'edit', 'approve', 'delete', 'export'],
      },
      {
        code: 'financial_reports',
        name: 'Laporan Kewangan & APPL',
        description: 'Penjanaan laporan komitmen kewangan, baki vot, dan unjuran bajet.',
        supportedActions: ['view', 'export'],
      },
    ],
  },
  {
    code: 'inventory',
    name: 'MyInventory',
    officialName: 'Pengurusan Inventori & Logistik Stok',
    category: 'pharmacy',
    routePath: '/pharmacy/inventory',
    iconName: 'Package',
    description: 'Pengurusan stok ubat & bukan ubat, lejar KEW.PS-4, inden wad, dan verifikasi stok.',
    defaultRoles: ['system_admin', 'hospital_admin', 'pharmacy_director', 'pharmacy_manager', 'pharmacist', 'pharmacy_assistant', 'pharmacy_storekeeper'],
    features: [
      {
        code: 'stock_catalog',
        name: 'Katalog Ubat & Bukan Ubat',
        description: 'Pendaftaran item stok, paras simpanan min/maks, dan lokasi rak.',
        supportedActions: ['view', 'create', 'edit', 'delete', 'export'],
      },
      {
        code: 'stock_distribution',
        name: 'Pengagihan & Inden Wad',
        description: 'Penerimaan dan pemprosesan borang inden ubat daripada wad dan unit klinikal.',
        supportedActions: ['view', 'create', 'edit', 'approve', 'delete', 'export'],
      },
      {
        code: 'kewps4_ledger',
        name: 'Lejar Stok KEW.PS-4',
        description: 'Buku lejar rasmi kawalan stok kerajaan dan jejak audit pergerakan item.',
        supportedActions: ['view', 'create', 'edit', 'export'],
      },
      {
        code: 'stock_expiry_analysis',
        name: 'Analisis Luput & Verifikasi',
        description: 'Pemantauan item hampir luput, stok perlahan bergerak, dan pelupusan.',
        supportedActions: ['view', 'edit', 'approve', 'export'],
      },
    ],
  },
  {
    code: 'cylinder',
    name: 'MyCylinder',
    officialName: 'Pengurusan Silinder Oksigen Perubatan',
    category: 'pharmacy',
    routePath: '/pharmacy/oxygen',
    iconName: 'Wind',
    description: 'Kawalan silinder gas oksigen perubatan, rekod pergerakan wad, imbasan QR, dan keselamatan tangki.',
    defaultRoles: ['system_admin', 'hospital_admin', 'pharmacy_director', 'pharmacy_manager', 'pharmacist', 'pharmacy_assistant', 'pharmacy_storekeeper', 'nurse', 'assistant_medical_officer'],
    features: [
      {
        code: 'cylinder_tracking',
        name: 'Inventori & Pergerakan Silinder',
        description: 'Pendaftaran nombor siri tangki, pemantauan saiz silinder, dan status penuh/kosong.',
        supportedActions: ['view', 'create', 'edit', 'export'],
      },
      {
        code: 'cylinder_dispatch',
        name: 'Penghantaran & Pengeluaran Gas',
        description: 'Permohonan penggantian silinder oksigen ke wad dan zon kecemasan.',
        supportedActions: ['view', 'create', 'edit', 'approve', 'export'],
      },
      {
        code: 'cylinder_maintenance',
        name: 'Penyelenggaraan & Ujian Hidrostatik',
        description: 'Jadual ujian keselamatan tangki, sijil kualiti pembekal, dan pemulangan tangki.',
        supportedActions: ['view', 'create', 'edit', 'approve', 'delete', 'export'],
      },
    ],
  },
  {
    code: 'mysuhu',
    name: 'MySuhu',
    officialName: 'Pemantauan Suhu Rangkaian Sejuk (Cold Chain)',
    category: 'facility',
    routePath: '/suhu/dashboard',
    iconName: 'Thermometer',
    description: 'Pemantauan IoT suhu peti sejuk farmasi, amaran pelanggaran had suhu, dan tindakan pembetulan.',
    defaultRoles: ['system_admin', 'hospital_admin', 'pharmacy_director', 'pharmacy_manager', 'pharmacist', 'pharmacy_assistant', 'nurse'],
    features: [
      {
        code: 'temperature_logging',
        name: 'Pencatatan & Graf Suhu IoT',
        description: 'Merekod dan memantau bacaan suhu peti sejuk ubat dan vaksin secara harian.',
        supportedActions: ['view', 'create', 'edit', 'export'],
      },
      {
        code: 'breach_management',
        name: 'Log Pelanggaran Suhu & CAPA',
        description: 'Pengurusan insiden suhu terkeluar daripada julat standard (+2°C hingga +8°C).',
        supportedActions: ['view', 'create', 'edit', 'approve', 'export'],
      },
      {
        code: 'unit_configuration',
        name: 'Tetapan Ambang & Lokasi Sensor',
        description: 'Menetapkan had suhu min/maks dan pengurusan lokasi sensor peti sejuk.',
        supportedActions: ['view', 'create', 'edit', 'delete', 'admin'],
      },
    ],
  },
  {
    code: 'myformulari',
    name: 'MyFormulari',
    officialName: 'Formulari Ubat Hospital & Rujukan Klinikal',
    category: 'clinical',
    routePath: '/formulari/dashboard',
    iconName: 'BookOpen',
    description: 'Katalog formulari ubat hospital, ubat berisiko tinggi (HAM), daftar LASA, dan protokol pelarutan.',
    defaultRoles: ['system_admin', 'hospital_admin', 'pharmacy_director', 'pharmacy_manager', 'pharmacist', 'doctor', 'medical_officer', 'nurse'],
    features: [
      {
        code: 'formulari_catalog',
        name: 'Katalog Formulari & Indikasi',
        description: 'Carian nama generik ubat, kategori preskripsi (A, A*, B, C), dan sekatan klinikal.',
        supportedActions: ['view', 'create', 'edit', 'export', 'admin'],
      },
      {
        code: 'ham_lasa_registry',
        name: 'Daftar HAM & LASA / TALL-man',
        description: 'Protokol keselamatan ubat berisiko tinggi dan senarai ubat rupa/bunyi sama.',
        supportedActions: ['view', 'create', 'edit', 'delete', 'export'],
      },
      {
        code: 'dilution_protocols',
        name: 'Protokol Pelarutan IV & Garis Panduan',
        description: 'Panduan pencairan dos ubat suntikan dan garis panduan antibiotik kebangsaan.',
        supportedActions: ['view', 'create', 'edit', 'export'],
      },
    ],
  },
  {
    code: 'myperolehan',
    name: 'MyPerolehan',
    officialName: 'Sistem Perolehan & Pembangunan Hospital',
    category: 'administrative',
    routePath: '/perolehan/dashboard',
    iconName: 'ShoppingBag',
    description: 'Pengurusan perolehan bukan ubat, perbelanjaan pembangunan (P), dan bekalan pentadbiran.',
    defaultRoles: ['system_admin', 'hospital_admin', 'hospital_administrator', 'staff'],
    features: [
      {
        code: 'pengurusan_budget',
        name: 'Bajet Pengurusan (B21, B24, B27)',
        description: 'Pemantauan vot perkhidmatan, sewaan, bekalan pejabat dan bahan mentah.',
        supportedActions: ['view', 'create', 'edit', 'approve', 'delete', 'export', 'admin'],
      },
      {
        code: 'pembangunan_budget',
        name: 'Bajet Pembangunan (Projek Khas)',
        description: 'Peruntukan perolehan aset modal dan projek pembangunan fasiliti.',
        supportedActions: ['view', 'create', 'edit', 'approve', 'delete', 'export'],
      },
      {
        code: 'order_payment_tracking',
        name: 'Pesanan & Terimaan Bayaran',
        description: 'Pengurusan dokumen penerimaan barang, nota debit/kredit, dan rekod pembayaran.',
        supportedActions: ['view', 'create', 'edit', 'approve', 'export'],
      },
    ],
  },
  {
    code: 'mytransporter',
    name: 'MyTransporter',
    officialName: 'Logistik Kenderaan & Rombongan Pesakit',
    category: 'logistics',
    routePath: '/transporter/dashboard',
    iconName: 'Truck',
    description: 'Tempahan kenderaan rasmi hospital, pengurusan ambulans, pemeriksaan kenderaan, dan jadual pemandu.',
    defaultRoles: ['system_admin', 'hospital_admin', 'transport_admin', 'transport_driver', 'staff', 'nurse', 'medical_officer'],
    features: [
      {
        code: 'transport_booking',
        name: 'Permohonan & Tempahan Kenderaan',
        description: 'Borang permohonan kenderaan rasmi, rujukan pesakit, dan tugas luar.',
        supportedActions: ['view', 'create', 'edit', 'approve', 'delete', 'export'],
      },
      {
        code: 'fleet_management',
        name: 'Daftar Kenderaan & Penyelenggaraan',
        description: 'Rekod kenderaan jabatan, jadual servis, cukai jalan, dan laporan kerosakan.',
        supportedActions: ['view', 'create', 'edit', 'approve', 'delete', 'admin'],
      },
      {
        code: 'driver_panel',
        name: 'Panel Pemandu & Pemeriksaan Pre-Trip',
        description: 'Semakan harian kenderaan, log perbatuan, dan pengesahan selesai perjalanan.',
        supportedActions: ['view', 'create', 'edit', 'export'],
      },
    ],
  },
  {
    code: 'mykunci',
    name: 'MyKunci',
    officialName: 'Kawalan Anak Kunci Fizikal & Keselamatan',
    category: 'facility',
    routePath: '/kunci/dashboard',
    iconName: 'Key',
    description: 'Daftar induk kunci fizikal, rekod pinjaman/pemulangan, audit integriti sampul meterai mengikut KKM.',
    defaultRoles: ['system_admin', 'hospital_admin', 'hospital_administrator', 'staff', 'nurse', 'pharmacist'],
    features: [
      {
        code: 'key_registry',
        name: 'Daftar Induk Kunci Jabatan',
        description: 'Pendaftaran kod kunci, lokasi bilik, kategori keselamatan, dan pegawai bertanggungjawab.',
        supportedActions: ['view', 'create', 'edit', 'delete', 'export'],
      },
      {
        code: 'key_movement_log',
        name: 'Log Peminjaman & Pemulangan Kunci',
        description: 'Merekod masa keluar/masuk kunci, identiti peminjam, dan tujuan akses.',
        supportedActions: ['view', 'create', 'edit', 'export'],
      },
      {
        code: 'key_monthly_audit',
        name: 'Audit Bulanan & Pemeriksaan Meterai',
        description: 'Pemeriksaan fizikal bilangan kunci dan pengesahan status sampul meterai.',
        supportedActions: ['view', 'create', 'edit', 'approve', 'export'],
      },
    ],
  },
  {
    code: 'mystaff',
    name: 'MyStaff',
    officialName: 'Pengurusan Anggota, Kalendar & Pergerakan',
    category: 'support',
    routePath: '/staff/dashboard',
    iconName: 'Users',
    description: 'Log pergerakan tugas harian staf, kalendar jabatan, cuti anggota, dan carta organisasi.',
    defaultRoles: ['system_admin', 'hospital_admin', 'hospital_administrator', 'staff', 'nurse', 'doctor', 'medical_officer', 'pharmacist'],
    features: [
      {
        code: 'staff_movement',
        name: 'Log Pergerakan Tugas Luar',
        description: 'Merekod kehadiran kursus, mesyuarat luar, tugasan rondaan, dan aktiviti klinikal.',
        supportedActions: ['view', 'create', 'edit', 'export'],
      },
      {
        code: 'staff_leave_calendar',
        name: 'Kalendar & Jadual Cuti Jabatan',
        description: 'Paparan visual cuti rehat anggota, cuti kecemasan, dan perancangan giliran bertugas.',
        supportedActions: ['view', 'create', 'edit', 'approve', 'export'],
      },
      {
        code: 'org_chart_management',
        name: 'Carta Organisasi & Penugasan HOD',
        description: 'Hierarki carta organisasi jabatan hospital dan penetapan ketua unit.',
        supportedActions: ['view', 'create', 'edit', 'delete', 'admin'],
      },
    ],
  },
  {
    code: 'mycrossborder',
    name: 'MyCrossBorder',
    officialName: 'Rujukan & Pengiring Pesakit Sempadan',
    category: 'clinical',
    routePath: '/crossborder/dashboard',
    iconName: 'PlaneTakeoff',
    description: 'Permit pergerakan perubatan merentas sempadan, rekod pesakit rujukan, dan pasukan pengiring.',
    defaultRoles: ['system_admin', 'hospital_admin', 'doctor', 'medical_officer', 'nurse'],
    features: [
      {
        code: 'permit_application',
        name: 'Permohonan Permit Rentas Sempadan',
        description: 'Pengeluaran dokumen permit rasmi bagi pengangkutan pesakit ke luar daerah/negara.',
        supportedActions: ['view', 'create', 'edit', 'approve', 'delete', 'export'],
      },
      {
        code: 'escort_assignment',
        name: 'Pasukan Pengiring Perubatan',
        description: 'Penugasan doktor, jururawat dan pembantu pegawai perubatan mengiringi pesakit kritikal.',
        supportedActions: ['view', 'create', 'edit', 'export'],
      },
    ],
  },
  {
    code: 'myphis',
    name: 'MyPHiS',
    officialName: 'Sistem Sokongan Sandaran PHiS',
    category: 'support',
    routePath: '/hub/myphis',
    iconName: 'Server',
    description: 'Log pertukaran pita/cakera sandaran pelayan PHiS hospital dan jejak integrasi.',
    defaultRoles: ['system_admin', 'hospital_admin', 'pharmacist', 'pharmacy_assistant'],
    features: [
      {
        code: 'backup_disk_rotation',
        name: 'Pertukaran Cakera Sandaran Harian',
        description: 'Pengesyoran dan pengesahan pertukaran pita sandaran pelayan PHiS harian.',
        supportedActions: ['view', 'create', 'edit', 'export'],
      },
    ],
  },
  {
    code: 'mymsds',
    name: 'MyMSDS',
    officialName: 'Helaian Data Keselamatan Bahan Kimia',
    category: 'support',
    routePath: '/hub/mymsds',
    iconName: 'FileText',
    description: 'Arkib helaian data keselamatan bahan kimia (MSDS/CSDS) dan prosedur kecemasan tumpahan.',
    defaultRoles: ['system_admin', 'hospital_admin', 'pharmacist', 'pharmacy_assistant', 'nurse', 'staff'],
    features: [
      {
        code: 'msds_directory',
        name: 'Direktori MSDS / CSDS',
        description: 'Carian pantas bahan kimia berbahaya, piktogram risiko, dan rawatan kecemasan.',
        supportedActions: ['view', 'create', 'edit', 'export'],
      },
    ],
  },
  {
    code: 'mytempahan',
    name: 'MyTempahan',
    officialName: 'Sistem Tempahan Fasiliti & Bilik Hospital',
    category: 'facility',
    routePath: '/tempahan',
    iconName: 'CalendarDays',
    description: 'Pengurusan tempahan bilik mesyuarat, dewan seminar, auditorium, dan peralatan AV hospital.',
    defaultRoles: ['system_admin', 'hospital_admin', 'hospital_administrator', 'staff', 'nurse', 'doctor', 'medical_officer', 'pharmacist'],
    features: [
      {
        code: 'venue_booking',
        name: 'Permohonan & Tempahan Bilik',
        description: 'Borang tempahan bilik, semakan ketersediaan, dan pengesahan keperluan peralatan.',
        supportedActions: ['view', 'create', 'edit', 'delete', 'export'],
      },
      {
        code: 'booking_approval',
        name: 'Semakan & Kelulusan Tempahan',
        description: 'Panel kelulusan pentadbir bilik, pengesanan pertindihan masa, dan tawaran alternatif.',
        supportedActions: ['view', 'approve', 'edit', 'export'],
      },
      {
        code: 'room_registry',
        name: 'Direktori Fasiliti & Bilik',
        description: 'Pendaftaran fasiliti baharu, kemaskini kapasiti, dan penetapan status penyelenggaraan.',
        supportedActions: ['view', 'create', 'edit', 'delete', 'admin'],
      },
      {
        code: 'utilization_reports',
        name: 'Laporan Penggunaan Fasiliti',
        description: 'Analisis kadar penggunaan bilik, waktu puncak, dan eksport lejar rasmi.',
        supportedActions: ['view', 'export'],
      },
    ],
  },
  {
    code: 'admin',
    name: 'MyAdmin',
    officialName: 'Pusat Kawalan & Pentadbiran Sistem',
    category: 'administrative',
    routePath: '/hub/admin',
    iconName: 'ShieldAlert',
    description: 'Pusat kawalan utama keselamatan, pendaftaran anggota, matriks RBAC, dan audit log KKM.',
    defaultRoles: ['system_admin', 'hospital_admin', 'hospital_administrator'],
    isCore: true,
    features: [
      {
        code: 'user_management',
        name: 'Pengurusan Pengguna & Status Akaun',
        description: 'Mewujudkan, menyunting maklumat peribadi, dan mengaktifkan/menggantung akaun staf.',
        supportedActions: ['view', 'create', 'edit', 'delete', 'export', 'admin'],
      },
      {
        code: 'access_approvals',
        name: 'Semakan & Kelulusan Pendaftaran Staf',
        description: 'Mengesahkan permohonan pendaftaran akaun staf baharu dan menetapkan peranan awal.',
        supportedActions: ['view', 'approve', 'delete', 'export'],
      },
      {
        code: 'rbac_matrix',
        name: 'Had Kuasa & Matriks Kebenaran (RBAC)',
        description: 'Mengkonfigurasi suis kebenaran peranan, had kuasa tindakan, dan hak akses modul.',
        supportedActions: ['view', 'edit', 'export', 'admin'],
      },
      {
        code: 'department_monitoring',
        name: 'Pemantauan Struktur Jabatan Hospital',
        description: 'Mengurus senarai jabatan, menetapkan ketua jabatan (HOD), dan memantau taburan staf.',
        supportedActions: ['view', 'create', 'edit', 'delete', 'export'],
      },
      {
        code: 'audit_logs',
        name: 'Jejak Audit Keselamatan & Log Sistem',
        description: 'Rekod kekal setiap tindakan pentadbiran, percubaan log masuk, dan perubahan data.',
        supportedActions: ['view', 'export'],
      },
    ],
  },
]

/**
 * Standard Role Capability Presets for Quick Configuration in RBAC Matrix
 */
export const ROLE_CAPABILITY_PRESETS: Record<string, { label: string; description: string; actions: ActionType[] }> = {
  read_only: {
    label: 'Lihat Sahaja (Read-Only)',
    description: 'Hanya boleh melihat dashboard dan senarai rekod tanpa kebenaran mengubah data.',
    actions: ['view'],
  },
  operator: {
    label: 'Staf Operasi (Operator)',
    description: 'Boleh melihat, mencipta rekod baharu, dan mengemaskini maklumat tugasan sendiri.',
    actions: ['view', 'create', 'edit'],
  },
  supervisor: {
    label: 'Penyelia / HOD (Supervisor)',
    description: 'Boleh melihat, mencipta, mengemaskini, mengeksport laporan, dan meluluskan dokumen.',
    actions: ['view', 'create', 'edit', 'approve', 'export'],
  },
  manager: {
    label: 'Pengurus / Pelulus (Manager)',
    description: 'Had kuasa penuh pengurusan termasuk kelulusan kewangan, eksport lejar, dan pembatalan.',
    actions: ['view', 'create', 'edit', 'approve', 'delete', 'export'],
  },
  full_admin: {
    label: 'Pentadbir Penuh (Full Admin)',
    description: 'Akses penuh tanpa had merangkumi konfigurasi parameter modul dan hak pentadbiran.',
    actions: ['view', 'create', 'edit', 'approve', 'delete', 'export', 'admin'],
  },
}
