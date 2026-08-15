export type ChemicalCategory =
  | 'Disinfectants & Sterilants'
  | 'Lab & Diagnostic Reagents'
  | 'Medical Gases'
  | 'Pharmaceutical Solvents'
  | 'Cleaning & Decontamination'
  | 'Staining & Histology'
  | 'Radiological Chemistry'

export type HazardClass =
  | 'Hakisan (Corrosive)'
  | 'Mudah Terbakar (Flammable)'
  | 'Toksik (Toxic)'
  | 'Biobahaya (Biohazard)'
  | 'Bahaya Kesihatan (Health Hazard)'
  | 'Pengoksida (Oxidizer)'
  | 'Gas Tertekanan (Compressed Gas)'
  | 'Kerengsaan (Irritant)'

export interface MSDSEntry {
  id: string
  name: string
  malayName: string
  casNumber: string
  chemicalFormula: string
  category: ChemicalCategory
  hazardClass: HazardClass
  subHazards: string[]
  ghsCodes: string[] // e.g. ['GHS02', 'GHS06', 'GHS08']
  ghsSignalWord: 'Bahaya' | 'Amaran'
  hazardStatements: string[]
  precautionaryStatements: string[]
  departments: string[]
  location: string
  status: 'Aktif' | 'Perlu Semakan' | 'Kritikal'
  lastUpdated: string
  expiryDate: string
  
  // Section 4: First Aid
  firstAid: {
    inhalation: string
    skinContact: string
    eyeContact: string
    ingestion: string
    symptomNote: string
    doctorNote: string
  }

  // Section 7 & 8: Storage & PPE
  handling: string
  storage: {
    temperature: string
    ventilation: string
    incompatibles: string[]
    location: string
  }
  ppeRequired: {
    respirator: string
    gloves: string
    eyeProtection: string
    bodyProtection: string
  }
  pelMalaysia: string // Permissible Exposure Limit (USECHH 2000)

  // Section 9: Physical
  physicalState: 'Pepejal' | 'Cecair' | 'Gas' | 'Aerosol'
  flashPoint: string
  boilingPoint: string
  ph: string
  appearance: string

