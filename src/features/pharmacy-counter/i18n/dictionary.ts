export type Language = 'en' | 'bm';

export const dictionary = {
  // Global
  'app.title': {
    en: 'Hospital Pharmacy Counter',
    bm: 'Kaunter Farmasi Hospital',
  },
  'language.toggle': {
    en: 'BM',
    bm: 'EN',
  },
  
  // Navigation
  'nav.dashboard': {
    en: 'Dashboard',
    bm: 'Papan Pemuka',
  },
  'nav.outpatient': {
    en: 'Outpatient Counter',
    bm: 'Kaunter Pesakit Luar',
  },
  'nav.inpatient': {
    en: 'Inpatient & Discharge (TTO)',
    bm: 'Kaunter Pesakit Dalam (TTO)',
  },
  'nav.vas': {
    en: 'SPUB & VAS',
    bm: 'SPUB & VAS',
  },
  'nav.clinical': {
    en: 'Clinical Touchpoints',
    bm: 'Sentuhan Klinikal',
  },
  'nav.counseling': {
    en: 'Counseling',
    bm: 'Kaunseling Ubat',
  },
  'nav.checklist': {
    en: 'Master Checklist',
    bm: 'Senarai Semak Induk',
  },
  'nav.quality': {
    en: 'Quality & Safety',
    bm: 'Kualiti & Keselamatan',
  },
  'nav.inventory': {
    en: 'Inventory & DD',
    bm: 'Inventori & Ubat Terkawal',
  },
  'nav.queue': {
    en: 'Queue & Appointments',
    bm: 'Giliran & Temujanji',
  },
  'nav.settings': {
    en: 'Settings',
    bm: 'Tetapan',
  },
  'nav.help': {
    en: 'Help',
    bm: 'Bantuan',
  },

  // Common Terms
  'common.search': {
    en: 'Search',
    bm: 'Cari',
  },
  'common.filter': {
    en: 'Filter',
    bm: 'Tapis',
  },
  'common.export': {
    en: 'Export',
    bm: 'Eksport',
  },
  'common.print': {
    en: 'Print',
    bm: 'Cetak',
  },
  'common.save': {
    en: 'Save',
    bm: 'Simpan',
  },
  'common.cancel': {
    en: 'Cancel',
    bm: 'Batal',
  },
  'common.submit': {
    en: 'Submit',
    bm: 'Hantar',
  },
  'common.edit': {
    en: 'Edit',
    bm: 'Ubah',
  },
  'common.delete': {
    en: 'Delete',
    bm: 'Padam',
  },
  'common.view': {
    en: 'View',
    bm: 'Lihat',
  },
  'common.back': {
    en: 'Back',
    bm: 'Kembali',
  },
  'common.next': {
    en: 'Next',
    bm: 'Seterusnya',
  },
  'common.confirm': {
    en: 'Confirm',
    bm: 'Sahkan',
  },
  'common.loading': {
    en: 'Loading...',
    bm: 'Memuatkan...',
  },

  // Pharmacy Terms
  'pharmacy.appointment': {
    en: 'Pharmacy Appointment',
    bm: 'Temujanji Farmasi',
  },
  'pharmacy.outpatient': {
    en: 'Outpatient Pharmacy Counter',
    bm: 'Kaunter Farmasi Pesakit Luar',
  },
  'pharmacy.inpatient': {
    en: 'Inpatient Counter (TTO)',
    bm: 'Kaunter Pesakit Dalam (TTO)',
  },
  'pharmacy.dangerous.drugs': {
    en: 'Dangerous Drugs',
    bm: 'Ubat Terkawal (DD)',
  },
  'pharmacy.psychotropic': {
    en: 'Psychotropic',
    bm: 'Psikotropik',
  },
  'pharmacy.cold.chain': {
    en: 'Cold Chain',
    bm: 'Rantaian Sejuk',
  },
  'pharmacy.lasa': {
    en: 'Look-Alike Sound-Alike (LASA)',
    bm: 'Amaran Kelihatan Serupa / Bunyi Serupa (LASA)',
  },
  'pharmacy.counseling': {
    en: 'Medication Counseling',
    bm: 'Kaunseling Ubat',
  },

  // VAS Services
  'vas.spub': {
    en: 'SPUB (Integrated Dispensing System)',
    bm: 'SPUB (Sistem Pendispensan Ubat Bersepadu)',
  },
  'vas.drive.through': {
    en: 'Drive-Through Pharmacy',
    bm: 'Farmasi Pandu Lalu',
  },
  'vas.ump': {
    en: 'UMP (Medication by Post)',
    bm: 'UMP (Ubat Melalui Pos)',
  },
  'vas.locker': {
    en: 'Locker4U',
    bm: 'Locker4U',
  },
  'vas.appointment.system': {
    en: 'Pharmacy Appointment System',
    bm: 'Sistem Temujanji Farmasi',
  },

  // MTAC Clinics
  'mtac.dmtac': {
    en: 'DMTAC (Diabetes)',
    bm: 'DMTAC (Kencing Manis)',
  },
  'mtac.wmtac': {
    en: 'WMTAC (Warfarin)',
    bm: 'WMTAC (Warfarin)',
  },
  'mtac.respiratory': {
    en: 'Respiratory Clinic',
    bm: 'Klinik Respiratori',
  },
  'mtac.nephrology': {
    en: 'Nephrology Clinic',
    bm: 'Klinik Nefrologi',
  },
  'mtac.cardiology': {
    en: 'Cardiology Clinic',
    bm: 'Klinik Kardiologi',
  },
  'mtac.psychiatry': {
    en: 'Psychiatry Clinic',
    bm: 'Klinik Psikiatri',
  },

  // Patient Info
  'patient.mrn': {
    en: 'MRN',
    bm: 'No. Rekod Perubatan',
  },
  'patient.nric': {
    en: 'NRIC/Passport',
    bm: 'No. KP/Pasport',
  },
  'patient.name': {
    en: 'Patient Name',
    bm: 'Nama Pesakit',
  },
  'patient.dob': {
    en: 'Date of Birth',
    bm: 'Tarikh Lahir',
  },
  'patient.age': {
    en: 'Age',
    bm: 'Umur',
  },
  'patient.gender': {
    en: 'Gender',
    bm: 'Jantina',
  },
  'patient.phone': {
    en: 'Phone Number',
    bm: 'No. Telefon',
  },
  'patient.allergies': {
    en: 'Allergies',
    bm: 'Alahan',
  },
  'patient.address': {
    en: 'Address',
    bm: 'Alamat',
  },

  // Prescription
  'prescription.number': {
    en: 'Prescription Number',
    bm: 'No. Preskripsi',
  },
  'prescription.date': {
    en: 'Prescription Date',
    bm: 'Tarikh Preskripsi',
  },
  'prescription.prescriber': {
    en: 'Prescriber',
    bm: 'Pengamal Perubatan',
  },
  'prescription.department': {
    en: 'Department',
    bm: 'Jabatan',
  },
  'prescription.status': {
    en: 'Status',
    bm: 'Status',
  },
  'prescription.screening': {
    en: 'Prescription Screening',
    bm: 'Saringan Preskripsi',
  },
  'prescription.dispensing': {
    en: 'Dispensing & Labelling',
    bm: 'Pengeluaran & Pelabelan',
  },

  // Medication
  'medication.name': {
    en: 'Medication Name',
    bm: 'Nama Ubat',
  },
  'medication.dose': {
    en: 'Dose',
    bm: 'Dos',
  },
  'medication.frequency': {
    en: 'Frequency',
    bm: 'Kekerapan',
  },
  'medication.route': {
    en: 'Route',
    bm: 'Laluan',
  },
  'medication.duration': {
    en: 'Duration',
    bm: 'Tempoh',
  },
  'medication.quantity': {
    en: 'Quantity',
    bm: 'Kuantiti',
  },
  'medication.instructions': {
    en: 'Instructions',
    bm: 'Arahan',
  },

  // Status
  'status.pending': {
    en: 'Pending',
    bm: 'Menunggu',
  },
  'status.screening': {
    en: 'Screening',
    bm: 'Saringan',
  },
  'status.verified': {
    en: 'Verified',
    bm: 'Disahkan',
  },
  'status.dispensing': {
    en: 'Dispensing',
    bm: 'Pengeluaran',
  },
  'status.ready': {
    en: 'Ready',
    bm: 'Sedia',
  },
  'status.collected': {
    en: 'Collected',
    bm: 'Diambil',
  },
  'status.completed': {
    en: 'Completed',
    bm: 'Selesai',
  },

  // Alerts & Warnings
  'alert.interaction': {
    en: 'Drug Interaction Detected',
    bm: 'Interaksi Ubat Dikesan',
  },
  'alert.allergy': {
    en: 'Allergy Alert',
    bm: 'Amaran Alahan',
  },
  'alert.duplicate': {
    en: 'Duplicate Therapy',
    bm: 'Terapi Berganda',
  },
  'alert.renal': {
    en: 'Renal Adjustment Required',
    bm: 'Penyesuaian Buah Pinggang Diperlukan',
  },
  'alert.hepatic': {
    en: 'Hepatic Adjustment Required',
    bm: 'Penyesuaian Hati Diperlukan',
  },

  // Dashboard
  'dashboard.queue.now': {
    en: 'Current Queue',
    bm: 'Bil. Pelanggan Menunggu',
  },
  'dashboard.appointments.today': {
    en: 'Today\'s Appointments',
    bm: 'Temujanji Hari Ini',
  },
  'dashboard.tto.due': {
    en: 'Discharge Due Today',
    bm: 'Pelepasan Hari Ini',
  },
  'dashboard.dd.alerts': {
    en: 'DD Reconciliation Alerts',
    bm: 'Amaran Penyesuaian DD',
  },
  'dashboard.cold.chain': {
    en: 'Cold Chain Exceptions',
    bm: 'Pengecualian Rantaian Sejuk',
  },

  // Roles
  'role.admin': {
    en: 'Admin',
    bm: 'Pentadbir',
  },
  'role.counter.pharmacist': {
    en: 'Counter Pharmacist',
    bm: 'Ahli Farmasi Kaunter',
  },
  'role.clinical.pharmacist': {
    en: 'Clinical Pharmacist',
    bm: 'Ahli Farmasi Klinikal',
  },
  'role.supervisor': {
    en: 'Supervisor',
    bm: 'Penyelia',
  },
  'role.clerk': {
    en: 'Clerk',
    bm: 'Kerani',
  },
} as const;

export type DictionaryKey = keyof typeof dictionary;

export function t(key: DictionaryKey, lang: Language): string {
  return dictionary[key][lang];
}

