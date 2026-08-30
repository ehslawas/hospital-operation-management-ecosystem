import { NAGInfectionGuideline } from '../types/formulariTypes'

export const NAG_GUIDELINES: NAGInfectionGuideline[] = [
  {
    id: 'NAG-SST-001',
    bodySystem: 'Skin & Soft Tissue',
    conditionName: 'Diabetic Foot Ulcer (DFU) - Moderate to Severe (Polymicrobial / Sepsis)',
    setting: 'Community-Acquired',
    primaryPathogens: [
      'Staphylococcus aureus (MSSA & CA-MRSA)',
      'Streptococcus spp. (Group A, B, C, G)',
      'Enterobacterales (E. coli, Klebsiella pneumoniae, Proteus mirabilis)',
      'Anaerobes (Bacteroides fragilis, Peptostreptococcus spp.)',
      'Pseudomonas aeruginosa (in macerated/chronic ulcers)'
    ],
    firstLineTherapy: {
      regimen: 'IV Ampicillin/Sulbactam 1.5g – 3.0g Q8H (or IV Co-Amoxiclav 1.2g TDS)',
      routeAndDose: 'IV Ampicillin/Sulbactam 1.5g – 3.0g Q8H (bolus perlahan atau infusi 30 min). Sederhana: 1.5g Q8H; Teruk/Sepsis: 3.0g Q8H.',
      durationDays: '7 - 14 days (panjangkan ke 4-6 minggu jika ada osteomielitis)',
      remarks: 'Wajib lakukan debridement pembedahan segera, kawalan glisemik optimum, dan offloading tekanan pada kaki.'
    },
    secondLineTherapy: {
      regimen: 'IV Piperacillin/Tazobactam 4.5g Q8H +/- IV Vancomycin (if MRSA or Pseudomonas risk)',
      routeAndDose: 'IV Tazocin 4.5g Q8H infusi berpanjangan 3 jam. Tambah IV Vancomycin 15-20mg/kg Q12H jika ada kolonisasi MRSA lampau.',
      durationDays: '10 - 14 days',
      remarks: 'Untuk DFU teruk mengancam anggota (limb-threatening) dengan kehadiran gas tisu atau tanda sepsis sistemik.'
    },
    penicillinAllergyOption: {
      regimen: 'IV Clindamycin 600mg Q8H + IV Ciprofloxacin 400mg Q12H (or IV Vancomycin + Gentamicin)',
      routeAndDose: 'IV Clindamycin 600mg Q8H + IV Ciprofloxacin 400mg BD (liputan kuman anaerobik & Gram-negatif)',
      remarks: 'Pantau fungsi buah pinggang dan risiko kolitis C. difficile.'
    },
    oralStepDownOption: {
      regimen: 'Oral Sultamicillin 375mg – 750mg BD (Unasyn Oral) atau Oral Augmentin 625mg TDS',
      criteria: 'Pesakit tiada demam (afebrile) > 24-48 jam, tanda keradangan setempat berkurangan, nilai WBC menurun, dan pesakit mampu bertoleransi dengan ubat oral.'
    },
    amsNotes: [
      'JANGAN ambil swab permukaan luka (superficial wound swab); hanya hantar sampel biopsi tisu dalam (deep tissue) atau nanah intra-operatif ke makmal mikrobiologi.',
      'Nilai vaskular periferi (ABPI / Doppler) untuk memastikan perfusi tisu mencukupi bagi penyembuhan luka.'
    ],
    evidenceLevel: 'Grade A (NAG 2024 / IWGDF 2023 Guidelines)'
  },
  {
    id: 'NAG-SST-002',
    bodySystem: 'Skin & Soft Tissue',
    conditionName: 'Cellulitis & Erysipelas (Non-purulent / Sederhana - Teruk)',
    setting: 'Community-Acquired',
    primaryPathogens: [
      'Streptococcus pyogenes (Group A Streptococcus)',
      'Staphylococcus aureus (MSSA)',
      'Streptococcus dysgalactiae'
    ],
    firstLineTherapy: {
      regimen: 'IV Cloxacillin 1g – 2g Q6H (or IV Cefazolin 1g – 2g Q8H)',
      routeAndDose: 'IV Cloxacillin 1g – 2g Q6H IV bolus perlahan (atau IV Cefazolin 1g-2g Q8H jika alahan ringan).',
      durationDays: '5 - 7 days (sehingga tanda keradangan surut)',
      remarks: 'Tandakan sempadan kemerahan (erythema margin) dengan pen pembedahan untuk menilai respons harian.'
    },
    secondLineTherapy: {
      regimen: 'IV Ampicillin/Sulbactam 1.5g – 3.0g Q8H or IV Co-Amoxiclav 1.2g TDS',
      routeAndDose: 'IV Ampicillin/Sulbactam 1.5g Q8H (pilihan utama bagi pesakit diabetes atau jangkitan campuran).',
      durationDays: '7 - 10 days',
      remarks: 'Gunakan jika ada kecurigaan jangkitan polimikrobial atau luka gigitan/trauma tercemar.'
    },
    penicillinAllergyOption: {
      regimen: 'IV Clindamycin 600mg Q8H or IV Vancomycin 15-20mg/kg Q12H',
      routeAndDose: 'IV Clindamycin 600mg Q8H (atau Oral Clindamycin 300-450mg TDS jika mampu makan).',
      remarks: 'Clindamycin memberikan liputan cemerlang untuk Streptococci dan Staphylococci pada alahan penicillin.'
    },
    oralStepDownOption: {
      regimen: 'Oral Cloxacillin 500mg QID (ambil semasa perut kosong) atau Oral Sultamicillin 375mg BD',
      criteria: 'Demam reda, eritema dan bengkak anggota berkurangan, tiada komplikasi abses.'
    },
    amsNotes: [
      'Tinggikan anggota yang terjejas (limb elevation) untuk mempercepatkan pengurangan edema.'
    ],
    evidenceLevel: 'Grade A (NAG 2024 / IDSA 2014)'
  },
  {
    id: 'NAG-SST-003',
    bodySystem: 'Skin & Soft Tissue',
    conditionName: 'Necrotising Fasciitis & Gangren Gas (Kecemasan Pembedahan Mengancam Nyawa)',
    setting: 'Community-Acquired',
    primaryPathogens: [
      'Polymicrobial Type I (Anaerobes + Enterobacteriaceae + Streptococci)',
      'Monomicrobial Type II (Streptococcus pyogenes - Group A Strep)',
      'Clostridium perfringens (Gas Gangrene)',
      'Vibrio vulnificus (Marine trauma)'
    ],
    firstLineTherapy: {
      regimen: 'IV Piperacillin/Tazobactam 4.5g Q8H (or Meropenem 1g Q8H) + IV Vancomycin 15-20mg/kg Q12H + IV Clindamycin 900mg Q8H',
      routeAndDose: 'IV Tazocin 4.5g Q8H + IV Vancomycin 15-20mg/kg Q12H + IV Clindamycin 900mg Q8H (kesan antitoksin / Eagle effect).',
      durationDays: '10 - 14 days (sehingga tisu nekrotik bersih sepenuhnya)',
      remarks: 'PEMBEDAHAN DEBRIDEMENT KECEMASAN SERTA-MERTA ADALAH PALING UTAMA; antibiotik sahaja tidak mencukupi.'
    },
    secondLineTherapy: {
      regimen: 'IV Meropenem 1g Q8H (extended infusion) + IV Vancomycin + IV Clindamycin',
      routeAndDose: 'IV Meropenem 1g Q8H infusi 3 jam + Vancomycin + Clindamycin 900mg Q8H.',
      durationDays: '10 - 14 days',
      remarks: 'Untuk kes syok septik teruk dengan kegagalan pelbagai organ (MODS).'
    },
    penicillinAllergyOption: {
      regimen: 'IV Meropenem 1g Q8H (jika alahan ringan) or IV Ciprofloxacin 400mg Q12H + IV Vancomycin + IV Metronidazole 500mg TDS',
      routeAndDose: 'IV Ciprofloxacin 400mg Q12H + IV Vancomycin + IV Metronidazole 500mg Q8H + IV Clindamycin 900mg Q8H',
      remarks: 'Kekalkan liputan luas terhadap Gram-positif, Gram-negatif, anaerob, dan perencatan toksin bakteria.'
    },
    amsNotes: [
      'Clindamycin merencat sintesis toksin M-protein dan streptococcal pyrogenic exotoxins (kesan antitoksin).',
      'Pembedahan eksplorasi ulangan (second-look debridement) di dewan bedah dalam 24-48 jam adalah wajib.'
    ],
    evidenceLevel: 'Grade A (NAG 2024 / WSES Guidelines)'
  },
  {
    id: 'NAG-RESP-001',
    bodySystem: 'Respiratory',
    conditionName: 'Community-Acquired Pneumonia (CAP) - Moderate to Severe (Hospitalised)',
    setting: 'Community-Acquired',
    primaryPathogens: [
      'Streptococcus pneumoniae',
      'Haemophilus influenzae',
      'Mycoplasma pneumoniae',
      'Chlamydia pneumoniae',
      'Legionella pneumophila'
    ],
    firstLineTherapy: {
      regimen: 'IV Ceftriaxone 1g – 2g OD + Oral/IV Azithromycin 500mg OD',
      routeAndDose: 'IV Ceftriaxone 2g sekali sehari + Azithromycin 500mg OD (atau Oral Clarithromycin 500mg BD)',
      durationDays: '5 - 7 days',
      remarks: 'Pastikan liputan kuman atipikal (Macrolide) diberikan bersama mengikut garis panduan CAP KKM.'
    },
    secondLineTherapy: {
      regimen: 'IV Ampicillin/Sulbactam 1.5g – 3.0g Q8H + Azithromycin 500mg OD (or IV Co-Amoxiclav 1.2g TDS)',
      routeAndDose: 'IV Ampicillin/Sulbactam 1.5g – 3.0g Q8H (atau IV Cefuroxime 750mg–1.5g Q8H) + Azithromycin 500mg OD',
      durationDays: '5 - 7 days',
      remarks: 'Pilihan BL/BLI utama sekiranya disyaki kuman penghasil beta-laktamase atau risiko aspirasi.'
    },
    penicillinAllergyOption: {
      regimen: 'IV/Oral Levofloxacin 750mg OD or Moxifloxacin 400mg OD',
      routeAndDose: 'Oral/IV Levofloxacin 750mg setiap 24 jam (agen tunggal merangkumi kuman tipikal dan atipikal)',
      remarks: 'Waspada pada pesakit warga emas dengan risiko pemanjangan selang QTc atau tendinopati.'
    },
    oralStepDownOption: {
      regimen: 'Oral Sultamicillin 375mg – 750mg BD atau Oral Amoxicillin/Clavulanate 625mg TDS',
      criteria: 'Kadar pernafasan < 24/min, tiada demam 48 jam, SpO2 stabil pada udara bilik, dan toleran oral.'
    },
    amsNotes: [
      'Ambil kultur darah dan kahak (sputum Gram stain/C&S) sebelum antibiotik pertama dimulakan.',
      'Gunakan skor CURB-65 / PSI untuk stratifikasi risiko kemasukan wad/ICU.',
      'Semakan wajib pada 48-72 jam untuk menilai kelayakan penukaran IV ke oral (Step-down).'
    ],
    evidenceLevel: 'Grade A (NAG 2024 / IDSA/ATS 2019)'
  },
  {
    id: 'NAG-RESP-002',
    bodySystem: 'Respiratory',
    conditionName: 'Hospital-Acquired Pneumonia (HAP) / Ventilator-Associated Pneumonia (VAP)',
    setting: 'Hospital-Acquired (HAP/VAP)',
    primaryPathogens: [
      'Pseudomonas aeruginosa',
      'Acinetobacter baumannii',
      'Klebsiella pneumoniae (ESBL / CRE)',
      'Staphylococcus aureus (MRSA)',
      'Enterobacter cloacae'
    ],
    firstLineTherapy: {
      regimen: 'IV Piperacillin/Tazobactam 4.5g Q6H (extended 3-hr infusion) +/- IV Amikacin 15mg/kg OD',
      routeAndDose: 'IV Tazocin 4.5g Q6H infusi berpanjangan 3-4 jam. Tambah IV Amikacin 15-20mg/kg OD jika dalam syok septik.',
      durationDays: '7 days (panjangkan jika kuman non-fermenter atau respons lewat)',
      remarks: 'Strategi penjimatan karbapenem (Carbapenem-sparing) per polisi AMS KKM.'
    },
    secondLineTherapy: {
      regimen: 'IV Meropenem 1g – 2g Q8H (3-hr extended infusion) + IV Vancomycin (if MRSA risk)',
      routeAndDose: 'IV Meropenem 1g Q8H infusi berpanjangan. Vancomycin 15-20mg/kg loading kemudian 15mg/kg Q12H (sasaran trough 15-20 mcg/mL).',
      durationDays: '7 - 14 days',
      remarks: 'Karbapenem memerlukan notifikasi / kelulusan Pakar Penyakit Berjangkit (ID) dalam tempoh 72 jam.'
    },
    penicillinAllergyOption: {
      regimen: 'IV Ciprofloxacin 400mg Q8H or IV Aztreonam 2g Q8H + IV Vancomycin',
      routeAndDose: 'IV Ciprofloxacin 400mg Q8H + IV Vancomycin 15mg/kg Q12H',
      remarks: 'Pastikan liputan Pseudomonas aeruginosa Gram-negatif dikekalkan.'
    },
    amsNotes: [
      'Ambil aspirat endotrakeal / bronchoalveolar lavage (BAL) sebelum memulakan antibiotik.',
      'De-eskalasi kepada spektrum paling sempit sebaik sahaja keputusan kultur makmal diperolehi pada Hari ke-3.'
    ],
    evidenceLevel: 'Grade A (NAG 2024 / ATS/IDSA 2016)'
  },
  {
    id: 'NAG-RESP-003',
    bodySystem: 'Respiratory',
    conditionName: 'Aspiration Pneumonia & Abses Paru-Paru (Jangkitan Kuman Anaerobik)',
    setting: 'Community-Acquired',
    primaryPathogens: [
      'Anaerobic oral flora (Peptostreptococcus, Fusobacterium, Prevotella)',
      'Streptococcus viridans group',
      'Enterobacteriaceae & S. aureus (in hospitalised patients)'
    ],
    firstLineTherapy: {
      regimen: 'IV Ampicillin/Sulbactam 1.5g – 3.0g Q8H or IV Co-Amoxiclav 1.2g TDS',
      routeAndDose: 'IV Ampicillin/Sulbactam 1.5g – 3g Q8H (atau IV Ceftriaxone 2g OD + IV Metronidazole 500mg TDS).',
      durationDays: '7 - 14 days (panjangkan ke 4-6 minggu jika ada kaviti abses paru-paru)',
      remarks: 'Ampicillin/Sulbactam dan Co-amoxiclav memberikan liputan sangat baik terhadap flora oral anaerobik.'
    },
    secondLineTherapy: {
      regimen: 'IV Piperacillin/Tazobactam 4.5g Q8H or IV Moxifloxacin 400mg OD',
      routeAndDose: 'IV Tazocin 4.5g Q8H atau IV Moxifloxacin 400mg sekali sehari.',
      durationDays: '7 - 14 days',
      remarks: 'Untuk kes aspirasi nosokomial atau kegagalan rejimen barisan pertama.'
    },
    penicillinAllergyOption: {
      regimen: 'IV Clindamycin 600mg Q8H or IV Levofloxacin 750mg OD + IV Metronidazole 500mg TDS',
      routeAndDose: 'IV Clindamycin 600mg Q8H (liputan anaerobik cemerlang) atau Levofloxacin + Metronidazole',
      remarks: 'Pantau gejala kolitis C. difficile.'
    },
    oralStepDownOption: {
      regimen: 'Oral Sultamicillin 375mg – 750mg BD atau Oral Augmentin 625mg TDS',
      criteria: 'Pesakit mampu makan/minum tanpa aspirasi, demam reda, tiada kegagalan respiratori.'
    },
    amsNotes: [
      'Semak fungsi menelan (swallow assessment) oleh Juruterapi Pertuturan bagi mencegah episod aspirasi berulang.'
    ],
    evidenceLevel: 'Grade A (NAG 2024 / IDSA Guidelines)'
  },
  {
    id: 'NAG-UTI-001',
    bodySystem: 'Urinary',
    conditionName: 'Complicated UTI / Acute Pyelonephritis (Kemasukan Wad)',
    setting: 'Community-Acquired',
    primaryPathogens: [
      'Escherichia coli (termasuk strain penghasil ESBL)',
      'Klebsiella pneumoniae',
      'Proteus mirabilis',
      'Enterococcus faecalis'
    ],
    firstLineTherapy: {
      regimen: 'IV Ceftriaxone 1g – 2g OD or IV Cefoperazone/Sulbactam 1.5g – 3g BD',
      routeAndDose: 'IV Ceftriaxone 1g – 2g sekali sehari (atau IV Cefuroxime 750mg–1.5g TDS).',
      durationDays: '7 - 10 days (14 hari jika ada bakteremia)',
      remarks: 'Tukar kepada oral Cefuroxime axetil 500mg BD atau Amoxicillin/Clavulanate 625mg TDS apabila demam surut.'
    },
    secondLineTherapy: {
      regimen: 'IV Amikacin 15mg/kg OD or IV Ertapenem 1g OD (if confirmed ESBL)',
      routeAndDose: 'IV Ertapenem 1g OD (pilihan penjimatan karbapenem untuk ESBL bukan-pseudomonas) atau IV Amikacin 15mg/kg OD.',
      durationDays: '7 - 10 days',
      remarks: 'Ertapenem menjimatkan Meropenem untuk jangkitan Pseudomonas/Acinetobacter hospital.'
    },
    penicillinAllergyOption: {
      regimen: 'IV Ciprofloxacin 400mg BD (or Oral Ciprofloxacin 500mg BD if tolerated)',
      routeAndDose: 'IV Ciprofloxacin 400mg Q12H (waspada: kadar rintangan fluoroquinolone E. coli tempatan tinggi >30%)',
      remarks: 'Semak carta antibiogram hospital tempatan.'
    },
    oralStepDownOption: {
      regimen: 'Oral Cefuroxime axetil 500mg BD atau Oral Augmentin 625mg TDS',
      criteria: 'Pesakit tiada demam 48 jam, sakit pinggang/renal angle tenderness reda, keputusan kultur kuman sensitif.'
    },
    amsNotes: [
      'Wajib hantar sampel Urine FEME dan Urine C&S sebelum dos antibiotik pertama dimulakan.',
      'Ultrasound KUB disyorkan jika tiada pemulihan dalam 48-72 jam untuk menolak sekatan saluran kencing / abses renal.'
    ],
    evidenceLevel: 'Grade A (NAG 2024 / EAU Guidelines)'
  },
  {
    id: 'NAG-ABD-001',
    bodySystem: 'Intra-abdominal',
    conditionName: 'Complicated Intra-Abdominal Infection (Peritonitis / Kolesistitis / Apendisitis Komplikasi)',
    setting: 'Community-Acquired',
    primaryPathogens: [
      'Escherichia coli',
      'Klebsiella pneumoniae',
      'Bacteroides fragilis (Anaerob)',
      'Enterococcus faecalis',
      'Streptococcus spp.'
    ],
    firstLineTherapy: {
      regimen: 'IV Ampicillin/Sulbactam 3.0g Q8H (or IV Ceftriaxone 2g OD + IV Metronidazole 500mg Q8H)',
      routeAndDose: 'IV Unasyn 3g Q8H (atau IV Ceftriaxone 2g OD + IV Metronidazole 500mg TDS)',
      durationDays: '4 - 7 days (selepas kawalan punca pembedahan dicapai)',
      remarks: 'Kawalan sumber pembedahan awal (laparotomi/pembedahan saliran nanah) adalah kunci utama rawatan.'
    },
    secondLineTherapy: {
      regimen: 'IV Piperacillin/Tazobactam 4.5g Q8H or IV Cefoperazone/Sulbactam 2g BD',
      routeAndDose: 'IV Tazocin 4.5g Q8H infusi berpanjangan atau IV Sulperazon 2g BD.',
      durationDays: '4 - 7 days',
      remarks: 'Rizab Meropenem 1g Q8H untuk syok septik atau peritonitis tertier.'
    },
    penicillinAllergyOption: {
      regimen: 'IV Ciprofloxacin 400mg BD + IV Metronidazole 500mg TDS',
      routeAndDose: 'IV Ciprofloxacin 400mg Q12H + IV Metronidazole 500mg Q8H',
      remarks: 'Alternatif: IV Gentamicin 5mg/kg OD + IV Metronidazole 500mg TDS.'
    },
    oralStepDownOption: {
      regimen: 'Oral Sultamicillin 750mg BD atau Oral Augmentin 625mg TDS + Oral Metronidazole 400mg TDS',
      criteria: 'Peristalsis usus pulih (bowel opened), saliran pembedahan minimal, tiada demam 48 jam.'
    },
    amsNotes: [
      'Hentikan antibiotik pada 4 hari jika kawalan sumber jangkitan telah dicapai (protokol ujian klinikal STOP-IT).',
      'Hantar cecair peritoneum / nanah untuk kultur aerobik dan anaerobik.'
    ],
    evidenceLevel: 'Grade A (NAG 2024 / SIS/IDSA Guidelines)'
  },
  {
    id: 'NAG-SAP-001',
    bodySystem: 'Surgical Prophylaxis (SAP)',
    conditionName: 'Surgical Antibiotic Prophylaxis (Profilaksis Pembedahan Bersih-Tercemar & Ortopedik)',
    setting: 'Surgical Prophylaxis',
    primaryPathogens: [
      'Staphylococcus aureus (MSSA)',
      'Coagulase-negative Staphylococci',
      'Enterobacteriaceae (pembedahan GI / Ginekologi)',
      'Anaerobes (pembedahan Kolorektal)'
    ],
    firstLineTherapy: {
      regimen: 'IV Cefazolin 2g (3g if weight >120kg) within 30 - 60 minutes prior to surgical incision',
      routeAndDose: 'IV Cefazolin 2g bolus perlahan 30-60 minit sebelum insisi kulit. Ulang dos pada 4 jam jika pembedahan berpanjangan.',
      durationDays: 'Single pre-operative dose (Maksimum 24 jam pasca-pembedahan)',
      remarks: 'Pembedahan Kolorektal: Tambah IV Metronidazole 500mg dos tunggal.'
    },
    secondLineTherapy: {
      regimen: 'IV Ampicillin/Sulbactam 1.5g – 3.0g or IV Cefuroxime 1.5g pre-incision',
      routeAndDose: 'IV Ampicillin/Sulbactam 1.5g – 3.0g dalam 60 minit sebelum insisi pembedahan (terutamanya pembedahan Biliari / Kepala & Leher). Ulang pada 4 jam.',
      durationDays: 'Dos tunggal pra-pembedahan',
      remarks: 'Pemberian antibiotik profilaksis melebihi 24 jam selepas pembedahan adalah DILARANG mengikut polisi AMS KKM.'
    },
    penicillinAllergyOption: {
      regimen: 'IV Vancomycin 15mg/kg (mulakan 120 minit sebelum insisi) or IV Clindamycin 900mg',
      routeAndDose: 'IV Vancomycin 1g – 1.5g infusi lebih 1-2 jam sebelum insisi (+ Gentamicin 5mg/kg jika kes GI)',
      remarks: 'Infusi Vancomycin mesti tamat sebelum pisau menyentuh kulit bagi mencapai kepekatan tisu yang mencukupi.'
    },
    amsNotes: [
      'Masa pemberian amat kritikal: Mesti diberikan dalam tempoh 30-60 minit sebelum insisi pembedahan bermula.',
      'Dos ulangan intra-operatif diperlukan jika pendarahan melebihi 1,500 mL atau tempoh pembedahan melebihi 2 kali separuh hayat ubat.'
    ],
    evidenceLevel: 'Grade A (NAG 2024 / WHO SAP Guidelines)'
  },
  {
    id: 'NAG-CNS-001',
    bodySystem: 'Central Nervous System (CNS)',
    conditionName: 'Acute Bacterial Meningitis (Meningitis Bakteria Dewasa Komuniti)',
    setting: 'Community-Acquired',
    primaryPathogens: [
      'Streptococcus pneumoniae',
      'Neisseria meningitidis',
      'Listeria monocytogenes (pada warga emas >50 tahun & pesakit imunokompromais)'
    ],
    firstLineTherapy: {
      regimen: 'IV Ceftriaxone 2g Q12H (high dose) + IV Vancomycin 15-20mg/kg Q8-12H + IV Dexamethasone 10mg',
      routeAndDose: 'IV Ceftriaxone 2g BD + IV Vancomycin (trough 15-20 mcg/mL). Tambah IV Ampicillin 2g Q4H jika umur >50 tahun (Listeria).',
      durationDays: '10 - 14 days (21 hari untuk Listeria)',
      remarks: 'Berikan IV Dexamethasone 10mg 15-30 minit sebelum atau serentak dengan dos antibiotik pertama untuk S. pneumoniae.'
    },
    secondLineTherapy: {
      regimen: 'IV Meropenem 2g Q8H (meningitic dose) + IV Vancomycin',
      routeAndDose: 'IV Meropenem 2g Q8H infusi berpanjangan 3 jam.',
      durationDays: '10 - 14 days',
      remarks: 'Digunakan jika disyaki rintangan beta-laktamase atau meningitis berkaitan prosedur neurosurgeri/hospital.'
    },
    penicillinAllergyOption: {
      regimen: 'IV Chloramphenicol 25mg/kg Q6H + IV Vancomycin',
      routeAndDose: 'IV Chloramphenicol 1g Q6H + IV Vancomycin 15-20mg/kg Q12H',
      remarks: 'Pantau FBC untuk penindasan sumsum tulang.'
    },
    amsNotes: [
      'Jangan lengahkan antibiotik untuk prosedur LP atau CT scan jika pesakit tidak stabil; ambil kultur darah dengan segera.'
    ],
    evidenceLevel: 'Grade A (NAG 2024 / ESCMID Guidelines)'
  },
  {
    id: 'NAG-BONE-001',
    bodySystem: 'Bone & Joint',
    conditionName: 'Acute Osteomyelitis & Septic Arthritis (Jangkitan Tulang & Sendi)',
    setting: 'Community-Acquired',
    primaryPathogens: [
      'Staphylococcus aureus (MSSA & MRSA)',
      'Streptococcus spp.',
      'Enterobacterales & Pseudomonas (in diabetic foot / prosthetic joints)',
      'Kingella kingae (in young children)'
    ],
    firstLineTherapy: {
      regimen: 'IV Cloxacillin 2g Q4-6H (or IV Cefazolin 2g Q8H)',
      routeAndDose: 'IV Cloxacillin 2g Q4-6H dos tinggi (tambah IV Ceftriaxone 2g OD jika risiko kuman Gram-negatif / pesakit diabetes).',
      durationDays: '4 - 6 weeks (Osteomyelitis); 3 - 4 weeks (Septic Arthritis)',
      remarks: 'Saliran nanah sendi (arthrotomy/arthrocentesis) atau debridement sekuestrum tulang adalah wajib.'
    },
    secondLineTherapy: {
      regimen: 'IV Vancomycin 15-20mg/kg Q12H (target trough 15-20 mcg/mL) or IV Daptomycin 6-8mg/kg OD',
      routeAndDose: 'IV Vancomycin 1g – 1.5g Q12H (atau IV Daptomycin 6-8mg/kg OD) jika MRSA disahkan.',
      durationDays: '4 - 6 weeks',
      remarks: 'Pantau paras palung (trough level) dan fungsi buah pinggang mingguan.'
    },
    penicillinAllergyOption: {
      regimen: 'IV Clindamycin 600mg Q8H or IV Vancomycin 15-20mg/kg Q12H',
      routeAndDose: 'IV Clindamycin 600mg Q8H (penembusan tisu tulang yang sangat tinggi)',
      remarks: 'Pilihan step-down oral: Oral Clindamycin 450mg TDS.'
    },
    amsNotes: [
      'Pantau penanda keradangan (CRP dan ESR) setiap minggu untuk menilai respons terapi sebelum penukaran oral.'
    ],
    evidenceLevel: 'Grade A (NAG 2024 / IDSA Guidelines)'
  },
  {
    id: 'NAG-SEP-001',
    bodySystem: 'Cardiovascular / Sepsis',
    conditionName: 'Sepsis of Unknown Origin & Demam Neutropenia (Febrile Neutropenia)',
    setting: 'Hospital-Acquired (HAP/VAP)',
    primaryPathogens: [
      'Pseudomonas aeruginosa',
      'Enterobacteriaceae (ESBL / AmpC)',
      'Staphylococcus aureus',
      'Viridans Streptococci'
    ],
    firstLineTherapy: {
      regimen: 'IV Piperacillin/Tazobactam 4.5g Q6H (extended infusion) or IV Cefepime 2g Q8H',
      routeAndDose: 'IV Tazocin 4.5g Q6H infusi berpanjangan 3 jam (atau IV Cefepime 2g Q8H infusi 30 min). Berikan dalam 1 JAM pertama pengesanan sepsis.',
      durationDays: '7 days (atau sehingga kiraan neutrofil ANC > 500/mcL dan pesakit afebrile 48 jam)',
      remarks: 'Kecemasan perubatan; mulakan antibiotik antipseudomonal spektrum luas serta-merta.'
    },
    secondLineTherapy: {
      regimen: 'IV Meropenem 1g – 2g Q8H (3-hr extended infusion) + IV Vancomycin (if septic shock or catheter sepsis)',
      routeAndDose: 'IV Meropenem 1g Q8H extended infusion + IV Vancomycin 15-20mg/kg Q12H.',
      durationDays: '7 - 14 days',
      remarks: 'Untuk pesakit dalam syok septik hemodinamik tidak stabil atau kemerosotan klinikal selepas 48 jam rawatan pertama.'
    },
    penicillinAllergyOption: {
      regimen: 'IV Ciprofloxacin 400mg Q8H or IV Aztreonam 2g Q8H + IV Vancomycin',
      routeAndDose: 'IV Ciprofloxacin 400mg Q8H + IV Vancomycin 15mg/kg Q12H',
      remarks: 'Pastikan liputan antipseudomonal Gram-negatif mencukupi.'
    },
    amsNotes: [
      'Hantar sekurang-kurangnya 2 set kultur darah (daripada venipuncture dan central venous catheter line) sebelum dos pertama.',
      'Hentikan Vancomycin pada 48 jam jika tiada bukti jangkitan Gram-positif rintang / MRSA.'
    ],
    evidenceLevel: 'Grade A (NAG 2024 / IDSA/Surviving Sepsis Guidelines)'
  }
]