  // Section 13-15: Regulatory & Disposal
  disposalMethod: string
  scheduledWasteCode: string // e.g. SW 411, SW 322
  regulatoryRef: string // USECHH 2000, CLASS 2013, OSHA 1994, EQA 1974
}
export const MSDS_DATABASE: MSDSEntry[] = [
  // --- Category 1: Disinfectants & Sterilants ---
  {
    id: 'MSDS-DIS-001',
    name: 'Formaldehyde Solution 37% (Formalin)',
    malayName: 'Larutan Formaldehid 37% (Formalin)',
    casNumber: '50-00-0',
    chemicalFormula: 'CH₂O',
    category: 'Disinfectants & Sterilants',
    hazardClass: 'Toksik (Toxic)',
    subHazards: ['Karsinogen 1B', 'Hakisan Kulit 1B', 'Pemekaan Respiratori'],
    ghsCodes: ['GHS05', 'GHS06', 'GHS08'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H301: Toksik jika tertelan',
      'H311: Toksik jika terkena kulit',
      'H314: Menyebabkan lecuran kulit yang parah dan kerosakan mata',
      'H330: Membawa maut jika disedut',
      'H350: Boleh menyebabkan kanser'
    ],
    precautionaryStatements: [
      'P201: Dapatkan arahan khas sebelum menggunakannya',
      'P280: Pakai sarung tangan/pakaian pelindung/perlindungan mata/muka',
      'P304+P340: JIKA DISEDUT: Pindahkan mangsa ke kawasan udara segar'
    ],
    departments: ['Makmal Patologi', 'Bilik Mayat (Mortuary)', 'CSSD'],
    location: 'Kabinet Bahan Kimia Berbahaya B-02',
    status: 'Aktif',
    lastUpdated: '2026-01-15',
    expiryDate: '2027-05-15',
    firstAid: {
      inhalation: 'Bawa mangsa ke kawasan udara segar segera. Berikan oksigen jika sukar bernafas.',
      skinContact: 'Bilas kawasan kulit terjejas dengan air mengalir selama 15 minit. Tanggalkan pakaian tercemar.',
      eyeContact: 'Bilas mata terbuka dengan air suam secara berterusan selama 20 minit dan dapatkan rawatan pakar.',
      ingestion: 'Jangan paksa muntah. Bilas mulut dengan air dan berikan 2 gelas air jika mangsa sedar.',
      symptomNote: 'Boleh menyebabkan edema pulmonari dan sesak nafas teruk.',
      doctorNote: 'Rawat secara simptomatik. Pantau fungsi pernafasan dan tahap asidosis metabolik.'
    },
    handling: 'Gunakan hanya di dalam kebuk wasap (fume hood) yang berfungsi baik. Elakkan penyedutan wap.',
    storage: {
      temperature: '15°C - 25°C',
      ventilation: 'Pengudaraan ekzos tempatan mekanikal (LEV)',
      incompatibles: ['Agen Pengoksida Strong', 'Ammonia', 'Asid Pekat', 'Alkali'],
      location: 'Kabinet Simpanan Kimia Kalis Hakisan Blok B'
    },
    ppeRequired: {
      respirator: 'Respirator Muka Penuh dengan Penapis Wap Organik / Formaldehid',
      gloves: 'Sarung Tangan Nitril Tugas Berat / Butil Rubber',
      eyeProtection: 'Gogal Kalis Percikan Kimia & Face Shield',
      bodyProtection: 'Apron Kalis Kimia (Neoprene / PVC)'
    },
    pelMalaysia: '0.3 ppm (Ceiling Limit) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: '64°C',
    boilingPoint: '96°C',
    ph: '2.8 - 4.0',
    appearance: 'Cecair jernih tanpa warna dengan bau tajam merangsang',
    disposalMethod: 'Lupuskan melalui kontraktor sisa terjadual berlesen Jabatan Alam Sekitar (JAS).',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'USECHH 2000, CLASS 2013, EQA 1974 (SW 411)'
  },
  {
    id: 'MSDS-DIS-002',
    name: 'Glutaraldehyde 2% (Cidex Solution)',
    malayName: 'Larutan Glutaraldehid 2%',
    casNumber: '111-30-8',
    chemicalFormula: 'C₅H₈O₂',
    category: 'Disinfectants & Sterilants',
    hazardClass: 'Hakisan (Corrosive)',
    subHazards: ['Pemekaan Respiratori 1', 'Toksik Akuatik Akut 1'],
    ghsCodes: ['GHS05', 'GHS06', 'GHS08', 'GHS09'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H301: Toksik jika tertelan',
      'H314: Menyebabkan lecuran kulit dan kerosakan mata',
      'H334: Boleh menyebabkan gejala alergi atau asma jika disedut',
      'H400: Sangat toksik kepada hidupan akuatik'
    ],
    precautionaryStatements: [
      'P261: Elakkan daripada menyedut debu/wasap/gas/kabut',
      'P284: Pakai perlindungan pernafasan',
      'P305+P351+P338: JIKA TERKENA MATA: Bilas berhati-hati dengan air'
    ],
    departments: ['Unit Endoskopi', 'Dewan Bedah (OT)', 'CSSD', 'Klinik Pergigian'],
    location: 'Stesen Disinfeksi Endoskop BD-04',
    status: 'Aktif',
    lastUpdated: '2026-02-10',
    expiryDate: '2027-02-14',
    firstAid: {
      inhalation: 'Bawa ke kawasan pengudaraan bersih. Berikan oksigen jika sesak dada.',
      skinContact: 'Tanggalkan pakaian dan basuh kulit terjejas dengan sabun lembut dan air yang banyak.',
      eyeContact: 'Bilas mata mengalir secara berterusan selama 15 minit.',
      ingestion: 'Minum 1-2 gelas air. Dapatkan rawatan kecemasan serta merta.',
      symptomNote: 'Merangsang membran mukus dan saluran pernafasan.',
      doctorNote: 'Nyahaktifkan dengan neutralizer glisin jika berlaku tumpahan kecil.'
    },
    handling: 'Penggunaan stesen pencucian tertutup disyorkan. Sentiasa gunakan penutup tangki.',
    storage: {
      temperature: '15°C - 30°C',
      ventilation: 'Pengudaraan bilik minima 10 pertukaran udara sejam (ACH)',
      incompatibles: ['Asid Strong', 'Alkali', 'Bahan Pengoksida'],
      location: 'Bilik Disinfeksi Peralatan Endoskop'
    },
    ppeRequired: {
      respirator: 'Respirator Separuh Muka dengan Cartridge Wap Organik',
      gloves: 'Sarung Tangan Butil / Nitril Gred Hospital',
      eyeProtection: 'Gogal Keselamatan Kalis Percikan',
      bodyProtection: 'Gown Kalis Cecair / Apron Plastik'
    },
    pelMalaysia: '0.05 ppm (Ceiling Limit) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: '71°C',
    boilingPoint: '100°C',
    ph: '3.7 - 4.5 (Aktif: 7.5 - 8.5)',
    appearance: 'Cecair jernih / sedikit kekuningan dengan bau tajam khas',
    disposalMethod: 'Neutralisasikan dengan serbuk Glisine sebelum pelupusan terurus.',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'USECHH 2000, CLASS 2013'
  },
  {
    id: 'MSDS-DIS-003',
    name: 'Hydrogen Peroxide 30% Solution',
    malayName: 'Larutan Hidrogen Peroksida 30%',
    casNumber: '7722-84-1',
    chemicalFormula: 'H₂O₂',
    category: 'Disinfectants & Sterilants',
    hazardClass: 'Pengoksida (Oxidizer)',
    subHazards: ['Hakisan Kulit 1A', 'Toksik Akut 4'],
    ghsCodes: ['GHS03', 'GHS05', 'GHS07'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H271: Boleh menyebabkan kebakaran atau letupan; pengoksida kuat',
      'H302: Memudaratkan jika tertelan',
      'H314: Menyebabkan lecuran kulit yang parah dan kerosakan mata'
    ],
    precautionaryStatements: [
      'P210: Jauhkan daripada haba/percikan api/nyalaan terbuka',
      'P220: Jauhkan daripada pakaian dan bahan mudah terbakar',
      'P280: Pakai sarung tangan/pakaian pelindung/perlindungan mata'
    ],
    departments: ['CSSD (VHP Sterilization)', 'Farmasi Reagen', 'Wad Isolasi'],
    location: 'Bilik Simpanan Bahan Pengoksida Blok A',
    status: 'Aktif',
    lastUpdated: '2026-03-01',
    expiryDate: '2028-03-01',
    firstAid: {
      inhalation: 'Pindahkan mangsa ke udara segar. Berikan pernafasan buatan jika terhenti.',
      skinContact: 'Bilas segera dengan air yang banyak. Pemutihan kulit sementara mungkin berlaku.',
      eyeContact: 'Bilas mata berterusan di stesen pencuci mata selama 20 minit.',
      ingestion: 'Jangan paksa muntah. Minum air yang banyak untuk mencairkan larutan.',
      symptomNote: 'Pebocoran atau tindak balas melepaskan gas oksigen dengan pantas.',
      doctorNote: 'Bolehkah berlaku pelecuran gastrik dan pembentukan embolisme gas.'
    },
    handling: 'Simpan dalam bekas berliang (vented cap) asli sahaja. Elakkan pencemaran.',
    storage: {
      temperature: '< 30°C',
      ventilation: 'Bilik sejuk dengan pengudaraan pengudara berterusan',
      incompatibles: ['Logam Berat', 'Bahan Organik', 'Bahan Mudah Terbakar', 'Alkali'],
      location: 'Store Bahan Pengoksida Terasing'
    },
    ppeRequired: {
      respirator: 'Respirator Wap Asid / Pengoksida jika berlaku tumpahan',
      gloves: 'Sarung Tangan PVC Tugas Berat / Vinyl',
      eyeProtection: 'Pelindung Muka Penuh & Gogal',
      bodyProtection: 'Apron Vinyl Kalis Asid/Pengoksida'
    },
    pelMalaysia: '1.0 ppm (TWA 8 jam) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '106°C',
    ph: '1.5 - 3.5',
    appearance: 'Cecair jernih tanpa warna dengan bau sengat sedikit',
    disposalMethod: 'Cairkan dengan air yang sangat banyak sebelum pelepasan terurus.',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'USECHH 2000, CLASS 2013'
  },
  {
    id: 'MSDS-DIS-004',
    name: 'Sodium Hypochlorite 5.25% (Hospital Bleach)',
    malayName: 'Natrium Hipoklorit 5.25% (Peluntur Hospital)',
    casNumber: '7681-52-9',
    chemicalFormula: 'NaClO',
    category: 'Disinfectants & Sterilants',
    hazardClass: 'Hakisan (Corrosive)',
    subHazards: ['Toksik Akuatik Akut 1'],
    ghsCodes: ['GHS05', 'GHS09'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H314: Menyebabkan lecuran kulit yang parah dan kerosakan mata',
      'H400: Sangat toksik kepada hidupan akuatik',
      'EUH031: Membebaskan gas toksik jika terkena asid'
    ],
    precautionaryStatements: [
      'P260: Jangan menyedut debu/wasap/gas/kabut/wap',
      'P273: Elakkan pelepasan bahan ke persekitaran',
      'P303+P361+P353: JIKA TERKENA KULIT: Tanggalkan pakaian tercemar segera'
    ],
    departments: ['Perkhidmatan Dobi', 'Sanitasi Hospital', 'Makmal Mikrobiologi'],
    location: 'Stesen Penyediaan Disinfektan Dobi',
    status: 'Aktif',
    lastUpdated: '2026-01-20',
    expiryDate: '2026-08-10',
    firstAid: {
      inhalation: 'Pindahkan ke kawasan udara segar. Dapatkan rawatan jika batuk/pedih tekak.',
      skinContact: 'Basuh dengan air mengalir selama 15 minit. Dapatkan rawatan jika iritasi.',
      eyeContact: 'Bilas segera di stesen eyewash selama 15 minit.',
      ingestion: 'Minum 1-2 gelas susu atau air. Jangan paksa muntah.',
      symptomNote: 'Tindak balas dengan asid membebaskan gas klorin toksik.',
      doctorNote: 'Pantau tanda-tanda kecederaan kakisan pada saluran gastrointestinal.'
    },
    handling: 'JANGAN sesekali campurkan dengan ammonia atau asid pencuci.',
    storage: {
      temperature: '15°C - 25°C',
      ventilation: 'Tempat teduh dan berudara',
      incompatibles: ['Asid Pekat', 'Ammonia', 'Logam', 'Bahan Pengurang'],
      location: 'Kabinet Simpanan Disinfektan Dobi'
    },
    ppeRequired: {
      respirator: 'Masker Respirator Gas Klorin (jika dalam ruang terkurung)',
      gloves: 'Sarung Tangan Getah Tugas Berat',
      eyeProtection: 'Gogal Keselamatan Kalis Percikan',
      bodyProtection: 'Apron PVC Kalis Cecair'
    },
    pelMalaysia: '0.5 ppm (sebagai Gas Klorin)',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '101°C',
    ph: '11.5 - 13.0',
    appearance: 'Cecair jernih kekuningan dengan bau klorin yang kuat',
    disposalMethod: 'Nyahaktifkan dengan natrium thiosulfat sebelum pelupusan sisa.',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'USECHH 2000, CLASS 2013'
  },
  {
    id: 'MSDS-DIS-005',
    name: 'Chlorhexidine Gluconate 4% Solution',
    malayName: 'Larutan Klorheksidin Glukonat 4%',
    casNumber: '18472-51-0',
    chemicalFormula: 'C₂₂H₃₀Cl₂N₁₀·2C₆H₁₂O⑺',
    category: 'Disinfectants & Sterilants',
    hazardClass: 'Kerengsaan (Irritant)',
    subHazards: ['Kerosakan Mata Berat 1', 'Toksik Akuatik Kronik 1'],
    ghsCodes: ['GHS05', 'GHS09'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H318: Menyebabkan kerosakan mata yang serius',
      'H410: Sangat toksik kepada hidupan akuatik dengan kesan jangka panjang'
    ],
    precautionaryStatements: [
      'P273: Elakkan pelepasan ke persekitaran',
      'P280: Pakai perlindungan mata/muka',
      'P305+P351+P338: JIKA TERKENA MATA: Bilas berhati-hati dengan air'
    ],
    departments: ['Dewan Bedah (Surgical Scrub)', 'ICU', 'Wad Pesakit'],
    location: 'Dispenser Antiseptik Dewan Bedah',
    status: 'Aktif',
    lastUpdated: '2026-02-28',
    expiryDate: '2028-02-28',
    firstAid: {
      inhalation: 'Bukan laluan utama. Pindahkan ke udara segar jika rasa tidak selesa.',
      skinContact: 'Bilas dengan air jika berlaku kerengsaan pada kulit sensitif.',
      eyeContact: 'Bilas mata terbuka dengan air mengalir selama 15 minit.',
      ingestion: 'Minum air yang banyak. Dapatkan nasihat doktor.',
      symptomNote: 'Bolehkah menyebabkan tindak balas anafilaksis pada individu alahan klorheksidin.',
      doctorNote: 'Rawat simptom alahan jika berlaku.'
    },
    handling: 'Elakkan hubungan langsung dengan mata dan telinga dalam (ototoksisiti).',
    storage: {
      temperature: '< 25°C',
      ventilation: 'Pengudaraan am',
      incompatibles: ['Sabun Anionik', 'Bahan Peluntur Klorin'],
      location: 'Rak Store Antiseptik Farmasi'
    },
    ppeRequired: {
      respirator: 'Tiada khas untuk kegunaan rutin',
      gloves: 'Sarung Tangan Pemeriksaan Perubatan',
      eyeProtection: 'Kaca Mata Pelindung',
      bodyProtection: 'Pakaian Seragam Hospital'
    },
    pelMalaysia: 'Tiada had PEL ditetapkan',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '100°C',
    ph: '5.5 - 7.0',
    appearance: 'Cecair jernih atau Merah Merah Jambu dengan bau wangi lembut',
    disposalMethod: 'Lupuskan mengikut sisa farmaseutikal hospital.',
    scheduledWasteCode: 'SW 405',
    regulatoryRef: 'Akta Racun 1952, CLASS 2013'
  },
  {
    id: 'MSDS-DIS-006',
    name: 'Povidone-Iodine 10% Solution (Betadine)',
    malayName: 'Larutan Povidon-Iodin 10%',
    casNumber: '25655-41-8',
    chemicalFormula: '(C₆H₉NO)n·xI',
    category: 'Disinfectants & Sterilants',
    hazardClass: 'Kerengsaan (Irritant)',
    subHazards: ['Toksik Akuatik Kronik 2'],
    ghsCodes: ['GHS07', 'GHS09'],
    ghsSignalWord: 'Amaran',
    hazardStatements: [
      'H315: Menyebabkan kerengsaan kulit',
      'H319: Menyebabkan kerengsaan mata yang serius',
      'H411: Toksik kepada hidupan akuatik dengan kesan jangka panjang'
    ],
    precautionaryStatements: [
      'P264: Basuh tangan sebersih-bersihnya selepas mengendalikan',
      'P273: Elakkan pelepasan bahan ke persekitaran',
      'P337+P313: Jika kerengsaan mata berterusan: Dapatkan nasihat doktor'
    ],
    departments: ['Kecemasan (ETD)', 'Dewan Bedah', 'Klinik Pesakit Luar'],
    location: 'Kabinet Rawatan Luka ETD',
    status: 'Aktif',
    lastUpdated: '2026-01-10',
    expiryDate: '2028-06-30',
    firstAid: {
      inhalation: 'Tidak memudaratkan secara normal.',
      skinContact: 'Basuh dengan air suam jika iritasi berlaku.',
      eyeContact: 'Bilas mata berterusan dengan air bersih selama 15 minit.',
      ingestion: 'Minum susu atau larutan kanji (starch). Dapatkan rawatan doktor.',
      symptomNote: 'Penyerap iodin sistemik boleh berlaku pada luka terbakar luas.',
      doctorNote: 'Pantau fungsi tiroid jika berlaku pajanan berlebihan.'
    },
    handling: 'Tutup rapat bekas selepas digunakan untuk mengelakkan pemeluapan iodin.',
    storage: {
      temperature: '15°C - 30°C',
      ventilation: 'Tempat kering terlindung daripada cahaya matahari',
      incompatibles: ['Bahan Pengurang', 'Logam Berat', 'Alkali'],
      location: 'Store Ubat Farmasi Wad'
    },
    ppeRequired: {
      respirator: 'Tiada perlukan',
      gloves: 'Sarung Tangan Pakai Buang',
      eyeProtection: 'Kaca Mata Pelindung',
      bodyProtection: 'Pakaian Klinikal'
    },
    pelMalaysia: '0.1 ppm (sebagai Iodin)',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '100°C',
    ph: '3.0 - 5.5',
    appearance: 'Cecair pekat coklat kemerahan dengan bau iodin khas',
    disposalMethod: 'Lupuskan melalui sisa klinikal hospital.',
    scheduledWasteCode: 'SW 405',
    regulatoryRef: 'CLASS 2013, Akta Racun 1952'
  },

  // --- Category 2: Lab & Diagnostic Reagents ---
  {
    id: 'MSDS-LAB-001',
    name: 'Xylene (Dimethylbenzene)',
    malayName: 'Xilena (Dimetilbenzena)',
    casNumber: '1330-20-7',
    chemicalFormula: 'C₈H₁₀',
    category: 'Lab & Diagnostic Reagents',
    hazardClass: 'Mudah Terbakar (Flammable)',
    subHazards: ['Toksik Akut 4', 'Kerengsaan Kulit 2', 'Toksik Pembiakan 2'],
    ghsCodes: ['GHS02', 'GHS07', 'GHS08'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H226: Cecair dan wap mudah terbakar',
      'H312: Memudaratkan jika terkena kulit',
      'H315: Menyebabkan kerengsaan kulit',
      'H332: Memudaratkan jika disedut',
      'H361d: Disyaki merosakkan janin'
    ],
    precautionaryStatements: [
      'P210: Jauhkan daripada haba/percikan api/nyalaan terbuka',
      'P280: Pakai sarung tangan pelindung/pakaian pelindung/perlindungan mata',
      'P303+P361+P353: JIKA TERKENA KULIT: Tanggalkan pakaian tercemar segera'
    ],
    departments: ['Makmal Histopatologi', 'Makmal Sitologi'],
    location: 'Bilik Simpanan Pelarut Organik Makmal A-02',
    status: 'Aktif',
    lastUpdated: '2026-02-15',
    expiryDate: '2027-12-31',
    firstAid: {
      inhalation: 'Bawa mangsa ke kawasan udara segar. Berikan oksigen jika sesak nafas.',
      skinContact: 'Basuh dengan sabun dan air yang banyak selama 15 minit.',
      eyeContact: 'Bilas mata mengalir secara berterusan selama 15 minit.',
      ingestion: 'JANGAN paksa muntah kerana risiko aspirasi paru-paru.',
      symptomNote: 'Depresi sistem saraf pusat (pusing, pening, pengsan).',
      doctorNote: 'Aspirasi boleh menyebabkan pneumonitis kimia.'
    },
    handling: 'Sentiasa gunakan dalam Kebuk Wasap Kalis Letupan (Explosion-Proof Fume Hood).',
    storage: {
      temperature: '< 25°C',
      ventilation: 'Pengudaraan LEV kalis letupan',
      incompatibles: ['Agen Pengoksida Strong', 'Asid Pekat', 'Halogen'],
      location: 'Kabinet Simpanan Cecair Mudah Terbakar (Safety Cabinet Class I)'
    },
    ppeRequired: {
      respirator: 'Respirator Wap Organik (Cartridge Coklat)',
      gloves: 'Sarung Tangan PVA (Polyvinyl Alcohol) / Viton',
      eyeProtection: 'Gogal Keselamatan Kalis Percikan',
      bodyProtection: 'Lab Coat Anti-Statik Kalis Kimia'
    },
    pelMalaysia: '100 ppm (TWA 8 jam) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: '25°C',
    boilingPoint: '138°C',
    ph: 'Bukan berair (Neutral)',
    appearance: 'Cecair jernih tanpa warna dengan bau aromatik manis khas',
    disposalMethod: 'Lupuskan melalui kontraktor sisa terjadual pelarut terhalogen/organik.',
    scheduledWasteCode: 'SW 322',
    regulatoryRef: 'USECHH 2000, CLASS 2013, EQA 1974 (SW 322)'
  },
  {
    id: 'MSDS-LAB-002',
    name: 'Acetone Reagent Grade',
    malayName: 'Aseton Gred Reagen',
    casNumber: '67-64-1',
    chemicalFormula: 'C₃H₆O',
    category: 'Lab & Diagnostic Reagents',
    hazardClass: 'Mudah Terbakar (Flammable)',
    subHazards: ['Kerengsaan Mata 2A', 'STOT SE 3 (Mengantuk)'],
    ghsCodes: ['GHS02', 'GHS07'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H225: Cecair dan wap amat mudah terbakar',
      'H319: Menyebabkan kerengsaan mata yang serius',
      'H336: Boleh menyebabkan mengantuk atau pening'
    ],
    precautionaryStatements: [
      'P210: Jauhkan daripada haba/percikan api/nyalaan terbuka',
      'P261: Elakkan menyedut wap/gas',
      'P305+P351+P338: JIKA TERKENA MATA: Bilas dengan air'
    ],
    departments: ['Makmal Patologi', 'Makmal Bio-Kimia', 'Farmasi Analitikal'],
    location: 'Kabinet Cecair Mudah Terbakar Makmal B',
    status: 'Aktif',
    lastUpdated: '2026-03-05',
    expiryDate: '2028-03-05',
    firstAid: {
      inhalation: 'Pindahkan ke udara segar. Rehatkan mangsa dalam posisi selesa.',
      skinContact: 'Basuh dengan air dan sabun. Sapu pelembap jika kulit kering.',
      eyeContact: 'Bilas mata berterusan di eyewash station selama 15 minit.',
      ingestion: 'Rinse mulut. Dapatkan rawatan perubatan jika jumlah besar tertelan.',
      symptomNote: 'Keringkan kulit akibat penyahlemakan (degreasing).',
      doctorNote: 'Rawatan sokongan.'
    },
    handling: 'Gunakan alatan tidak menghasilkan percikan (non-sparking tools).',
    storage: {
      temperature: '< 30°C',
      ventilation: 'Pengudaraan baik',
      incompatibles: ['Agen Pengoksida', 'Kloroform + Alkali', 'Asid Pekat'],
      location: 'Store Pelarut Mudah Terbakar'
    },
    ppeRequired: {
      respirator: 'Respirator Wap Organik jika pengudaraan kurang',
      gloves: 'Sarung Tangan Butil (Nitril memberikan perlindungan pendek)',
      eyeProtection: 'Kaca Mata Keselamatan',
      bodyProtection: 'Lab Coat Katun'
    },
    pelMalaysia: '500 ppm (TWA 8 jam) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: '-20°C',
    boilingPoint: '56°C',
    ph: '7.0',
    appearance: 'Cecair jernih lutsinar dengan bau manis pedas',
    disposalMethod: 'Lupuskan sebagai sisa pelarut organik bukan terhalogen.',
    scheduledWasteCode: 'SW 322',
    regulatoryRef: 'USECHH 2000, CLASS 2013'
  },
  {
    id: 'MSDS-LAB-003',
    name: 'Hydrochloric Acid 37% (Fuming HCl)',
    malayName: 'Asid Hidroklorik 37%',
    casNumber: '7647-01-0',
    chemicalFormula: 'HCl',
    category: 'Lab & Diagnostic Reagents',
    hazardClass: 'Hakisan (Corrosive)',
    subHazards: ['Toksik Akut 3 (Inhalation)', 'STOT SE 3'],
    ghsCodes: ['GHS05', 'GHS07'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H314: Menyebabkan lecuran kulit yang parah dan kerosakan mata',
      'H335: Boleh menyebabkan kerengsaan pernafasan',
      'H290: Boleh melekas logam'
    ],
    precautionaryStatements: [
      'P260: Jangan menyedut debu/wasap/gas/kabut/wap',
      'P280: Pakai sarung tangan/pakaian pelindung/perlindungan mata/muka',
      'P301+P330+P331: JIKA TERTELAN: Bilas mulut. JANGAN paksa muntah'
    ],
    departments: ['Makmal Biokimia', 'Makmal Analisis Toksikologi'],
    location: 'Kabinet Asid Pekat B-01',
    status: 'Aktif',
    lastUpdated: '2026-01-25',
    expiryDate: '2028-01-25',
    firstAid: {
      inhalation: 'Bawa mangsa ke kawasan udara segar. Dapatkan bantuan perubatan segera.',
      skinContact: 'Bilas kulit dengan air mengalir sekurang-kurangnya 20 minit.',
      eyeContact: 'Bilas mata terbuka dengan air mengalir secara berterusan selama 20 minit.',
      ingestion: 'Bilas mulut. Minum air yang banyak. JANGAN paksa muntah.',
      symptomNote: 'Hakisan teruk pada tisu pernafasan dan penghadaman.',
      doctorNote: 'Nyahaktifkan kesan asid secara perlahan. Pantau spasme larinks.'
    },
    handling: 'Sentiasa campurkan asid ke dalam air (Acid to Water), JANGAN sebaliknya.',
    storage: {
      temperature: '15°C - 25°C',
      ventilation: 'Kebuk wasap kakisan asid dengan scrubber',
      incompatibles: ['Bes Pekat', 'Logam', 'Sianida', 'Sulfida', 'Peluntur'],
      location: 'Kabinet Asid Polietilena (Polyethylene Acid Cabinet)'
    },
    ppeRequired: {
      respirator: 'Respirator Gas Asid / Mist Respirator',
      gloves: 'Sarung Tangan Neoprene / Nitril Tugas Berat',
      eyeProtection: 'Pelindung Muka Penuh & Gogal Asid',
      bodyProtection: 'Apron Rubber / PVC Asid'
    },
    pelMalaysia: '5 ppm (Ceiling Limit) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '108°C',
    ph: '< 1.0 (Asid Sangat Pekat)',
    appearance: 'Cecair jernih berwasap tajam dengan bau menyengat',
    disposalMethod: 'Neutralisasikan dengan natrium bikarbonat sebelum pelupusan terurus.',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'USECHH 2000, CLASS 2013, EQA 1974'
  },
  {
    id: 'MSDS-LAB-004',
    name: 'Sulfuric Acid 98% Concentrated',
    malayName: 'Asid Sulfurik 98% Pekat',
    casNumber: '7664-93-9',
    chemicalFormula: 'H₂SO₄',
    category: 'Lab & Diagnostic Reagents',
    hazardClass: 'Hakisan (Corrosive)',
    subHazards: ['Kerosakan Mata Berat 1', 'Karsinogen 1A (Mist)'],
    ghsCodes: ['GHS05'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H314: Menyebabkan lecuran kulit yang parah dan kerosakan mata',
      'H290: Boleh melekas logam'
    ],
    precautionaryStatements: [
      'P280: Pakai sarung tangan/pakaian pelindung/perlindungan mata',
      'P301+P330+P331: JIKA TERTELAN: Bilas mulut. JANGAN paksa muntah',
      'P305+P351+P338: JIKA TERKENA MATA: Bilas berhati-hati'
    ],
    departments: ['Makmal Kimia Klinikal', 'Stesen Pencucian Reagen'],
    location: 'Kabinet Asid Pekat B-01',
    status: 'Aktif',
    lastUpdated: '2026-02-01',
    expiryDate: '2028-02-01',
    firstAid: {
      inhalation: 'Alih ke udara segar. Berikan oksigen jika perlu.',
      skinContact: 'Lap asid berlebihan dengan kain kering sebelum membilas dengan air yang banyak.',
      eyeContact: 'Bilas serta merta di stesen eyewash selama 20 minit.',
      ingestion: 'Minum air atau susu. JANGAN muntahkan.',
      symptomNote: 'Tindak balas eksotermik teruk dengan air melepaskan haba tinggi.',
      doctorNote: 'Nyahhidratan tisu teruk dan nekrosis kakisan.'
    },
    handling: 'Tindak balas eksotermik kuat. Tambah asid perlahan-lahan ke dalam air.',
    storage: {
      temperature: '15°C - 25°C',
      ventilation: 'Pengudaraan kabinet asid khas',
      incompatibles: ['Bahan Organik', 'Air', 'Basa', 'Bahan Mudah Terbakar'],
      location: 'Kabinet Asid Hakisan Pekat'
    },
    ppeRequired: {
      respirator: 'Respirator Gas Asid Sulfurik / SCBA jika kecemasan',
      gloves: 'Sarung Tangan Neoprene / Butil Tugas Berat',
      eyeProtection: 'Gogal Kimia & Face Shield Lengkap',
      bodyProtection: 'Suit Asid PVC Lengkap'
    },
    pelMalaysia: '1 mg/m³ (TWA 8 jam) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '337°C',
    ph: '< 0.5',
    appearance: 'Cecair pekat likat berminyak tanpa warna',
    disposalMethod: 'Neutralisasikan secara perlahan dengan kalsium hidroksida/soda ash.',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'USECHH 2000, CLASS 2013'
  },
  {
    id: 'MSDS-LAB-005',
    name: 'Methanol Analytical Grade',
    malayName: 'Metanol Gred Analitikal',
    casNumber: '67-56-1',
    chemicalFormula: 'CH₃OH',
    category: 'Lab & Diagnostic Reagents',
    hazardClass: 'Toksik (Toxic)',
    subHazards: ['Mudah Terbakar 2', 'Toksik Akut 3 (Mata/Saraf)', 'STOT SE 1 (Kebutaan)'],
    ghsCodes: ['GHS02', 'GHS06', 'GHS08'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H225: Cecair dan wap amat mudah terbakar',
      'H301+H311+H331: Toksik jika tertelan, terkena kulit atau disedut',
      'H370: Menyebabkan kerosakan organ (saraf penglihatan / sistem saraf pusat)'
    ],
    precautionaryStatements: [
      'P210: Jauhkan daripada haba/percikan api/nyalaan terbuka',
      'P260: Jangan menyedut wap/gas',
      'P280: Pakai sarung tangan pelindung/pakaian pelindung'
    ],
    departments: ['Makmal Toksikologi', 'Makmal Farmakologi', 'Makmal Sitologi'],
    location: 'Bilik Pelarut Organik Makmal A-01',
    status: 'Aktif',
    lastUpdated: '2026-02-18',
    expiryDate: '2028-02-18',
    firstAid: {
      inhalation: 'Bawa ke udara segar. Berikan oksigen. Hubungi talian kecemasan.',
      skinContact: 'Basuh dengan air dan sabun selama 15 minit.',
      eyeContact: 'Bilas mata berterusan selama 15 minit.',
      ingestion: 'Berikan antidot Etanol (jika sedia ada) bawah arahan doktor. Hantar ke hospital serta merta.',
      symptomNote: 'Metabolisme metanol menghasilkan asid formik yang merosakkan saraf optik (kebutaan).',
      doctorNote: 'Antidot: Etanol iv atau Fomepizole. Pertimbangkan hemodialisis.'
    },
    handling: 'Tutup bekas sentiasa. Hindari daripada sebarang sumber pencetus nyalaan.',
    storage: {
      temperature: '< 25°C',
      ventilation: 'Pengudaraan Kebuk Wasap Kalis Letupan',
      incompatibles: ['Agen Pengoksida Strong', 'Logam Alkali', 'Asid Pekat'],
      location: 'Kabinet Pelarut Toksik / Mudah Terbakar'
    },
    ppeRequired: {
      respirator: 'Respirator Wap Organik',
      gloves: 'Sarung Tangan Butil / Nitril Gred Khas',
      eyeProtection: 'Gogal Keselamatan Kalis Percikan',
      bodyProtection: 'Lab Coat Anti-Statik'
    },
    pelMalaysia: '200 ppm (TWA 8 jam) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: '11°C',
    boilingPoint: '64.7°C',
    ph: 'Neutral',
    appearance: 'Cecair jernih mudah meruap dengan bau alkohol khas',
    disposalMethod: 'Lupuskan melalui kontraktor sisa berlesen bagi sisa cecair toksik.',
    scheduledWasteCode: 'SW 322',
    regulatoryRef: 'USECHH 2000, CLASS 2013, EQA 1974'
  },

  // --- Category 3: Medical Gases ---
  {
    id: 'MSDS-GAS-001',
    name: 'Medical Oxygen Gas & Liquid (LOX)',
    malayName: 'Gas & Cecair Oksigen Perubatan',
    casNumber: '7782-44-7',
    chemicalFormula: 'O₂',
    category: 'Medical Gases',
    hazardClass: 'Pengoksida (Oxidizer)',
    subHazards: ['Gas Tertekanan', 'Bahaya Cryogenic (Jika Cecair)'],
    ghsCodes: ['GHS03', 'GHS04'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H270: Boleh menyebabkan atau memburukkan kebakaran; pengoksida',
      'H280: Mengandungi gas di bawah tekanan; boleh meletup jika dipanaskan'
    ],
    precautionaryStatements: [
      'P220: Jauhkan daripada pakaian dan bahan mudah terbakar lain',
      'P244: Pastikan injap dan kelengkapan bebas daripada minyak dan gris',
      'P403: Simpan di tempat yang diudarakan dengan baik'
    ],
    departments: ['Semua Wad Hospital', 'ICU / CCU', 'Dewan Bedah', 'Unit Ambulans'],
    location: 'Tangki Utama Cryogenic & Manifold Silinder Blok B',
    status: 'Aktif',
    lastUpdated: '2026-04-10',
    expiryDate: '2029-01-01',
    firstAid: {
      inhalation: 'Tidak memudaratkan pada kepekatan normal. Elakkan penyedutan tekanan tinggi berpanjangan.',
      skinContact: 'Jika terkena cecair cryogenic (frostbite), rendam bahagian terjejas dalam air suam (38-42°C).',
      eyeContact: 'Bilas mata segera dengan air suam jika terkena percikan cryogenic.',
      ingestion: 'Bukan laluan biasa.',
      symptomNote: 'Kepekatan tinggi meningkatkan risiko kebakaran drastik.',
      doctorNote: 'Rawat frostbite jika berlaku pendedahan cecair cryogenic.'
    },
    handling: 'JANGAN guna minyak, gris, atau sebatian berasaskan petroleum pada silinder/injap.',
    storage: {
      temperature: '< 50°C',
      ventilation: 'Pengudaraan terbuka berterusan',
      incompatibles: ['Bahan Mudah Terbakar', 'Minyak / Gris', 'Gas Terbakar (Asetilena/Hidrogen)'],
      location: 'Depot Simpanan Silinder Oksigen Terpisah'
    },
    ppeRequired: {
      respirator: 'Tiada perlukan',
      gloves: 'Sarung Tangan Cryogenic Insulated (Pengendalian LOX)',
      eyeProtection: 'Pelindung Muka Penuh & Gogal',
      bodyProtection: 'Kasut Keselamatan & Pakaian Pelindung'
    },
    pelMalaysia: 'Kepekatan Udara Selamat: 19.5% - 23.5%',
    physicalState: 'Gas',
    flashPoint: 'Bukan Mudah Terbakar (Menyokong Pembakaran)',
    boilingPoint: '-183°C',
    ph: 'Tidak berkenaan',
    appearance: 'Gas tanpa warna, tanpa bau (Cecair biru pucat jika cryogenic)',
    disposalMethod: 'Lepaskan gas ke atmosfera luar yang lapang dan selamat jauh dari punca api.',
    scheduledWasteCode: 'Tiada (Gas Terkompres)',
    regulatoryRef: 'Akta Kilang dan Jentera 1967, OSHA 1994'
  },
  {
    id: 'MSDS-GAS-002',
    name: 'Nitrous Oxide (N₂O) Medical Gas',
    malayName: 'Gas Nitrus Oksida (N₂O) Perubatan',
    casNumber: '10024-97-2',
    chemicalFormula: 'N₂O',
    category: 'Medical Gases',
    hazardClass: 'Gas Tertekanan (Compressed Gas)',
    subHazards: ['Pengoksida 1', 'STOT SE 3 (Narkotik)'],
    ghsCodes: ['GHS03', 'GHS04', 'GHS07'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H270: Boleh menyebabkan kebakaran; pengoksida',
      'H280: Gas di bawah tekanan',
      'H336: Boleh menyebabkan mengantuk atau pening'
    ],
    precautionaryStatements: [
      'P220: Jauhkan daripada bahan mudah terbakar',
      'P304+P340: JIKA DISEDUT: Pindahkan mangsa ke kawasan udara segar'
    ],
    departments: ['Dewan Bedah (Anestesiologi)', 'Klinik Pergigian'],
    location: 'Manifold Gas Anestasia Blok Bedah',
    status: 'Aktif',
    lastUpdated: '2026-03-12',
    expiryDate: '2028-03-12',
    firstAid: {
      inhalation: 'Bawa ke udara segar. Berikan oksigen jika mangsa tidak sedar.',
      skinContact: 'Bilas sebarang frostbite cecair dengan air suam.',
      eyeContact: 'Bilas dengan air suam.',
      ingestion: 'Tidak terpakai.',
      symptomNote: 'Kesan euforia, pening, dan narkosis.',
      doctorNote: 'Pantau tahap ketepuan oksigen darah.'
    },
    handling: 'Gunakan sistem sisa pembuangan gas anestetik (AGSS) di dewan bedah.',
    storage: {
      temperature: '< 50°C',
      ventilation: 'Bilik manifold terasing berudara',
      incompatibles: ['Bahan Mudah Terbakar', 'Agen Pengurang'],
      location: 'Store Silinder Gas Anestetik'
    },
    ppeRequired: {
      respirator: 'Sistem Ekzos Local AGSS',
      gloves: 'Sarung Tangan Kulit / Kulit Tiruan Silinder',
      eyeProtection: 'Kaca Mata Keselamatan',
      bodyProtection: 'Kasut Keselamatan'
    },
    pelMalaysia: '50 ppm (TWA 8 jam) - USECHH 2000',
    physicalState: 'Gas',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '-88.5°C',
    ph: 'Tidak berkenaan',
    appearance: 'Gas tanpa warna dengan bau sedikit manis',
    disposalMethod: 'Pelepasan terawal melalui sistem AGSS hospital.',
    scheduledWasteCode: 'Tiada',
    regulatoryRef: 'USECHH 2000, OSHA 1994'
  },
  {
    id: 'MSDS-GAS-003',
    name: 'Ethylene Oxide 100% (EtO Sterilizing Gas)',
    malayName: 'Gas Etilena Oksida 100% (Sterilisasi)',
    casNumber: '75-21-8',
    chemicalFormula: 'C₂H₄O',
    category: 'Medical Gases',
    hazardClass: 'Toksik (Toxic)',
    subHazards: ['Gas Mudah Terbakar 1', 'Karsinogen 1B', 'Mutagen 1B', 'Toksik Pembiakan 1B'],
    ghsCodes: ['GHS02', 'GHS04', 'GHS06', 'GHS08'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H220: Gas amat mudah terbakar',
      'H331: Toksik jika disedut',
      'H340: Boleh menyebabkan kecacatan genetik',
      'H350: Boleh menyebabkan kanser',
      'H360D: Boleh merosakkan janin'
    ],
    precautionaryStatements: [
      'P201: Dapatkan arahan khas sebelum menggunakannya',
      'P210: Jauhkan daripada haba/percikan api/nyalaan terbuka',
      'P280: Pakai kelengkapan pelindung khas'
    ],
    departments: ['Unit Sterilisasi Pusat (CSSD)'],
    location: 'Bilik Pengsterilan Gas EtO Blok C',
    status: 'Perlu Semakan',
    lastUpdated: '2025-10-12',
    expiryDate: '2026-09-30',
    firstAid: {
      inhalation: 'Pindahkan mangsa dengan SCBA ke tempat selamat. Berikan pernafasan oksigen.',
      skinContact: 'Bilas kulit terjejas dengan air sejuk untuk melegakan lecuran.',
      eyeContact: 'Bilas mata terus di stesen pencuci mata selama 20 minit.',
      ingestion: 'Tidak terpakai.',
      symptomNote: 'Pengkritik karsinogenik teruk dan kerengsaan saluran pernafasan.',
      doctorNote: 'Pantau ujian darah dan pemeriksaan neurologi.'
    },
    handling: 'Pengendalian khas automatik dalam kebuk EtO tertutup sahaja.',
    storage: {
      temperature: '< 20°C',
      ventilation: 'Pengudaraan ekzos berterusan kalis letupan khas',
      incompatibles: ['Asid', 'Bes', 'Bahan Pengoksida', 'Alkohol'],
      location: 'Bilik Khas Gas Sterilisasi EtO Kalis Letupan'
    },
    ppeRequired: {
      respirator: 'Alat Pernafasan Lengkap Terbekal (SCBA) untuk pembaikan',
      gloves: 'Sarung Tangan Tugas Berat Butil',
      eyeProtection: 'Gogal Kalis Gas Lengkap',
      bodyProtection: 'Suit Kimia Hazmat Lengkap'
    },
    pelMalaysia: '1.0 ppm (TWA 8 jam) - USECHH 2000',
    physicalState: 'Gas',
    flashPoint: '-20°C',
    boilingPoint: '10.7°C',
    ph: 'Tidak berkenaan',
    appearance: 'Gas tanpa warna dengan bau eter manis pada kepekatan tinggi',
    disposalMethod: 'Melalui sistem scrubber berasaskan asid sulfurik khas EtO.',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'USECHH 2000, CLASS 2013, CIMAH 1996'
  },

  // --- Category 4: Pharmaceutical Solvents ---
  {
    id: 'MSDS-SOL-001',
    name: 'Ethanol Absolute 99.9%',
    malayName: 'Etanol Mutlak 99.9%',
    casNumber: '64-17-5',
    chemicalFormula: 'C₂H₅OH',
    category: 'Pharmaceutical Solvents',
    hazardClass: 'Mudah Terbakar (Flammable)',
    subHazards: ['Kerengsaan Mata 2'],
    ghsCodes: ['GHS02', 'GHS07'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H225: Cecair dan wap amat mudah terbakar',
      'H319: Menyebabkan kerengsaan mata yang serius'
    ],
    precautionaryStatements: [
      'P210: Jauhkan daripada haba/percikan api/nyalaan terbuka',
      'P305+P351+P338: JIKA TERKENA MATA: Bilas berhati-hati dengan air'
    ],
    departments: ['Farmasi Logistik', 'Makmal Formulasi', 'CSSD'],
    location: 'Bilik Simpanan Alkohol Utama',
    status: 'Aktif',
    lastUpdated: '2026-03-01',
    expiryDate: '2029-03-01',
    firstAid: {
      inhalation: 'Bawa ke udara segar.',
      skinContact: 'Basuh dengan air.',
      eyeContact: 'Bilas mata dengan air selama 15 minit.',
      ingestion: 'Minum air. Dapatkan rawatan jika jumlah banyak tertelan.',
      symptomNote: 'Narkosis, ketidakseimbangan motorik.',
      doctorNote: 'Rawatan simptomatik.'
    },
    handling: 'Gunakan alatan bumi pembumian (grounding/bonding) semasa pemindahan cecair.',
    storage: {
      temperature: '< 25°C',
      ventilation: 'Pengudaraan sejuk kalis letupan',
      incompatibles: ['Agen Pengoksida Strong', 'Logam Alkali', 'Peroksida'],
      location: 'Store Pelarut Mudah Terbakar Kalis Api'
    },
    ppeRequired: {
      respirator: 'Respirator Wap Organik jika pemindahan pukal',
      gloves: 'Sarung Tangan Nitril',
      eyeProtection: 'Kaca Mata Keselamatan',
      bodyProtection: 'Lab Coat Antistatik'
    },
    pelMalaysia: '1000 ppm (TWA 8 jam) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: '13°C',
    boilingPoint: '78.3°C',
    ph: '7.0',
    appearance: 'Cecair jernih tanpa warna dengan bau alkohol khas',
    disposalMethod: 'Lupuskan sebagai sisa pelarut organik bukan terhalogen.',
    scheduledWasteCode: 'SW 322',
    regulatoryRef: 'USECHH 2000, CLASS 2013'
  },
  {
    id: 'MSDS-SOL-002',
    name: 'Isopropyl Alcohol 70% (IPA)',
    malayName: 'Alkohol Isopropil 70%',
    casNumber: '67-63-0',
    chemicalFormula: 'C₃H₈O',
    category: 'Pharmaceutical Solvents',
    hazardClass: 'Mudah Terbakar (Flammable)',
    subHazards: ['Kerengsaan Mata 2A', 'STOT SE 3'],
    ghsCodes: ['GHS02', 'GHS07'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H225: Cecair dan wap amat mudah terbakar',
      'H319: Menyebabkan kerengsaan mata yang serius',
      'H336: Boleh menyebabkan mengantuk atau pening'
    ],
    precautionaryStatements: [
      'P210: Jauhkan daripada haba/percikan api/nyalaan terbuka',
      'P305+P351+P338: JIKA TERKENA MATA: Bilas berhati-hati'
    ],
    departments: ['Semua Wad', 'Farmasi Pembuatan', 'CSSD', 'Makmal'],
    location: 'Store Farmasi Logistik & Dispenser Sanitizer Wad',
    status: 'Aktif',
    lastUpdated: '2026-03-01',
    expiryDate: '2028-11-20',
    firstAid: {
      inhalation: 'Alihkan mangsa ke kawasan lapang dan segar.',
      skinContact: 'Basuh dengan air.',
      eyeContact: 'Bilas mata dengan air yang banyak selama 15 minit.',
      ingestion: 'Jangan paksa muntah. Dapatkan perhatian perubatan.',
      symptomNote: 'Pening dan mengantuk pada pajanan wap pekat.',
      doctorNote: 'Pantau tahap depressi CNS.'
    },
    handling: 'Jauhkan daripada sebarang punca nyalaan terbuka.',
    storage: {
      temperature: '< 30°C',
      ventilation: 'Pengudaraan am yang baik',
      incompatibles: ['Bahan Pengoksida Strong'],
      location: 'Store Ubat Cecair Mudah Terbakar'
    },
    ppeRequired: {
      respirator: 'Tiada khas untuk kegunaan umum',
      gloves: 'Sarung Tangan Nitril',
      eyeProtection: 'Kaca Mata Pelindung',
      bodyProtection: 'Pakaian Uniform Klinikal'
    },
    pelMalaysia: '400 ppm (TWA 8 jam) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: '12°C',
    boilingPoint: '82°C',
    ph: 'Neutral',
    appearance: 'Cecair jernih tanpa warna dengan bau isopropyl khas',
    disposalMethod: 'Lupuskan mengikut sisa pelarut berlesen.',
    scheduledWasteCode: 'SW 322',
    regulatoryRef: 'USECHH 2000, CLASS 2013'
  },

  // --- Category 5: Cleaning & Decontamination ---
  {
    id: 'MSDS-CLN-001',
    name: 'Ammonia Solution 25%',
    malayName: 'Larutan Ammonia 25%',
    casNumber: '1336-21-6',
    chemicalFormula: 'NH₄OH',
    category: 'Cleaning & Decontamination',
    hazardClass: 'Hakisan (Corrosive)',
    subHazards: ['STOT SE 3 (Performatan)', 'Toksik Akuatik Akut 1'],
    ghsCodes: ['GHS05', 'GHS07', 'GHS09'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H314: Menyebabkan lecuran kulit yang parah dan kerosakan mata',
      'H335: Boleh menyebabkan kerengsaan pernafasan',
      'H400: Sangat toksik kepada hidupan akuatik'
    ],
    precautionaryStatements: [
      'P260: Jangan menyedut wap/gas',
      'P273: Elakkan pelepasan bahan ke persekitaran',
      'P280: Pakai sarung tangan/pakaian pelindung/perlindungan mata'
    ],
    departments: ['Perkhidmatan Sanitasi & Housekeeping', 'Makmal'],
    location: 'Store Bahan Kimia Sanitasi Utama',
    status: 'Aktif',
    lastUpdated: '2026-01-30',
    expiryDate: '2027-01-30',
    firstAid: {
      inhalation: 'Pindahkan ke kawasan udara segar segera.',
      skinContact: 'Bilas dengan air mengalir selama 15 minit.',
      eyeContact: 'Bilas mata berterusan di stesen pencuci mata selama 20 minit.',
      ingestion: 'Minum air atau susu. JANGAN paksa muntah.',
      symptomNote: 'Tindak balas dengan peluntur bleach membebaskan gas kloramine toksik.',
      doctorNote: 'Pantau edema larinks dan pulmonari.'
    },
    handling: 'JANGAN sesekali dicampur dengan peluntur natrium hipoklorit (bleach).',
    storage: {
      temperature: '< 25°C',
      ventilation: 'Pengudaraan ekzos berterusan',
      incompatibles: ['Peluntur Klorin', 'Asid Pekat', 'Halogen', 'Logam Heavy'],
      location: 'Store Bahan Kimia Alkali Terpisah'
    },
    ppeRequired: {
      respirator: 'Respirator Khas Ammonia (Cartridge Hijau)',
      gloves: 'Sarung Tangan Neoprene / Rubber Tugas Berat',
      eyeProtection: 'Gogal Kalis Percikan Kimia',
      bodyProtection: 'Apron PVC Kalis Kimia'
    },
    pelMalaysia: '25 ppm (TWA 8 jam) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '38°C',
    ph: '12.0 - 13.5',
    appearance: 'Cecair jernih tanpa warna dengan bau sengat tajam bergas',
    disposalMethod: 'Neutralisasikan dengan asid cair sebelum pelupusan terurus.',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'USECHH 2000, CLASS 2013'
  },

  // --- Category 6: Staining & Histology ---
  {
    id: 'MSDS-HIS-001',
    name: 'Hematoxylin Stain Solution (Harris)',
    malayName: 'Larutan Pewarna Hematoksilin (Harris)',
    casNumber: '517-28-2',
    chemicalFormula: 'C₁₆H₁₄O₆',
    category: 'Staining & Histology',
    hazardClass: 'Kerengsaan (Irritant)',
    subHazards: ['Toksik Akut 4 (Oral)', 'Kerengsaan Mata 2'],
    ghsCodes: ['GHS07'],
    ghsSignalWord: 'Amaran',
    hazardStatements: [
      'H302: Memudaratkan jika tertelan',
      'H319: Menyebabkan kerengsaan mata yang serius'
    ],
    precautionaryStatements: [
      'P264: Basuh tangan sebersih-bersihnya selepas mengendalikan',
      'P301+P312: JIKA TERTELAN: Hubungi Pusat Racun/doktor jika tidak sihat'
    ],
    departments: ['Makmal Histopatologi', 'Makmal Sitologi'],
    location: 'Rak Pewarnaan Kebuk Wasap Histologi',
    status: 'Aktif',
    lastUpdated: '2026-02-12',
    expiryDate: '2028-02-12',
    firstAid: {
      inhalation: 'Bawa ke udara segar.',
      skinContact: 'Basuh dengan air dan sabun (pewarna stain mungkin melepaskan warna perlahan).',
      eyeContact: 'Bilas mata mengalir selama 15 minit.',
      ingestion: 'Rinse mulut dan minum air yang banyak.',
      symptomNote: 'Menyebabkan warna gelap sementara pada kulit dan mukosa.',
      doctorNote: 'Rawatan simptomatik.'
    },
    handling: 'Gunakan sarung tangan untuk mengelakkan pewarnaan pada kulit.',
    storage: {
      temperature: '15°C - 25°C',
      ventilation: 'Pengudaraan makmal am',
      incompatibles: ['Agen Pengoksida Kuat'],
      location: 'Kabinet Reagen Histologi'
    },
    ppeRequired: {
      respirator: 'Tiada perlukan secara berasingan',
      gloves: 'Sarung Tangan Nitril',
      eyeProtection: 'Kaca Mata Pelindung',
      bodyProtection: 'Lab Coat Makmal'
    },
    pelMalaysia: 'Tiada had PEL khas',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '100°C',
    ph: '2.5 - 3.5',
    appearance: 'Cecair ungu gelap kebiruan',
    disposalMethod: 'Lupuskan melalui sisa scheduled waste cecair pewarna makmal.',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'CLASS 2013, OSHA 1994'
  },
  {
    id: 'MSDS-HIS-002',
    name: 'Eosin Y Stain Solution 1%',
    malayName: 'Larutan Pewarna Eosin Y 1%',
    casNumber: '17372-87-1',
    chemicalFormula: 'C₂₀H₆Br₄Na₂O₅',
    category: 'Staining & Histology',
    hazardClass: 'Kerengsaan (Irritant)',
    subHazards: ['Kerengsaan Mata 2'],
    ghsCodes: ['GHS07'],
    ghsSignalWord: 'Amaran',
    hazardStatements: [
      'H319: Menyebabkan kerengsaan mata yang serius'
    ],
    precautionaryStatements: [
      'P280: Pakai perlindungan mata',
      'P305+P351+P338: JIKA TERKENA MATA: Bilas berhati-hati dengan air'
    ],
    departments: ['Makmal Histopatologi'],
    location: 'Rak Stesen Pewarnaan Histologi',
    status: 'Aktif',
    lastUpdated: '2026-02-12',
    expiryDate: '2028-02-12',
    firstAid: {
      inhalation: 'Bawa ke udara segar.',
      skinContact: 'Basuh dengan air dan sabun.',
      eyeContact: 'Bilas mata berterusan selama 15 minit.',
      ingestion: 'Minum air.',
      symptomNote: 'Pewarnaan merah pada kulit.',
      doctorNote: 'Tiada toksisiti khusus.'
    },
    handling: 'Elakkan percikan.',
    storage: {
      temperature: '15°C - 30°C',
      ventilation: 'Pengudaraan am',
      incompatibles: ['Asid Pekat'],
      location: 'Kabinet Reagen Histologi'
    },
    ppeRequired: {
      respirator: 'Tiada perlukan',
      gloves: 'Sarung Tangan Nitril',
      eyeProtection: 'Kaca Mata Pelindung',
      bodyProtection: 'Lab Coat'
    },
    pelMalaysia: 'Tiada had PEL',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '100°C',
    ph: '6.0 - 7.0',
    appearance: 'Cecair merah jingga berpendar fluorisen',
    disposalMethod: 'Lupuskan mengikut sisa kimia cecair makmal.',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'CLASS 2013'
  },

  // --- Category 7: Radiological Chemistry ---
  {
    id: 'MSDS-RAD-001',
    name: 'Iodinated Contrast Media (Iohexol / Omnipaque)',
    malayName: 'Media Kontras Beriodin (Iohexol)',
    casNumber: '66108-95-0',
    chemicalFormula: 'C₁₉H₂₆I₃N₃O₉',
    category: 'Radiological Chemistry',
    hazardClass: 'Kerengsaan (Irritant)',
    subHazards: ['Sensitizer Kulit / Alahan'],
    ghsCodes: ['GHS07'],
    ghsSignalWord: 'Amaran',
    hazardStatements: [
      'H317: Boleh menyebabkan tindak balas alahan kulit',
      'H335: Boleh menyebabkan kerengsaan pernafasan'
    ],
    precautionaryStatements: [
      'P261: Elakkan menyedut semburan',
      'P280: Pakai sarung tangan pelindung'
    ],
    departments: ['Jabatan Radiologi & Imbasan CT', 'Bilik Angiografi (Cath Lab)'],
    location: 'Bilik Persediaan Kontras Radiologi',
    status: 'Aktif',
    lastUpdated: '2026-03-10',
    expiryDate: '2028-03-10',
    firstAid: {
      inhalation: 'Bawa ke udara segar.',
      skinContact: 'Basuh dengan air dan sabun.',
      eyeContact: 'Bilas dengan air mengalir selama 15 minit.',
      ingestion: 'Dapatkan perhatian perubatan jika tidak sengaja tertelan.',
      symptomNote: 'Tindak balas hipersensitiviti anaphylactoid pada pesakit tertentu.',
      doctorNote: 'Sediakan suntikan Adrenalina/Antihistamin untuk kecemasan kontras.'
    },
    handling: 'Pengendalian aseptic untuk suntikan intravena.',
    storage: {
      temperature: '15°C - 30°C',
      ventilation: 'Terlindung daripada sinaran X dan cahaya matahari',
      incompatibles: ['Bahan Logam Kuat'],
      location: 'Store Ubat Kontras Radiologi'
    },
    ppeRequired: {
      respirator: 'Tiada khas',
      gloves: 'Sarung Tangan Perubatan Steril',
      eyeProtection: 'Kaca Mata Pelindung',
      bodyProtection: 'Apron Plumbum (Lead Apron untuk Radiasi) & Gown'
    },
    pelMalaysia: 'Tiada had PEL',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '100°C',
    ph: '6.8 - 7.7',
    appearance: 'Cecair jernih tidak berwarna hingga kuning pucat',
    disposalMethod: 'Lupuskan vial terpakai mengikut sisa farmaseutikal hospital.',
    scheduledWasteCode: 'SW 405',
    regulatoryRef: 'CLASS 2013, Akta Racun 1952'
  },
  {
    id: 'MSDS-DIS-007',
    name: 'Ortho-Phthalaldehyde 0.55% (Cidex OPA)',
    malayName: 'Larutan Orto-Ftalaldehid 0.55%',
    casNumber: '643-79-8',
    chemicalFormula: 'C₈H₆O₂',
    category: 'Disinfectants & Sterilants',
    hazardClass: 'Kerengsaan (Irritant)',
    subHazards: ['Pemekaan Kulit 1', 'Toksik Akuatik Akut 1'],
    ghsCodes: ['GHS07', 'GHS09'],
    ghsSignalWord: 'Amaran',
    hazardStatements: [
      'H317: Boleh menyebabkan tindak balas alahan kulit',
      'H319: Menyebabkan kerengsaan mata yang serius',
      'H400: Sangat toksik kepada hidupan akuatik'
    ],
    precautionaryStatements: [
      'P280: Pakai sarung tangan pelindung/perlindungan mata',
      'P305+P351+P338: JIKA TERKENA MATA: Bilas berhati-hati'
    ],
    departments: ['Unit Endoskopi', 'Dewan Bedah', 'CSSD'],
    location: 'Stesen Disinfeksi Endoskop Termaju BD-02',
    status: 'Aktif',
    lastUpdated: '2026-02-20',
    expiryDate: '2028-02-20',
    firstAid: {
      inhalation: 'Alih ke kawasan udara segar.',
      skinContact: 'Basuh dengan air dan sabun. Pewarnaan biru sementara pada kulit mungkin berlaku.',
      eyeContact: 'Bilas mata dengan air mengalir selama 15 minit.',
      ingestion: 'Minum air yang banyak. Dapatkan rawatan doktor.',
      symptomNote: 'Pewarnaan biru pada kulit atau pakaian jika terkena.',
      doctorNote: 'Nyahaktifkan dengan neutralizer glisin.'
    },
    handling: 'Gunakan penutup tangki rapat untuk mengelakkan penyejatan wap.',
    storage: {
      temperature: '15°C - 30°C',
      ventilation: 'Pengudaraan am yang baik (10 ACH)',
      incompatibles: ['Agen Pengoksida Strong'],
      location: 'Store Disinfektan High Level'
    },
    ppeRequired: {
      respirator: 'Masker Respirator Wap Organik jika tiada LEV',
      gloves: 'Sarung Tangan Nitril / Butil',
      eyeProtection: 'Gogal Kalis Percikan',
      bodyProtection: 'Apron Plastik Kalis Cecair'
    },
    pelMalaysia: '0.005 ppm (TWA) - OSHA CLASS 2013',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '100°C',
    ph: '6.5 - 7.5',
    appearance: 'Cecair jernih biru muda dengan bau lembut khas',
    disposalMethod: 'Neutralisasikan dengan serbuk Glisin sebelum pelupusan terurus.',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'USECHH 2000, CLASS 2013'
  },
  {
    id: 'MSDS-DIS-008',
    name: 'Peracetic Acid 15% (Disinfectant Grade)',
    malayName: 'Asid Perasetik 15%',
    casNumber: '79-21-0',
    chemicalFormula: 'CH₃CO₃H',
    category: 'Disinfectants & Sterilants',
    hazardClass: 'Hakisan (Corrosive)',
    subHazards: ['Pengoksida 2', 'Toksik Akut 4'],
    ghsCodes: ['GHS02', 'GHS05', 'GHS07', 'GHS09'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H242: Memanaskan boleh menyebabkan kebakaran',
      'H314: Menyebabkan lecuran kulit yang parah dan kerosakan mata',
      'H332: Memudaratkan jika disedut'
    ],
    precautionaryStatements: [
      'P210: Jauhkan daripada haba/percikan api/nyalaan',
      'P280: Pakai sarung tangan/pakaian pelindung/perlindungan mata'
    ],
    departments: ['CSSD (Sterilisasi Cecair)', 'Unit Hemodialisis'],
    location: 'Kabinet Asid Perasetik Blok C',
    status: 'Aktif',
    lastUpdated: '2026-03-02',
    expiryDate: '2027-09-15',
    firstAid: {
      inhalation: 'Bawa mangsa ke udara segar. Berikan oksigen jika sesak.',
      skinContact: 'Bilas dengan air mengalir selama 20 minit.',
      eyeContact: 'Bilas di stesen eyewash selama 20 minit.',
      ingestion: 'Minum air. JANGAN paksa muntah.',
      symptomNote: 'Bau cuka tajam merangsang mata dan hidung.',
      doctorNote: 'Pantau kelecuran kakisan.'
    },
    handling: 'Simpan dalam bekas berliang asli sahaja.',
    storage: {
      temperature: '< 20°C',
      ventilation: 'Pengudaraan sejuk berterusan',
      incompatibles: ['Logam Berat', 'Alkali', 'Bahan Organik'],
      location: 'Store Asid Pengoksida Terasing'
    },
    ppeRequired: {
      respirator: 'Respirator Wap Asid / SCBA',
      gloves: 'Sarung Tangan Neoprene',
      eyeProtection: 'Pelindung Muka Penuh',
      bodyProtection: 'Apron Rubber Asid'
    },
    pelMalaysia: '0.4 ppm (STEL) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: '40°C',
    boilingPoint: '105°C',
    ph: '< 1.5',
    appearance: 'Cecair jernih tanpa warna dengan bau cuka tajam menyengat',
    disposalMethod: 'Nyahaktifkan dengan larutan bisulfit sebelum pelupusan.',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'USECHH 2000, CLASS 2013'
  },
  {
    id: 'MSDS-LAB-006',
    name: 'Chloroform Reagent Grade',
    malayName: 'Kloroform Gred Reagen',
    casNumber: '67-66-3',
    chemicalFormula: 'CHCl₃',
    category: 'Lab & Diagnostic Reagents',
    hazardClass: 'Toksik (Toxic)',
    subHazards: ['Karsinogen 2', 'STOT RE 1 (Hati & Buah Pinggang)'],
    ghsCodes: ['GHS06', 'GHS08'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H302: Memudaratkan jika tertelan',
      'H331: Toksik jika disedut',
      'H351: Disyaki menyebabkan kanser',
      'H372: Menyebabkan kerosakan organ (hati, buah pinggang) melalui pendedahan berpanjangan'
    ],
    precautionaryStatements: [
      'P201: Dapatkan arahan khas sebelum menggunakannya',
      'P260: Jangan menyedut wap/gas',
      'P280: Pakai sarung tangan pelindung'
    ],
    departments: ['Makmal Toksikologi', 'Makmal Biokimia'],
    location: 'Kabinet Pelarut Terhalogen Blok A',
    status: 'Aktif',
    lastUpdated: '2026-01-18',
    expiryDate: '2028-01-18',
    firstAid: {
      inhalation: 'Bawa mangsa ke udara segar. Berikan oksigen jika perlu.',
      skinContact: 'Basuh dengan air dan sabun.',
      eyeContact: 'Bilas mata berterusan selama 15 minit.',
      ingestion: 'Minum air. JANGAN paksa muntah.',
      symptomNote: 'Kesan pembiusan (anestetik), pening, mengantuk.',
      doctorNote: 'Pantau fungsi hati dan buah pinggang.'
    },
    handling: 'Gunakan dalam kebuk wasap (fume hood) berkecekapan tinggi sahaja.',
    storage: {
      temperature: '< 25°C',
      ventilation: 'Pengudaraan ekzos LEV terhalogen',
      incompatibles: ['Basa Strong', 'Logam Alkali', 'Acetone + Base'],
      location: 'Store Pelarut Terhalogen Terpencil'
    },
    ppeRequired: {
      respirator: 'Respirator Wap Organik (Cartridge Coklat/Kelabu)',
      gloves: 'Sarung Tangan PVA / Viton (Bukan Nitril)',
      eyeProtection: 'Gogal Keselamatan Kalis Percikan',
      bodyProtection: 'Lab Coat Anti-Statik'
    },
    pelMalaysia: '10 ppm (TWA 8 jam) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '61.2°C',
    ph: 'Neutral',
    appearance: 'Cecair jernih lutsinar berat dengan bau eter yang manis',
    disposalMethod: 'Lupuskan melalui kontraktor sisa terjadual pelarut terhalogen.',
    scheduledWasteCode: 'SW 322',
    regulatoryRef: 'USECHH 2000, CLASS 2013, EQA 1974'
  },
  {
    id: 'MSDS-LAB-007',
    name: 'Acetic Acid Glacial 99.8%',
    malayName: 'Asid Asetik Glasial 99.8%',
    casNumber: '64-19-7',
    chemicalFormula: 'CH₃COOH',
    category: 'Lab & Diagnostic Reagents',
    hazardClass: 'Hakisan (Corrosive)',
    subHazards: ['Mudah Terbakar 3'],
    ghsCodes: ['GHS02', 'GHS05'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H226: Cecair dan wap mudah terbakar',
      'H314: Menyebabkan lecuran kulit yang parah dan kerosakan mata'
    ],
    precautionaryStatements: [
      'P210: Jauhkan daripada haba/percikan api/nyalaan',
      'P280: Pakai sarung tangan/pakaian pelindung/perlindungan mata'
    ],
    departments: ['Makmal Patologi', 'Makmal Sitologi'],
    location: 'Kabinet Asid Makmal Patologi',
    status: 'Aktif',
    lastUpdated: '2026-02-22',
    expiryDate: '2028-02-22',
    firstAid: {
      inhalation: 'Bawa ke udara segar.',
      skinContact: 'Bilas dengan air yang banyak selama 15 minit.',
      eyeContact: 'Bilas mata di eyewash selama 20 minit.',
      ingestion: 'Minum air. JANGAN paksa muntah.',
      symptomNote: 'Wap pekat merangsang saluran pernafasan.',
      doctorNote: 'Rawat kakisan tisu.'
    },
    handling: 'Tambahkan asid perlahan-lahan ke dalam air (Acid to Water).',
    storage: {
      temperature: '> 17°C (Pembekuan bawah 16.6°C)',
      ventilation: 'Pengudaraan Kebuk Wasap',
      incompatibles: ['Basa Strong', 'Pengoksida Strong', 'Asid Nitrik'],
      location: 'Kabinet Asid Kakisan'
    },
    ppeRequired: {
      respirator: 'Respirator Wap Asid Organik',
      gloves: 'Sarung Tangan Nitril Tugas Berat / Neoprene',
      eyeProtection: 'Gogal Asid',
      bodyProtection: 'Apron PVC'
    },
    pelMalaysia: '10 ppm (TWA 8 jam) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: '39°C',
    boilingPoint: '118°C',
    ph: '2.4',
    appearance: 'Cecair jernih tanpa warna dengan bau cuka amat tajam',
    disposalMethod: 'Neutralisasikan dengan larutan bikarbonat.',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'USECHH 2000, CLASS 2013'
  },
  {
    id: 'MSDS-LAB-008',
    name: 'Nitric Acid 65% Concentrated',
    malayName: 'Asid Nitrik 65% Pekat',
    casNumber: '7697-37-2',
    chemicalFormula: 'HNO₃',
    category: 'Lab & Diagnostic Reagents',
    hazardClass: 'Hakisan (Corrosive)',
    subHazards: ['Pengoksida 2', 'Toksik Akut 1 (Inhalation)'],
    ghsCodes: ['GHS03', 'GHS05', 'GHS06'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H272: Boleh memburukkan kebakaran; pengoksida',
      'H314: Menyebabkan lecuran kulit yang parah dan kerosakan mata',
      'H330: Membawa maut jika disedut'
    ],
    precautionaryStatements: [
      'P220: Jauhkan daripada bahan mudah terbakar',
      'P260: Jangan menyedut wap/gas',
      'P280: Pakai kelengkapan pelindung lengkap'
    ],
    departments: ['Makmal Kimia Analitikal / Toksikologi'],
    location: 'Kabinet Asid Pengoksida Pekat B-01',
    status: 'Perlu Semakan',
    lastUpdated: '2025-11-15',
    expiryDate: '2026-11-15',
    firstAid: {
      inhalation: 'Pindahkan mangsa ke udara segar. Berikan pernafasan oksigen teratur.',
      skinContact: 'Bilas dengan air yang banyak (warna kuning pada kulit akibat tindak balas xanthoproteic).',
      eyeContact: 'Bilas mata terbuka selama 20 minit.',
      ingestion: 'Minum air. JANGAN muntahkan.',
      symptomNote: 'Merangsang tisu paru-paru (edema pulmonari lewat).',
      doctorNote: 'Pantau pesakit selama 48 jam untuk kesesakan paru-paru.'
    },
    handling: 'Jangan simpan berdekatan pelarut organik atau bahan mudah terbakar.',
    storage: {
      temperature: '15°C - 25°C',
      ventilation: 'Kebuk wasap asid dengan scrubber khusus',
      incompatibles: ['Bahan Organik', 'Pelarut', 'Basa', 'Logam'],
      location: 'Kabinet Asid Nitrik Terasing'
    },
    ppeRequired: {
      respirator: 'Respirator Gas Asid Nitrik / SCBA',
      gloves: 'Sarung Tangan Viton / Neoprene',
      eyeProtection: 'Pelindung Muka Lengkap & Gogal',
      bodyProtection: 'Suit Asid PVC Kalis Hakisan'
    },
    pelMalaysia: '2 ppm (TWA 8 jam) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '121°C',
    ph: '< 1.0',
    appearance: 'Cecair jernih kekuningan dengan bau tajam merangsang',
    disposalMethod: 'Neutralisasikan secara cermat sebelum pelupusan terurus.',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'USECHH 2000, CLASS 2013'
  },
  {
    id: 'MSDS-LAB-009',
    name: 'Sodium Hydroxide 50% (Caustic Soda)',
    malayName: 'Natrium Hidroksida 50% (Soda Kaustik)',
    casNumber: '1310-73-2',
    chemicalFormula: 'NaOH',
    category: 'Lab & Diagnostic Reagents',
    hazardClass: 'Hakisan (Corrosive)',
    subHazards: ['Kerosakan Mata Berat 1'],
    ghsCodes: ['GHS05'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H314: Menyebabkan lecuran kulit yang parah dan kerosakan mata',
      'H290: Boleh melekas logam'
    ],
    precautionaryStatements: [
      'P280: Pakai sarung tangan/pakaian pelindung/perlindungan mata/muka',
      'P301+P330+P331: JIKA TERTELAN: Bilas mulut. JANGAN paksa muntah'
    ],
    departments: ['Makmal Biokimia', 'Stesen Pencucian Reagen'],
    location: 'Kabinet Bes & Alkali Makmal A',
    status: 'Aktif',
    lastUpdated: '2026-02-10',
    expiryDate: '2028-02-10',
    firstAid: {
      inhalation: 'Bawa ke udara segar.',
      skinContact: 'Bilas dengan air mengalir secara berterusan selama 20 minit.',
      eyeContact: 'Bilas mata berterusan selama 20 minit. Dapatkan bantuan doktor segera.',
      ingestion: 'Minum air atau susu. JANGAN muntahkan.',
      symptomNote: 'Kakisan licin (saponifikasi) pada tisu kulit.',
      doctorNote: 'Nekrosis liquefactive parah pada esofagus.'
    },
    handling: 'Larutan membebaskan haba apabila dicairkan dengan air.',
    storage: {
      temperature: '15°C - 25°C',
      ventilation: 'Pengudaraan am',
      incompatibles: ['Asid Pekat', 'Aluminium', 'Zink', 'Timah'],
      location: 'Kabinet Simpanan Bes Polyethylene'
    },
    ppeRequired: {
      respirator: 'Respirator Debu / Mist Kakisan',
      gloves: 'Sarung Tangan Nitril / Rubber Tugas Berat',
      eyeProtection: 'Pelindung Muka Penuh & Gogal',
      bodyProtection: 'Apron Rubber'
    },
    pelMalaysia: '2 mg/m³ (Ceiling Limit) - USECHH 2000',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '145°C',
    ph: '14.0 (Alkali Sangat Kuat)',
    appearance: 'Cecair jernih berminyak tanpa warna',
    disposalMethod: 'Neutralisasikan dengan asid cair sebelum pelupusan.',
    scheduledWasteCode: 'SW 411',
    regulatoryRef: 'USECHH 2000, CLASS 2013'
  },
  {
    id: 'MSDS-GAS-004',
    name: 'Carbon Dioxide (CO₂) Medical Gas',
    malayName: 'Gas Karbon Dioksida (CO₂) Perubatan',
    casNumber: '124-38-9',
    chemicalFormula: 'CO₂',
    category: 'Medical Gases',
    hazardClass: 'Gas Tertekanan (Compressed Gas)',
    subHazards: ['Sesak Nafas (Asphyxiant)'],
    ghsCodes: ['GHS04'],
    ghsSignalWord: 'Amaran',
    hazardStatements: [
      'H280: Mengandungi gas di bawah tekanan; boleh meletup jika dipanaskan'
    ],
    precautionaryStatements: [
      'P403: Simpan di tempat yang diudarakan dengan baik'
    ],
    departments: ['Dewan Bedah (Laparoskopi)', 'Makmal Inkubator IVF'],
    location: 'Store Manifold Gas Laparoskopi Dewan Bedah',
    status: 'Aktif',
    lastUpdated: '2026-03-15',
    expiryDate: '2029-03-15',
    firstAid: {
      inhalation: 'Bawa mangsa ke kawasan udara segar. Berikan pernafasan oksigen.',
      skinContact: 'Bilas sebarang lecuran cecair cold/frostbite dengan air suam.',
      eyeContact: 'Bilas dengan air suam.',
      ingestion: 'Tidak terpakai.',
      symptomNote: 'Sakit kepala, sesak nafas, kehilangan kesedaran jika kepekatan tinggi.',
      doctorNote: 'Pantau hiperkapnia.'
    },
    handling: 'Pastikan kawasan mempunyai ventilasi udara selamat.',
    storage: {
      temperature: '< 50°C',
      ventilation: 'Pengudaraan aras lantai berterusan',
      incompatibles: ['Logam Reaktif'],
      location: 'Store Silinder Gas Perubatan'
    },
    ppeRequired: {
      respirator: 'Tiada khas untuk kegunaan insuflasi tertutup',
      gloves: 'Sarung Tangan Khas Silinder',
      eyeProtection: 'Kaca Mata Pelindung',
      bodyProtection: 'Kasut Keselamatan'
    },
    pelMalaysia: '5000 ppm (TWA 8 jam) - USECHH 2000',
    physicalState: 'Gas',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '-78.5°C (Sublimasi)',
    ph: 'Tidak berkenaan',
    appearance: 'Gas tanpa warna dan tanpa bau',
    disposalMethod: 'Lepaskan secara terkawal ke atmosfera luar.',
    scheduledWasteCode: 'Tiada',
    regulatoryRef: 'USECHH 2000, OSHA 1994'
  },
  {
    id: 'MSDS-GAS-005',
    name: 'Liquid Nitrogen (LN2) Cryogenic',
    malayName: 'Nitrogen Cecair (LN2) Krio',
    casNumber: '7727-37-9',
    chemicalFormula: 'N₂',
    category: 'Medical Gases',
    hazardClass: 'Gas Tertekanan (Compressed Gas)',
    subHazards: ['Bahaya Cryogenic Frostbite', 'Asphyxiant'],
    ghsCodes: ['GHS04'],
    ghsSignalWord: 'Amaran',
    hazardStatements: [
      'H281: Mengandungi gas tercecair sejuk beku; boleh menyebabkan lecuran krio'
    ],
    precautionaryStatements: [
      'P282: Pakai sarung tangan penyukat sejuk/pelindung muka'
    ],
    departments: ['Bank Darah / Stem Cell', 'Dermatologi (Krioterapi)', 'Makmal Patologi'],
    location: 'Tangki Krio LN2 Bank Darah Utama',
    status: 'Aktif',
    lastUpdated: '2026-03-20',
    expiryDate: '2029-03-20',
    firstAid: {
      inhalation: 'Bawa ke udara segar. Berikan oksigen.',
      skinContact: 'Rendam bahagian terjejas frostbite dalam air suam (38-42°C). Jangan gosok.',
      eyeContact: 'Bilas mata berterusan dengan air suam.',
      ingestion: 'Tidak terpakai.',
      symptomNote: 'Penyahoksigenan mendadak dalam bilik terkurung.',
      doctorNote: 'Rawat kerosakan tisu krio.'
    },
    handling: 'Sentiasa isi semula tangki Dewar dalam ruang berudara baik.',
    storage: {
      temperature: '-196°C',
      ventilation: 'Pengudaraan mekanikal berterusan dengan monitor O₂',
      incompatibles: ['Bahan Terkurung Tanpa Injap Pelepasan'],
      location: 'Bilik Krio Terpencil Blok B'
    },
    ppeRequired: {
      respirator: 'Monitor Ketepuan Oksigen Udara',
      gloves: 'Sarung Tangan Krio Penuh (Cryogenic Gloves)',
      eyeProtection: 'Pelindung Muka Penuh Krio',
      bodyProtection: 'Apron Krio & Kasut Pelindung'
    },
    pelMalaysia: 'Kandungan Oksigen Minima 19.5%',
    physicalState: 'Gas',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '-195.8°C',
    ph: 'Tidak berkenaan',
    appearance: 'Cecair jernih membeku dengan kabut sejuk putih',
    disposalMethod: 'Biar penyejatan semula jadi di kawasan lapang luar.',
    scheduledWasteCode: 'Tiada',
    regulatoryRef: 'OSHA 1994, FMA 1967'
  },
  {
    id: 'MSDS-ONC-001',
    name: 'Cyclophosphamide 20mg/ml Injection',
    malayName: 'Suntikan Siklofosfamid 20mg/ml (Sitotoksik)',
    casNumber: '50-18-0',
    chemicalFormula: 'C₇H₁₅Cl₂N₂O₂P',
    category: 'Pharmaceutical Solvents',
    hazardClass: 'Toksik (Toxic)',
    subHazards: ['Karsinogen 1A', 'Mutagen 1B', 'Toksik Pembiakan 1B'],
    ghsCodes: ['GHS06', 'GHS08'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H301: Toksik jika tertelan',
      'H340: Boleh menyebabkan kecacatan genetik',
      'H350: Boleh menyebabkan kanser',
      'H360FD: Boleh merosakkan kesuburan dan janin'
    ],
    precautionaryStatements: [
      'P201: Dapatkan arahan khas sebelum menggunakannya',
      'P280: Pakai sarung tangan/pakaian pelindung sitotoksik'
    ],
    departments: ['Unit Onkologi & Kemoterapi', 'Farmasi Reconstitution'],
    location: 'Kebuk Biohazard Sitotoksik Farmasi Onkologi',
    status: 'Aktif',
    lastUpdated: '2026-02-05',
    expiryDate: '2028-02-05',
    firstAid: {
      inhalation: 'Bawa ke udara segar.',
      skinContact: 'Basuh segera dengan air dan sabun selama 15 minit.',
      eyeContact: 'Bilas mata di eyewash selama 15 minit.',
      ingestion: 'Dapatkan rawatan perubatan kecemasan serta merta.',
      symptomNote: 'Agen pengalkilan sitotoksik mutagenik.',
      doctorNote: 'Nyahaktifkan pajanan mengikut protokol penyerapan sitotoksik.'
    },
    handling: 'Penyediaan mesti dalam Kabinet Keselamatan Biologi (BSC Class II Type B2).',
    storage: {
      temperature: '2°C - 8°C (Peti Sejuk Farmasi)',
      ventilation: 'Pengudaraan terpencil sitotoksik',
      incompatibles: ['Bahan Pengoksida Kuat'],
      location: 'Peti Sejuk Sitotoksik Onkologi'
    },
    ppeRequired: {
      respirator: 'Respirator N95 / P100 Hazmat Cytotoxic',
      gloves: 'Sarung Tangan Sitotoksik Berlapis (Double Cytotoxic Gloves)',
      eyeProtection: 'Gogal Kalis Percikan',
      bodyProtection: 'Gown Sitotoksik Kalis Cecair'
    },
    pelMalaysia: 'Tiada had PEL (Pajanan Minimum Terkawal)',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '100°C',
    ph: '3.9 - 6.7',
    appearance: 'Larutan jernih tanpa warna',
    disposalMethod: 'Lupuskan sebagai sisa sitotoksik klinikal (Tong Ungu / Cytotoxic Waste).',
    scheduledWasteCode: 'SW 405',
    regulatoryRef: 'Akta Racun 1952, CLASS 2013, KKM Cytotoxic Guidelines'
  },
  {
    id: 'MSDS-ONC-002',
    name: 'Methotrexate 25mg/ml Cytotoxic Solution',
    malayName: 'Larutan Sitotoksik Metotrekset 25mg/ml',
    casNumber: '59-05-2',
    chemicalFormula: 'C₂₀H₂₂N₈O₅',
    category: 'Pharmaceutical Solvents',
    hazardClass: 'Toksik (Toxic)',
    subHazards: ['Toksik Pembiakan 1A', 'Kerengsaan Kulit 2'],
    ghsCodes: ['GHS06', 'GHS08'],
    ghsSignalWord: 'Bahaya',
    hazardStatements: [
      'H301: Toksik jika tertelan',
      'H315: Menyebabkan kerengsaan kulit',
      'H360D: Boleh merosakkan janin'
    ],
    precautionaryStatements: [
      'P201: Dapatkan arahan khas sebelum menggunakannya',
      'P280: Pakai sarung tangan pelindung sitotoksik'
    ],
    departments: ['Unit Onkologi', 'Farmasi Wad'],
    location: 'Kabinet Ubat Sitotoksik Onkologi',
    status: 'Aktif',
    lastUpdated: '2026-02-05',
    expiryDate: '2028-02-05',
    firstAid: {
      inhalation: 'Pindahkan ke udara segar.',
      skinContact: 'Basuh dengan air mengalir yang banyak.',
      eyeContact: 'Bilas di stesen eyewash selama 15 minit.',
      ingestion: 'Hubungi talian kecemasan.',
      symptomNote: 'Antimetabolit folat sitotoksik.',
      doctorNote: 'Antidot: Leucovorin (Kalsium Folinat).'
    },
    handling: 'Kakitangan hamil DILARANG mengendalikan ubat ini.',
    storage: {
      temperature: '15°C - 25°C',
      ventilation: 'Bilik persediaan terasing',
      incompatibles: ['Asid Kuat'],
      location: 'Store Ubat Cytotoxic'
    },
    ppeRequired: {
      respirator: 'Respirator N95 / HEPA',
      gloves: 'Sarung Tangan Nitril Sitotoksik',
      eyeProtection: 'Kaca Mata Pelindung',
      bodyProtection: 'Gown Sitotoksik'
    },
    pelMalaysia: 'Pajanan Terkawal Minimum',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '100°C',
    ph: '7.5 - 9.0',
    appearance: 'Larutan jernih kekuningan',
    disposalMethod: 'Lupuskan dalam bekas sisa sitotoksik khas (Bekas Ungu).',
    scheduledWasteCode: 'SW 405',
    regulatoryRef: 'Akta Racun 1952, CLASS 2013'
  },
  {
    id: 'MSDS-DIA-001',
    name: 'Hemodialysis Acid Concentrate Solution',
    malayName: 'Larutan Pekat Asid Hemodialisis',
    casNumber: '7647-14-5',
    chemicalFormula: 'NaCl + KCl + CaCl₂ + MgCl₂ + CH₃COOH',
    category: 'Cleaning & Decontamination',
    hazardClass: 'Kerengsaan (Irritant)',
    subHazards: ['Kerengsaan Mata 2'],
    ghsCodes: ['GHS07'],
    ghsSignalWord: 'Amaran',
    hazardStatements: [
      'H319: Menyebabkan kerengsaan mata yang serius',
      'H315: Menyebabkan kerengsaan kulit'
    ],
    precautionaryStatements: [
      'P280: Pakai sarung tangan/perlindungan mata'
    ],
    departments: ['Unit Hemodialisis'],
    location: 'Bilik Campuran Dialisis Utama Blok D',
    status: 'Aktif',
    lastUpdated: '2026-03-01',
    expiryDate: '2028-03-01',
    firstAid: {
      inhalation: 'Tiada bahaya ketara.',
      skinContact: 'Basuh dengan air.',
      eyeContact: 'Bilas di stesen eyewash selama 15 minit.',
      ingestion: 'Minum air.',
      symptomNote: 'Kerengsaan garam asid cair.',
      doctorNote: 'Rawatan simptomatik.'
    },
    handling: 'Elakkan pencemaran silang semasa penyambungan tiub.',
    storage: {
      temperature: '15°C - 30°C',
      ventilation: 'Pengudaraan am',
      incompatibles: ['Basa Kuat'],
      location: 'Store Reagen Hemodialisis'
    },
    ppeRequired: {
      respirator: 'Tiada khas',
      gloves: 'Sarung Tangan Nitril Pemeriksaan',
      eyeProtection: 'Kaca Mata Pelindung',
      bodyProtection: 'Apron Plastik'
    },
    pelMalaysia: 'Tiada had PEL',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '100°C',
    ph: '2.5 - 3.0',
    appearance: 'Cecair jernih tanpa warna',
    disposalMethod: 'Pelepasan terurus ke dalam perparitan rawatan sisa hospital.',
    scheduledWasteCode: 'Tiada (Bukan Berbahaya)',
    regulatoryRef: 'KKM Hemodialysis Standards'
  },
  {
    id: 'MSDS-CLN-002',
    name: 'Enzymatic Medical Instrument Detergent',
    malayName: 'Detergen Enzimatik Alat Perubatan',
    casNumber: '9014-01-1',
    chemicalFormula: 'Formulasi Multi-Enzim (Protease/Amylase/Lipase)',
    category: 'Cleaning & Decontamination',
    hazardClass: 'Kerengsaan (Irritant)',
    subHazards: ['Pemekaan Respiratori 1'],
    ghsCodes: ['GHS07', 'GHS08'],
    ghsSignalWord: 'Amaran',
    hazardStatements: [
      'H334: Boleh menyebabkan gejala alergi atau asma jika disedut',
      'H315: Menyebabkan kerengsaan kulit'
    ],
    precautionaryStatements: [
      'P261: Elakkan menyedut semburan/kabut',
      'P284: Pakai perlindungan pernafasan jika ada aerosol'
    ],
    departments: ['CSSD', 'Unit Endoskopi', 'Dewan Bedah'],
    location: 'Stesen Pencucian Peralatan CSSD',
    status: 'Aktif',
    lastUpdated: '2026-02-28',
    expiryDate: '2028-02-28',
    firstAid: {
      inhalation: 'Bawa ke udara segar jika batuk.',
      skinContact: 'Basuh dengan air dan sabun.',
      eyeContact: 'Bilas mata berterusan selama 15 minit.',
      ingestion: 'Minum 1-2 gelas air.',
      symptomNote: 'Tindak balas alahan enzim pada individu sensitif.',
      doctorNote: 'Rawat alahan jika berlaku.'
    },
    handling: 'Gunakan bancuhan automatik untuk mengelakkan aerosol.',
    storage: {
      temperature: '15°C - 25°C',
      ventilation: 'Pengudaraan am',
      incompatibles: ['Agen Pengoksida Strong', 'Asid Pekat'],
      location: 'Store Detergen CSSD'
    },
    ppeRequired: {
      respirator: 'Masker Pembedahan / N95 jika semburan',
      gloves: 'Sarung Tangan Nitril / Getah',
      eyeProtection: 'Kaca Mata Pelindung',
      bodyProtection: 'Apron Plastik'
    },
    pelMalaysia: '0.00006 mg/m³ (Protease Subtilisin)',
    physicalState: 'Cecair',
    flashPoint: 'Bukan Mudah Terbakar',
    boilingPoint: '100°C',
    ph: '6.5 - 8.0',
    appearance: 'Cecair kebiruan atau jernih dengan bau segar',
    disposalMethod: 'Lupuskan melalui saluran sisa basuh hospital.',
    scheduledWasteCode: 'Tiada',
    regulatoryRef: 'CLASS 2013'
  }
]

