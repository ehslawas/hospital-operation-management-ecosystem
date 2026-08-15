import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'en' | 'ms'

export interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  t: (key: string, fallback?: string) => string
}

// Enterprise-grade translation dictionary for H.O.M.E. system
const dictionary: Record<string, Record<Language, string>> = {
  // System Branding & Headers
  'system.title': { en: 'H.O.M.E.', ms: 'H.O.M.E.' },
  'system.subtitle': { en: 'Hospital Operation & Management Ecosystem', ms: 'Ekosistem Pengurusan & Operasi Hospital' },
  'system.ministry': { en: 'MINISTRY OF HEALTH MALAYSIA', ms: 'KEMENTERIAN KESIHATAN MALAYSIA' },
  'system.portal': { en: 'MyInventory Ecosystem Portal', ms: 'Portal Ekosistem MyInventory' },
  'system.facility': { en: 'MOH Health Facility', ms: 'Fasiliti Kesihatan KKM' },

  // Navigation & Header Badges
  'nav.dashboard': { en: 'Dashboard', ms: 'Papan Pemuka' },
  'nav.administration': { en: 'Administration', ms: 'Pentadbiran' },
  'nav.system_admin': { en: 'System Administration', ms: 'Pentadbiran Sistem' },
  'nav.hospital_admin': { en: 'Hospital Administration', ms: 'Pentadbiran Hospital' },
  'nav.module': { en: 'Module', ms: 'Modul' },
  'nav.role': { en: 'Role', ms: 'Peranan' },
  'nav.home': { en: 'Home', ms: 'Utama' },
  'nav.profile': { en: 'Profile', ms: 'Profil' },
  'nav.logout': { en: 'Logout', ms: 'Log Keluar' },
  'nav.login': { en: 'Login', ms: 'Log Masuk' },
  'nav.settings': { en: 'Settings', ms: 'Tetapan' },
  'nav.notifications': { en: 'Notifications', ms: 'Pemberitahuan' },
  'nav.search': { en: 'Search', ms: 'Carian' },

  // Sidebar Modules & Links
  'sidebar.mymsds': { en: 'MyMSDS', ms: 'MyMSDS' },
  'sidebar.mymsds.directory': { en: 'MSDS Directory', ms: 'Direktori MSDS' },
  'sidebar.mymsds.emergency': { en: 'Emergency Procedures', ms: 'Prosedur Kecemasan' },

  'sidebar.mykunci': { en: 'MyKunci', ms: 'MyKunci' },
  'sidebar.mykunci.register': { en: 'Key Register', ms: 'Daftar Kunci' },
  'sidebar.mykunci.log': { en: 'Movement Log', ms: 'Log Pergerakan' },
  'sidebar.mykunci.audit': { en: 'Monthly Verification', ms: 'Verifikasi Bulanan' },
  'sidebar.mykunci.policy': { en: 'MOH Key Policy', ms: 'Polisi Kunci KKM' },

  'sidebar.mytransporter': { en: 'MyTransporter', ms: 'MyTransporter' },
  'sidebar.mytransporter.new': { en: 'New Request', ms: 'Permohonan Baru' },
  'sidebar.mytransporter.slots': { en: 'Check SG Slot', ms: 'Semak Slot SG' },
  'sidebar.mytransporter.my_requests': { en: 'My Requests', ms: 'Permohonan Saya' },
  'sidebar.mytransporter.driver_panel': { en: 'Driver Panel', ms: 'Panel Pemandu' },
  'sidebar.mytransporter.admin_approval': { en: 'Admin Approvals', ms: 'Kelulusan Pentadbir' },
  'sidebar.mytransporter.vehicles': { en: 'Fleet Vehicles', ms: 'Kenderaan Fleet' },
  'sidebar.mytransporter.issues': { en: 'Driver Issues', ms: 'Aduan Pemandu' },
  'sidebar.mytransporter.movement': { en: 'Mileage & Claims', ms: 'Batu & Tuntutan' },
  'sidebar.mytransporter.roles': { en: 'Role Assignments', ms: 'Penugasan Peranan' },

  'sidebar.mycrossborder': { en: 'MyCrossBorder', ms: 'MyCrossBorder' },
  'sidebar.mycrossborder.new': { en: 'New Permit Request', ms: 'Permohonan Baru' },
  'sidebar.mycrossborder.log': { en: 'Movement Log', ms: 'Log Pergerakan' },

  'sidebar.myinventory': { en: 'MyInventory', ms: 'MyInventory' },
  'sidebar.mywarrant': { en: 'MyWarrant', ms: 'MyWarrant' },
  'sidebar.mysuhu': { en: 'MySuhu', ms: 'MySuhu' },
  'sidebar.myphis': { en: 'MyPHiS', ms: 'MyPHiS' },
  'sidebar.mycylinder': { en: 'MyCylinder', ms: 'MyCylinder' },

  // Module Titles & Descriptions (ModuleHubPage)
  'module.inventory': { en: 'MyInventory', ms: 'MyInventory' },
  'module.inventory.desc': { en: 'Hospital Inventory & Store Management', ms: 'Inventori & Pengurusan Stor Hospital' },

  'module.warrant': { en: 'MyWarrant', ms: 'MyWarrant' },
  'module.warrant.desc': { en: 'Warrant & Financial Allocation Management', ms: 'Pengurusan Waran & Peruntukan Kewangan' },

  'module.surat': { en: 'MySurat', ms: 'MySurat' },
  'module.surat.desc': { en: 'Official Correspondence & Letters', ms: 'Surat Menyurat Rasmi' },

  'module.borang': { en: 'MyBorang', ms: 'MyBorang' },
  'module.borang.desc': { en: 'Form Archives & Digital Templates', ms: 'Arkib Borang & Templat Digital' },

  'module.suhu': { en: 'MySuhu', ms: 'MySuhu' },
  'module.suhu.desc': { en: 'Cold Chain & Temperature Monitoring', ms: 'Pemantauan Suhu & Rantaian Sejuk' },

  'module.admin': { en: 'MyAdmin', ms: 'MyAdmin' },
  'module.admin.desc': { en: 'System & Hospital Administration', ms: 'Pentadbiran Sistem & Hospital' },

  'module.perolehan': { en: 'MyPerolehan', ms: 'MyPerolehan' },
  'module.perolehan.desc': { en: 'Procurement & Purchasing System', ms: 'Sistem Perolehan & Pembelian' },

  'module.gallery': { en: 'MyGallery', ms: 'MyGallery' },
  'module.gallery.desc': { en: 'Media & Event Gallery', ms: 'Galeri Media & Acara' },

  'module.memo': { en: 'MyMemo', ms: 'MyMemo' },
  'module.memo.desc': { en: 'Official Memos & Announcements', ms: 'Memo Rasmi & Hebahan' },

  'module.file': { en: 'MyFile', ms: 'MyFile' },
  'module.file.desc': { en: 'Document & File Management', ms: 'Pengurusan Dokumen & Fail' },

  'module.formulari': { en: 'MyFormulari', ms: 'MyFormulari' },
  'module.formulari.desc': { en: 'National & Hospital Drug Formulary Search', ms: 'Carian Formulari Ubat Kebangsaan & Hospital' },

  'module.porter': { en: 'MyPorter', ms: 'MyPorter' },
  'module.porter.desc': { en: 'Patient Portering & Asset Transport', ms: 'Perkhidmatan Portering Pesakit & Aset' },

  'module.transporter': { en: 'MyTransporter', ms: 'MyTransporter' },
  'module.transporter.desc': { en: 'Vehicle Fleet & Transport Management', ms: 'Pengurusan Fleet Kenderaan & Pengangkutan' },

  'module.priviledging': { en: 'MyPriviledging', ms: 'MyPriviledging' },
  'module.priviledging.desc': { en: 'Clinical Privileges & Credentialing', ms: 'Privileging & Kredensial Klinikal' },

  'module.tempahan': { en: 'MyTempahan', ms: 'MyTempahan' },
  'module.tempahan.desc': { en: 'Facility & Resource Booking System', ms: 'Sistem Tempahan Fasiliti & Sumber' },

  'module.perhimpunan': { en: 'MyPerhimpunan', ms: 'MyPerhimpunan' },
  'module.perhimpunan.desc': { en: 'Assembly & Event Management', ms: 'Pengurusan Perhimpunan & Acara' },

  'module.kunci': { en: 'MyKunci', ms: 'MyKunci' },
  'module.kunci.desc': { en: 'Key Management & Security Audit System', ms: 'Sistem Pengurusan Kunci & Audit Keselamatan' },

  'module.cuti': { en: 'MyCuti', ms: 'MyCuti' },
  'module.cuti.desc': { en: 'Staff Leave Management System', ms: 'Sistem Pengurusan Cuti Kakitangan' },

  'module.timeoff': { en: 'MyTimeOff', ms: 'MyTimeOff' },
  'module.timeoff.desc': { en: 'Time & Movement Management System', ms: 'Sistem Pengurusan Masa & Pergerakan' },

  'module.myphis': { en: 'MyPHiS', ms: 'MyPHiS' },
  'module.myphis.desc': { en: 'Pharmacy Information System Integration', ms: 'Integrasi Sistem Maklumat Farmasi' },

  'module.mymsds': { en: 'MyMSDS', ms: 'MyMSDS' },
  'module.mymsds.desc': { en: 'Material Safety Data Sheets Directory', ms: 'Direktori Helaian Data Keselamatan Bahan' },

  'module.cylinder': { en: 'MyCylinder', ms: 'MyCylinder' },
  'module.cylinder.desc': { en: 'Medical Oxygen & Cylinder Management', ms: 'Pengurusan Gas Oksigen Perubatan & Silinder' },

  // Inventory Dashboard Metrics & Labels
  'inventory.title': { en: 'Pharmacy Store Inventory (MyInventory)', ms: 'Inventori Stor Farmasi (MyInventory)' },
  'inventory.subtitle': { 
    en: 'Real-time inventory ecosystem view for drug and non-drug supplies following MOH Store Management Procedures standards.',
    ms: 'Paparan ekosistem inventori masa-nyata bagi bekalan ubat dan bukan ubat mengikut standard Tatacara Pengurusan Stor KKM.'
  },
  'inventory.qr_scan': { en: 'QR Scan & Transaction', ms: 'Imbas & Transaksi QR' },
  'inventory.drug_catalog': { en: 'Drug Catalog', ms: 'Katalog Ubat' },
  'inventory.non_drug': { en: 'Non-Drug', ms: 'Bukan Ubat' },
  'inventory.total_items': { en: 'TOTAL ITEMS', ms: 'JUMLAH ITEM' },
  'inventory.near_expiry': { en: 'NEAR EXPIRY (< 6M)', ms: 'HAMPIR LUPUT (< 6B)' },
  'inventory.low_stock': { en: 'LOW STOCK', ms: 'KURANG STOK' },
  'inventory.slow_moving': { en: 'SLOW MOVING', ms: 'LAMBAT BERGERAK' },
  'inventory.fast_moving': { en: 'FAST MOVING', ms: 'CEPAT BERGERAK' },
  'inventory.current_stock_position': { en: 'Current Stock Position', ms: 'Kedudukan Stok Semasa' },
  'inventory.search_placeholder': { en: 'Search code or name...', ms: 'Cari kod atau nama...' },

  'inventory.col_code': { en: 'CODE', ms: 'KOD' },
  'inventory.col_name': { en: 'ITEM NAME', ms: 'NAMA ITEM' },
  'inventory.col_balance': { en: 'CURRENT BALANCE', ms: 'BAKI SEMASA' },
  'inventory.col_amc': { en: 'AMC', ms: 'AMC' },
  'inventory.col_mos': { en: 'MOS', ms: 'MOS' },
  'inventory.col_status': { en: 'STATUS', ms: 'STATUS' },

  'inventory.status_in_stock': { en: 'In Stock', ms: 'Dalam Stok' },
  'inventory.status_low_stock': { en: 'Low Stock', ms: 'Kekurangan' },
  'inventory.status_critical': { en: 'Critical', ms: 'Kritikal' },
  'inventory.status_out_of_stock': { en: 'Out of Stock', ms: 'Tiada Stok' },

  'inventory.purchase_suggestions': { en: 'Purchase Suggestions', ms: 'Saranan Pembelian' },
  'inventory.urgent_action': { en: 'URGENT ACTION', ms: 'TINDAKAN SEGERA' },
  'inventory.suggested_buy': { en: 'SUGGESTED BUY', ms: 'SARAN BELI' },

  // Common UI Actions
  'action.save': { en: 'Save', ms: 'Simpan' },
  'action.cancel': { en: 'Cancel', ms: 'Batal' },
  'action.delete': { en: 'Delete', ms: 'Padam' },
  'action.edit': { en: 'Edit', ms: 'Sunting' },
  'action.create': { en: 'Create', ms: 'Cipta' },
  'action.search': { en: 'Search...', ms: 'Cari...' },
  'action.filter': { en: 'Filter', ms: 'Tapis' },
  'action.submit': { en: 'Submit', ms: 'Hantar' },
  'action.back': { en: 'Back', ms: 'Kembali' },
  'action.confirm': { en: 'Confirm', ms: 'Sahkan' },
  'action.close': { en: 'Close', ms: 'Tutup' },
  'action.export': { en: 'Export', ms: 'Eksport' },
  'action.import': { en: 'Import', ms: 'Import' },
  'action.print': { en: 'Print', ms: 'Cetak' },
  'action.view': { en: 'View', ms: 'Lihat' },
  'action.download': { en: 'Download', ms: 'Muat Turun' },
  'action.upload': { en: 'Upload', ms: 'Muat Naik' },
  'action.refresh': { en: 'Refresh', ms: 'Muat Semula' },

  // Language Controls
  'language.en': { en: 'English', ms: 'Bahasa Inggeris' },
  'language.ms': { en: 'Malay', ms: 'Bahasa Melayu' },
  'language.select': { en: 'Select Language', ms: 'Pilih Bahasa' },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always default strictly to English ('en')
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_language')
      if (saved === 'en' || saved === 'ms') {
        return saved
      }
    }
    return 'en'
  })

  useEffect(() => {
    localStorage.setItem('app_language', language)
    document.documentElement.lang = language
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ms' : 'en'))
  }

  const t = (key: string, fallback?: string): string => {
    if (dictionary[key] && dictionary[key][language]) {
      return dictionary[key][language]
    }
    if (fallback !== undefined) return fallback
    return key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (!context) {
    // Graceful fallback if component is outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: string, fallback?: string) => {
        if (dictionary[key]) return dictionary[key]['en']
        return fallback ?? key
      },
    }
  }
  return context
}