/**
 * Helper function to retrieve all matching NAG infection treatment plans for a given antimicrobial drug
 */
export function getGuidelinesForDrug(genericName: string, antimicrobialClass?: string): NAGInfectionGuideline[] {
  const name = (genericName || '').toLowerCase()
  const cls = (antimicrobialClass || '').toLowerCase()

  return NAG_GUIDELINES.filter(g => {
    const text = JSON.stringify(g).toLowerCase()

    if (name.includes('ampicillin') && name.includes('sulbactam')) {
      return text.includes('ampicillin/sulbactam') || text.includes('unasyn')
    }
    if (name.includes('amoxicillin') && (name.includes('clavulanate') || name.includes('clavulanic'))) {
      return text.includes('amoxicillin/clavulanate') || text.includes('co-amoxiclav') || text.includes('augmentin')
    }
    if (name.includes('piperacillin') && name.includes('tazobactam')) {
      return text.includes('piperacillin/tazobactam') || text.includes('tazocin')
    }
    if (name.includes('cloxacillin')) {
      return text.includes('cloxacillin')
    }
    if (name.includes('ceftriaxone')) {
      return text.includes('ceftriaxone')
    }
    if (name.includes('cefuroxime')) {
      return text.includes('cefuroxime')
    }
    if (name.includes('cefazolin')) {
      return text.includes('cefazolin')
    }
    if (name.includes('ceftazidime')) {
      return text.includes('ceftazidime')
    }
    if (name.includes('cefepime')) {
      return text.includes('cefepime')
    }
    if (name.includes('cefoperazone')) {
      return text.includes('cefoperazone')
    }
    if (name.includes('meropenem')) {
      return text.includes('meropenem')
    }
    if (name.includes('ertapenem')) {
      return text.includes('ertapenem')
    }
    if (name.includes('imipenem')) {
      return text.includes('imipenem')
    }
    if (name.includes('vancomycin')) {
      return text.includes('vancomycin')
    }
    if (name.includes('teicoplanin')) {
      return text.includes('vancomycin') || text.includes('teicoplanin')
    }
    if (name.includes('clindamycin')) {
      return text.includes('clindamycin')
    }
    if (name.includes('metronidazole')) {
      return text.includes('metronidazole')
    }
    if (name.includes('ciprofloxacin')) {
      return text.includes('ciprofloxacin')
    }
    if (name.includes('levofloxacin')) {
      return text.includes('levofloxacin')
    }
    if (name.includes('moxifloxacin')) {
      return text.includes('moxifloxacin')
    }
    if (name.includes('azithromycin')) {
      return text.includes('azithromycin')
    }
    if (name.includes('clarithromycin') || name.includes('erythromycin')) {
      return text.includes('clarithromycin') || text.includes('azithromycin') || text.includes('macrolide')
    }
    if (name.includes('amikacin')) {
      return text.includes('amikacin')
    }
    if (name.includes('gentamicin')) {
      return text.includes('gentamicin') || text.includes('amikacin')
    }
    if (name.includes('colistin') || name.includes('polymyxin')) {
      return text.includes('colistin') || text.includes('polymyxin')
    }
    if (name.includes('nitrofurantoin')) {
      return text.includes('nitrofurantoin')
    }
    if (name.includes('sultamicillin')) {
      return text.includes('sultamicillin') || text.includes('ampicillin/sulbactam') || text.includes('unasyn')
    }
    if (name.includes('cephalexin')) {
      return text.includes('cephalexin') || text.includes('cefazolin')
    }

    if (cls.includes('carbapenem')) return text.includes('meropenem') || text.includes('ertapenem')
    if (cls.includes('glycopeptide')) return text.includes('vancomycin')
    if (cls.includes('fluoroquinolone')) return text.includes('ciprofloxacin') || text.includes('levofloxacin')
    if (cls.includes('aminoglycoside')) return text.includes('amikacin') || text.includes('gentamicin')

    return false
  })
}

