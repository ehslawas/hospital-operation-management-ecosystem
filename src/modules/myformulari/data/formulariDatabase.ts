import { DrugEntry } from '../types/formulariTypes'
import officialFukkmData from './officialFukkmData.json'

const DETAILED_SPECIALIST_MONOGRAPHS: DrugEntry[] = [
  // 1. Concentrated Electrolyte - KCl (HAM CRITICAL)
  {
    id: 'DRUG-HAM-001',
    genericName: 'Potassium Chloride',
    brandNames: ['KCl Injection 1g/10mL', 'Kalium Klorida'],
    mohDrugCode: 'KKM-ELEC-0001',
    atcCode: 'B05XA01',
    atcCategory: 'Blood and Blood Forming Organs - Electrolyte Solutions',
    therapeuticClass: 'Electrolyte Replacement',
    prescriberCategory: 'A',
    poisonCategory: 'Group B',
    skimPerolehan: 'APPL',
    dosageForms: ['Concentrate for Infusion Ampoule'],
    strengths: ['1g/10mL (13.4 mmol K+ and Cl- per 10mL)'],
    indications: [
      'Treatment and prevention of hypokalaemia',
      'Electrolyte rebalancing in total parenteral nutrition'
    ],
    contraindications: [
      'Hyperkalaemia (plasma K+ > 5.0 mmol/L)',
      'Severe renal impairment / anuria',
      'Untreated Addison disease',
      'Severe dehydration / acute oliguria'
    ],
    standardDosage: {
      adult: 'Target deficit replacement: Standard infusion 20-40 mmol in 500-1000 mL saline. Maximum rate without cardiac monitoring: 10 mmol/hr. Max rate with ECG monitoring in ICU: 20 mmol/hr.',
      pediatric: '0.5 - 1 mmol/kg diluted in maintenance fluid, max rate 0.5 mmol/kg/hr.',
      elderlyOrRenal: 'Reduce rate by 50% and monitor ECG and serum potassium continuously in renal impairment.'
    },
    administrationRoutes: ['IV Infusion ONLY (NEVER IV BOLUS OR DIRECT PUSH)'],
    sideEffects: [
      'Fatal cardiac arrhythmia (asystole, ventricular fibrillation)',
      'Severe phlebitis and burning pain at infusion site',
      'Hyperkalaemia',
      'Extravasation tissue necrosis'
    ],
    cautionsAndWarnings: [
      'NEVER GIVE UNDILUTED AS IV INJECTION — RAPID DIRECT IV INJECTION IS FATAL.',
      'Must be thoroughly mixed in infusion bag before administration.',
      'Central venous line preferred for concentrations > 40 mmol/L to avoid peripheral phlebitis.'
    ],
    isHAM: true,
    hamCategory: 'Concentrated Electrolyte',
    hamRiskLevel: 'CRITICAL',
    hamPrecautions: [
      'STRICTLY PROHIBITED AS WARD FLOOR STOCK in general wards (stored only in Pharmacy/ICU/OT with key).',
      'Requires bright RED "HIGH ALERT MEDICATION - CONCENTRATED ELECTROLYTE" warning label.',
      'Mandatory INDEPENDENT DOUBLE-CHECK (IDC) by two registered nurses/pharmacists before mixing and administration.',
      'Infusion MUST be administered using an electronic volumetric infusion pump with rate limiter.'
    ],
    isLASA: false,
    interactions: [
      {
        interactingDrug: 'Spironolactone / Eplerenone',
        severity: 'CRITICAL',
        effect: 'Severe, potentially life-threatening hyperkalaemia due to potassium-sparing effect.',
        management: 'Avoid concurrent use or monitor serum potassium daily.'
      },
      {
        interactingDrug: 'ACE Inhibitors (Perindopril, Ramipril, Enalapril)',
        severity: 'MAJOR',
        effect: 'Additive potassium retention leading to hyperkalaemia.',
        management: 'Frequent potassium monitoring, reduce potassium replacement dose.'
      },
      {
        interactingDrug: 'Digoxin',
        severity: 'MAJOR',
        effect: 'Both hyperkalaemia and hypokalaemia alter digoxin toxicity and arrhythmia risk.',
        management: 'Maintain serum K+ strictly between 4.0 - 5.0 mmol/L in digitalized patients.'
      }
    ],
    reconstitution: {
      isApplicable: false
    },
    dilution: {
      isApplicable: true,
      compatibleDiluents: ['0.9% Sodium Chloride (NS)', '5% Dextrose in Water (D5W)', '0.45% Sodium Chloride'],
      incompatibleDiluents: ['Lipid emulsions', 'Mannitol 20%', 'Sodium Bicarbonate 8.4%'],
      standardDilution: {
        doseRange: '10 - 40 mmol',
        volume: '500 mL or 1000 mL 0.9% NaCl',
        finalConcentration: 'Standard peripheral line max: 40 mmol/L (0.3% w/v). Central line: Up to 80 mmol/L.',
        route: 'IV Infusion',
        infusionDuration: 'Infuse at max 10 mmol/hr peripherally (or max 20 mmol/hr in ICU with continuous ECG).',
        maxConcentrationFluidRestricted: '80 mmol/L via central line only.',
        syringePumpCompatible: true
      },
      ySiteCompatibility: {
        compatible: ['Frusemide', 'Heparin', 'Morphine', 'Metronidazole', 'Ceftriaxone'],
        incompatible: ['Diazepam', 'Phenytoin', 'Amphotericin B'],
        requiresSeparateLine: false
      },
      monitoringParameters: [
        'Serum potassium (baseline and post-infusion)',
        'Continuous ECG monitoring if infusion rate > 10 mmol/hr',
        'Urine output (ensure > 0.5 mL/kg/hr before aggressive repletion)',
        'IV cannulation site for thrombophlebitis and extravasation'
      ]
    },
    shelfLife: {
      intactShelfLife: '36 months from manufacture date',
      storageConditions: {
        temperature: 'Room Temperature (15-30°C)',
        protectFromLight: false,
        protectFromMoisture: false,
        specialStorageNote: 'Locked Poison Cabinet / Restricted Access Drug Store only.'
      },
      postReconstitutionStability: {
        roomTempDuration: 'N/A',
        refrigeratedDuration: 'N/A'
      },
      postDilutionStability: {
        roomTempDuration: 'Use within 24 hours once mixed into IV bag (must be properly labelled).',
        refrigeratedDuration: '24 hours at 2-8°C'
      },
      multiDoseVialPolicy: 'Single Use Only - Discard Remainder'
    },
    quota: {
      monthlyQuota: 1500,
      quotaUsed: 980,
      quotaRemaining: 520,
      unit: 'Ampoules',
      lowStockThreshold: 300,
      isLowStock: false,
      isCriticalShortage: false,
      estimatedRunOutDays: 16,
      lastRestockedDate: '2026-08-10',
      bufferStockLevel: 250
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-ELEC-002',
        drugName: 'Premixed Potassium Chloride 0.15% in 0.9% NaCl (20mmol K+ in 1L)',
        prescriberCategory: 'A',
        therapeuticEquivalence: 'Exact Substitute',
        reasonForChoice: 'Safer ready-to-infuse premixed commercial solution, avoids manual ward compounding risks.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-15',
    verifiedBy: 'Senior Clinical Pharmacist (Medication Safety Committee)'
  },

  // 2. IV Inotrope - DOBUTamine (HAM + LASA)
  {
    id: 'DRUG-HAM-002',
    genericName: 'Dobutamine Hydrochloride',
    brandNames: ['Dobutrex', 'Dobutamine Injection 250mg/20mL'],
    mohDrugCode: 'KKM-CARD-0002',
    atcCode: 'C01CA07',
    atcCategory: 'Cardiovascular System - Cardiac Stimulants',
    therapeuticClass: 'Inotropic Agent (Beta-1 Agonist)',
    prescriberCategory: 'A*',
    poisonCategory: 'Group B',
    skimPerolehan: 'APPL',
    dosageForms: ['Concentrate for Infusion Vial / Ampoule'],
    strengths: ['250mg/20mL (12.5 mg/mL)'],
    indications: [
      'Inotropic support in cardiogenic shock',
      'Severe acute decompensated heart failure with low cardiac output',
      'Post-cardiac surgery myocardial depression'
    ],
    contraindications: [
      'Idiopathic hypertrophic subaortic stenosis (HOCM)',
      'Severe mechanical obstruction (e.g., severe aortic stenosis)',
      'Uncorrected hypovolaemia'
    ],
    standardDosage: {
      adult: 'Initial rate: 2.5 mcg/kg/min IV infusion, titrate by 2.5 mcg/kg/min every 15-30 min based on clinical response. Usual maintenance: 2.5 - 15 mcg/kg/min (Max: 40 mcg/kg/min).',
      pediatric: 'Initial 5 mcg/kg/min, titrate between 2 - 20 mcg/kg/min.',
      elderlyOrRenal: 'Start at lower end of dosing range, titrate cautiously with continuous haemodynamic monitoring.'
    },
    administrationRoutes: ['Continuous IV Infusion ONLY (via syringe pump or volumetric pump)'],
    sideEffects: [
      'Tachycardia and tachyarrhythmias (VT, AF, ventricular ectopics)',
      'Blood pressure fluctuations (hypertension or reflex hypotension)',
      'Anginal chest pain',
      'Hypokalaemia'
    ],
    cautionsAndWarnings: [
      'Must correct hypovolaemia prior to initiation.',
      'Tachyphylaxis may develop during prolonged infusions (> 72 hours).'
    ],
    isHAM: true,
    hamCategory: 'IV Adrenergic Agonist / Inotrope',
    hamRiskLevel: 'HIGH',
    hamPrecautions: [
      'Requires high-alert medication sticker.',
      'Independent double check of dose calculation (mcg/kg/min vs mL/hr).',
      'Continuous arterial line / ECG monitoring recommended in HDU/ICU.'
    ],
    isLASA: true,
    tallManName: 'DOBUTamine',
    lasaPairs: [
      {
        confusedWith: 'Dopamine Hydrochloride',
        confusionType: 'both',
        tallManThis: 'DOBUTamine',
        tallManOther: 'DOPAmine',
        clinicalRiskWarning: 'Dobutamine is primarily an inotrope with peripheral vasodilation (beta-1 > beta-2), whereas Dopamine has dose-dependent alpha-vasoconstrictor and dopaminergic actions. Confusion may result in profound shock or severe hypertension.',
        separationStrategy: 'Separate bin storage in CCU/ICU emergency drug tray with high-visibility TALL-MAN lettering and orange/red warning labels.'
      }
    ],
    interactions: [
      {
        interactingDrug: 'Beta Blockers (Metoprolol, Bisoprolol, Carvedilol)',
        severity: 'MAJOR',
        effect: 'Antagonism of dobutamine inotropic effects; unmasked alpha-adrenergic vasoconstriction.',
        management: 'Consider Phosphodiesterase inhibitors (Milrinone) instead if patient on chronic beta-blockade.'
      },
      {
        interactingDrug: 'MAO Inhibitors (Selegiline, Phenelzine)',
        severity: 'CRITICAL',
        effect: 'Severe exaggerated hypertensive response and arrhythmia risk.',
        management: 'Dose must be drastically reduced to 1/10th of usual dose and titrated very slowly.'
      }
    ],
    reconstitution: {
      isApplicable: false
    },
    dilution: {
      isApplicable: true,
      compatibleDiluents: ['5% Dextrose in Water (D5W)', '0.9% Sodium Chloride (NS)', '0.45% Sodium Chloride'],
      incompatibleDiluents: ['5% Sodium Bicarbonate (alkaline solution decomposes dobutamine)', 'Aminophylline', 'Frusemide'],
      standardDilution: {
        doseRange: '250mg or 500mg',
        volume: '50 mL in 50mL Luer-lock Syringe (for syringe pump) or 250mL D5W bag',
        finalConcentration: 'Standard syringe pump: 250mg in 50mL = 5,000 mcg/mL (5 mg/mL).',
        route: 'Continuous Infusion',
        infusionDuration: 'Continuous titrated infusion',
        maxConcentrationFluidRestricted: '10,000 mcg/mL (500mg in 50mL) via central venous catheter.',
        syringePumpCompatible: true
      },
      ySiteCompatibility: {
        compatible: ['Adrenaline', 'Noradrenaline', 'Amiodarone', 'Milrinone', 'Heparin', 'Morphine'],
        incompatible: ['Sodium Bicarbonate', 'Frusemide', 'Phenytoin', 'Hydrocortisone', 'Indomethacin'],
        requiresSeparateLine: false
      },
      monitoringParameters: [
        'Continuous ECG & Heart Rate',
        'Invasive arterial blood pressure (BP)',
        'Central venous pressure (CVP) / Cardiac output index',
        'Urine output hourly',
        'Serum potassium and blood lactate'
      ]
    },
    shelfLife: {
      intactShelfLife: '24 months from manufacture date',
      storageConditions: {
        temperature: 'Room Temperature (15-30°C)',
        protectFromLight: true,
        protectFromMoisture: true,
        specialStorageNote: 'Store in original outer carton. Solution may turn pink due to slight oxidation but potency is unaffected.'
      },
      postReconstitutionStability: {
        roomTempDuration: 'N/A',
        refrigeratedDuration: 'N/A'
      },
      postDilutionStability: {
        roomTempDuration: '24 hours at 25°C',
        refrigeratedDuration: '48 hours at 2-8°C'
      },
      multiDoseVialPolicy: 'Single Use Only - Discard Remainder'
    },
    quota: {
      monthlyQuota: 300,
      quotaUsed: 210,
      quotaRemaining: 90,
      unit: 'Vials',
      lowStockThreshold: 60,
      isLowStock: false,
      isCriticalShortage: false,
      estimatedRunOutDays: 12,
      lastRestockedDate: '2026-08-01',
      bufferStockLevel: 50
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-CARD-003',
        drugName: 'Milrinone Lactate 10mg/10mL',
        prescriberCategory: 'A*',
        therapeuticEquivalence: 'Alternative Second-Line',
        reasonForChoice: 'Inodilator suitable for patients on beta-blockers or with pulmonary hypertension.',
        stockStatus: 'In Stock'
      },
      {
        drugId: 'DRUG-HAM-003',
        drugName: 'Dopamine Hydrochloride 200mg/5mL',
        prescriberCategory: 'A*',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Provides both inotropic and vasopressor support when hypotension is accompanied by cardiogenic shock.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-20',
    verifiedBy: 'Cardiology Clinical Pharmacist & ICU Specialist'
  },

  // 3. IV Inotrope / Vasopressor - DOPAmine (HAM + LASA)
  {
    id: 'DRUG-HAM-003',
    genericName: 'Dopamine Hydrochloride',
    brandNames: ['Intropin', 'Dopamine Injection 200mg/5mL'],
    mohDrugCode: 'KKM-CARD-0003',
    atcCode: 'C01CA04',
    atcCategory: 'Cardiovascular System - Cardiac Stimulants',
    therapeuticClass: 'Inotrope & Vasopressor (Adrenergic & Dopaminergic Agonist)',
    prescriberCategory: 'A*',
    poisonCategory: 'Group B',
    skimPerolehan: 'APPL',
    dosageForms: ['Concentrate for Infusion Ampoule'],
    strengths: ['200mg/5mL (40 mg/mL)'],
    indications: [
      'Haemodynamic support in septic, cardiogenic, or trauma shock after fluid resuscitation',
      'Symptomatic bradycardia refractory to atropine'
    ],
    contraindications: [
      'Phaeochromocytoma',
      'Uncorrected tachyarrhythmias or ventricular fibrillation',
      'Hypovolaemia (without adequate volume replacement)'
    ],
    standardDosage: {
      adult: 'Low dose (1-3 mcg/kg/min): Dopaminergic (renal/splanchnic vasodilation - no longer recommended for renoprotection). Intermediate (3-10 mcg/kg/min): Inotropic beta-1 action. High dose (>10-20 mcg/kg/min): Alpha-1 vasoconstriction.',
      pediatric: 'Initial 2-5 mcg/kg/min, titrate up to 20 mcg/kg/min.',
      elderlyOrRenal: 'Titrate carefully; older patients are prone to extreme tachyarrhythmias.'
    },
    administrationRoutes: ['Continuous IV Infusion ONLY (Central line preferred)'],
    sideEffects: [
      'Severe tachycardia, ventricular ectopy, and atrial fibrillation',
      'Peripheral gangrene / digital ischaemia at high doses',
      'Tissue necrosis if extravasated',
      'Nausea and vomiting'
    ],
    cautionsAndWarnings: [
      'EXTENDED HIGH DOSES CAUSE SEVERE PERIPHERAL VASOCONSTRICTION AND GANGRENE.',
      'Antidote for extravasation: Phentolamine 5-10mg in 10-15mL NS infiltrated subcutaneously within 12 hours.'
    ],
    isHAM: true,
    hamCategory: 'IV Adrenergic Agonist / Inotrope',
    hamRiskLevel: 'HIGH',
    hamPrecautions: [
      'Requires high-alert medication sticker and independent double-check.',
      'Must use electronic dedicated syringe pump with pressure sensor.'
    ],
    isLASA: true,
    tallManName: 'DOPAmine',
    lasaPairs: [
      {
        confusedWith: 'Dobutamine Hydrochloride',
        confusionType: 'both',
        tallManThis: 'DOPAmine',
        tallManOther: 'DOBUTamine',
        clinicalRiskWarning: 'Dopamine has potent alpha-1 vasoconstrictor action at doses >10 mcg/kg/min unlike Dobutamine. Mismatch in patients with severe heart failure can trigger acute pulmonary oedema due to increased afterload.',
        separationStrategy: 'Separate storage trays in resuscitation trolleys and critical care drug cupboards.'
      }
    ],
    interactions: [
      {
        interactingDrug: 'Ergot Alkaloids (Ergotamine, Ergometrine)',
        severity: 'CRITICAL',
        effect: 'Extreme peripheral gangrene and severe hypertension.',
        management: 'Strictly avoid combination.'
      },
      {
        interactingDrug: 'Halogenated Inhalation Anaesthetics (Halothane, Isoflurane)',
        severity: 'MAJOR',
        effect: 'Increased myocardial sensitivity leading to severe ventricular arrhythmias.',
        management: 'Reduce dopamine dose and monitor continuous ECG during anaesthesia.'
      }
    ],
    reconstitution: {
      isApplicable: false
    },
    dilution: {
      isApplicable: true,
      compatibleDiluents: ['5% Dextrose in Water (D5W)', '0.9% Sodium Chloride (NS)', 'Hartmanns (RL)'],
      incompatibleDiluents: ['5% Sodium Bicarbonate (alkaline solutions inactivate dopamine)', 'Frusemide', 'Amphotericin B'],
      standardDilution: {
        doseRange: '200mg or 400mg',
        volume: '50 mL in 50mL Luer-lock Syringe or 250mL D5W',
        finalConcentration: 'Standard syringe pump: 200mg in 50mL = 4,000 mcg/mL (4 mg/mL). High concentration: 8,000 mcg/mL.',
        route: 'Continuous Infusion',
        infusionDuration: 'Continuous titrated infusion',
        maxConcentrationFluidRestricted: '8,000 mcg/mL (400mg in 50mL) via central venous catheter.',
        syringePumpCompatible: true
      },
      ySiteCompatibility: {
        compatible: ['Adrenaline', 'Noradrenaline', 'Amiodarone', 'Heparin', 'Morphine', 'Midazolam'],
        incompatible: ['Sodium Bicarbonate', 'Frusemide', 'Acyclovir', 'Indomethacin'],
        requiresSeparateLine: false
      },
      monitoringParameters: [
        'Continuous invasive arterial blood pressure',
        'Continuous ECG & Heart rate',
        'Peripheral perfusion, capillary refill time, extremities temperature',
        'Hourly urine output',
        'Serum lactate'
      ]
    },
    shelfLife: {
      intactShelfLife: '36 months from manufacture date',
      storageConditions: {
        temperature: 'Room Temperature (15-30°C)',
        protectFromLight: true,
        protectFromMoisture: true,
        specialStorageNote: 'Do not use if solution is discoloured (darker than slightly yellow).'
      },
      postReconstitutionStability: {
        roomTempDuration: 'N/A',
        refrigeratedDuration: 'N/A'
      },
      postDilutionStability: {
        roomTempDuration: '24 hours at 25°C',
        refrigeratedDuration: '48 hours at 2-8°C'
      },
      multiDoseVialPolicy: 'Single Use Only - Discard Remainder'
    },
    quota: {
      monthlyQuota: 250,
      quotaUsed: 195,
      quotaRemaining: 55,
      unit: 'Ampoules',
      lowStockThreshold: 50,
      isLowStock: false,
      isCriticalShortage: false,
      estimatedRunOutDays: 9,
      lastRestockedDate: '2026-08-05',
      bufferStockLevel: 40
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-HAM-004',
        drugName: 'Noradrenaline (Norepinephrine) Bitartrate 4mg/4mL',
        prescriberCategory: 'A*',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'First-line vasopressor of choice for Septic Shock per Surviving Sepsis Campaign guidelines.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-18',
    verifiedBy: 'Emergency & Critical Care Clinical Pharmacist'
  },

  // 4. IV Vasopressor - Noradrenaline (HAM CRITICAL)
  {
    id: 'DRUG-HAM-004',
    genericName: 'Noradrenaline (Norepinephrine) Acid Tartrate',
    brandNames: ['Levophed', 'Noradrenaline Injection 4mg/4mL'],
    mohDrugCode: 'KKM-CARD-0004',
    atcCode: 'C01CA03',
    atcCategory: 'Cardiovascular System - Adrenergic and Dopaminergic Agents',
    therapeuticClass: 'Potent Vasopressor (Alpha-1 > Beta-1 Agonist)',
    prescriberCategory: 'A*',
    poisonCategory: 'Group B',
    skimPerolehan: 'APPL',
    dosageForms: ['Concentrate for Infusion Ampoule'],
    strengths: ['4mg/4mL (equivalent to 1 mg/mL noradrenaline base)'],
    indications: [
      'First-line vasopressor for Septic Shock and distributive shock refractory to fluid loading',
      'Neurogenic shock and severe vasodilatory hypotension'
    ],
    contraindications: [
      'Uncorrected hypovolaemia',
      'Mesenteric or peripheral vascular thrombosis (except as emergency life-saving measure)'
    ],
    standardDosage: {
      adult: 'Initial infusion rate: 0.05 - 0.1 mcg/kg/min (approx 2 - 4 mcg/min). Titrate rapidly every 2-5 minutes to achieve target Mean Arterial Pressure (MAP ≥ 65 mmHg). Usual dose: 0.05 - 0.5 mcg/kg/min (high doses up to 1-2 mcg/kg/min in refractory shock).',
      pediatric: '0.05 - 0.1 mcg/kg/min, titrate up to 1 mcg/kg/min.',
      elderlyOrRenal: 'Titrate to clinical endpoints; high risk of peripheral ischaemia.'
    },
    administrationRoutes: ['Continuous IV Infusion via CENTRAL LINE ONLY (Peripheral line emergency bridge max 2-4 hours only)'],
    sideEffects: [
      'Profound peripheral and visceral vasoconstriction (limb/gut ischaemia)',
      'Severe tissue necrosis if extravasated from peripheral line',
      'Reflex bradycardia',
      'Arrhythmias and hypertension'
    ],
    cautionsAndWarnings: [
      'CENTRAL VENOUS ACCESS IS MANDATORY — Peripheral line infusion carries severe risk of skin sloughing and necrosis.',
      'Extravasation protocol: Infiltrate Phentolamine 5-10mg in 10mL NS immediately.'
    ],
    isHAM: true,
    hamCategory: 'IV Adrenergic Agonist / Inotrope',
    hamRiskLevel: 'CRITICAL',
    hamPrecautions: [
      'CRITICAL HIGH ALERT MEDICATION — Requires distinct RED labelling.',
      'Mandatory double check of rate, syringe concentration, and pump programming.',
      'Must have Dedicated Central Lumen with back-check valve.'
    ],
    isLASA: false,
    interactions: [
      {
        interactingDrug: 'Tricyclic Antidepressants (Amitriptyline, Imipramine)',
        severity: 'CRITICAL',
        effect: 'Blockade of noradrenaline reuptake causing marked hypertension and cardiac dysrhythmias.',
        management: 'Extreme caution, titrate at 1/5th the standard initial dose.'
      },
      {
        interactingDrug: 'Non-selective Beta Blockers (Propranolol)',
        severity: 'MAJOR',
        effect: 'Unopposed severe alpha-1 vasoconstriction and marked reflex bradycardia.',
        management: 'Use caution, monitor MAP and cardiac output closely.'
      }
    ],
    reconstitution: {
      isApplicable: false
    },
    dilution: {
      isApplicable: true,
      compatibleDiluents: ['5% Dextrose in Water (D5W)', '5% Dextrose in 0.9% Saline (D5NS) — Dextrose protects against oxidation'],
      incompatibleDiluents: ['0.9% NaCl alone is not recommended by manufacturer without dextrose as oxidation occurs faster', 'Alkaline solutions (Sodium Bicarbonate)'],
      standardDilution: {
        doseRange: '4mg or 8mg',
        volume: '50 mL D5W in 50mL Syringe (for syringe pump) or 100mL D5W bag',
        finalConcentration: 'Standard single strength: 4mg in 50mL = 80 mcg/mL (0.08 mg/mL). Double strength: 8mg in 50mL = 160 mcg/mL.',
        route: 'Continuous Infusion',
        infusionDuration: 'Continuous titrated infusion',
        maxConcentrationFluidRestricted: '160 mcg/mL (8mg in 50mL D5W) via Central Venous Line.',
        syringePumpCompatible: true
      },
      ySiteCompatibility: {
        compatible: ['Adrenaline', 'Dobutamine', 'Dopamine', 'Vasopressin', 'Midazolam', 'Fentanyl', 'Propofol', 'Potassium Chloride'],
        incompatible: ['Sodium Bicarbonate', 'Frusemide', 'Phenytoin', 'Thiopentone'],
        requiresSeparateLine: false
      },
      monitoringParameters: [
        'Continuous Arterial Blood Pressure (Target MAP ≥ 65 mmHg)',
        'Continuous ECG & Heart Rate',
        'Central venous oxygen saturation (ScvO2) & Serum lactate trends',
        'Peripheral perfusion (warmth, peripheral pulses, capillary refill)',
        'Hourly urine output'
      ]
    },
    shelfLife: {
      intactShelfLife: '24 months from manufacture date',
      storageConditions: {
        temperature: 'Room Temperature (15-30°C)',
        protectFromLight: true,
        protectFromMoisture: true,
        specialStorageNote: 'Store in original packaging. Discard immediately if discoloured (brownish/pink) or containing precipitate.'
      },
      postReconstitutionStability: {
        roomTempDuration: 'N/A',
        refrigeratedDuration: 'N/A'
      },
      postDilutionStability: {
        roomTempDuration: '24 hours in 5% Dextrose at 25°C',
        refrigeratedDuration: '24 hours at 2-8°C'
      },
      multiDoseVialPolicy: 'Single Use Only - Discard Remainder'
    },
    quota: {
      monthlyQuota: 800,
      quotaUsed: 540,
      quotaRemaining: 260,
      unit: 'Ampoules',
      lowStockThreshold: 150,
      isLowStock: false,
      isCriticalShortage: false,
      estimatedRunOutDays: 14,
      lastRestockedDate: '2026-08-12',
      bufferStockLevel: 100
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-CARD-005',
        drugName: 'Vasopressin (Argipressin) Injection 20 units/mL',
        prescriberCategory: 'A*',
        therapeuticEquivalence: 'Alternative Second-Line',
        reasonForChoice: 'Second-line vasopressor added to reduce noradrenaline requirements in refractory septic shock.',
        stockStatus: 'In Stock'
      },
      {
        drugId: 'DRUG-HAM-005',
        drugName: 'Adrenaline (Epinephrine) 1mg/1mL',
        prescriberCategory: 'A*',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Alternative in septic shock with myocardial dysfunction or in anaphylactic shock.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-22',
    verifiedBy: 'ICU Clinical Pharmacist Specialist & Anesthesiologist'
  },

  // 5. IV Antibiotic - Meropenem (NAG Restricted Tier + Dilution)
  {
    id: 'DRUG-ABX-001',
    genericName: 'Meropenem Trihydrate',
    brandNames: ['Meronem', 'Meropenem for Injection 1g / 500mg'],
    mohDrugCode: 'KKM-ABX-0001',
    atcCode: 'J01DH02',
    atcCategory: 'Antiinfectives for Systemic Use - Carbapenems',
    therapeuticClass: 'Broad-Spectrum Carbapenem Antibiotic',
    prescriberCategory: 'A*',
    poisonCategory: 'Group B',
    skimPerolehan: 'APPL',
    dosageForms: ['Powder for Solution for Injection / Infusion Vial'],
    strengths: ['500mg Vial', '1g Vial'],
    indications: [
      'Severe nosocomial pneumonia and ventilator-associated pneumonia (VAP)',
      'Complicated intra-abdominal infections with sepsis',
      'Severe bacterial meningitis (2g Q8H)',
      'Febrile neutropenia in immunocompromised patients',
      'Documented ESBL-producing Enterobacteriaceae infections'
    ],
    contraindications: [
      'Severe hypersensitivity (anaphylaxis) to carbapenems or beta-lactam antibiotics'
    ],
    standardDosage: {
      adult: 'Standard infection: 1g IV Q8H. Severe / Meningitis: 2g IV Q8H. Extended infusion: 1g or 2g infused over 3-4 hours Q8H to maximize time above MIC (%T > MIC).',
      pediatric: '20mg/kg Q8H (up to 40mg/kg Q8H in meningitis; max 2g Q8H).',
      elderlyOrRenal: 'CrCl 26-50 mL/min: 1g Q12H. CrCl 10-25 mL/min: 500mg Q12H. CrCl <10 mL/min: 500mg Q24H. Hemodialysis: 500mg post-HD.'
    },
    administrationRoutes: ['IV Extended Infusion (Preferred over 3-4 hrs)', 'IV Intermittent Infusion (over 30 mins)', 'IV Bolus (5-20 mins, emergency only)'],
    sideEffects: [
      'Diarrhoea and Clostridioides difficile-associated colitis',
      'Skin rash and hypersensitivity',
      'Seizures (rare compared to Imipenem, but risk increases in renal impairment)',
      'Transient elevation of hepatic transaminases'
    ],
    cautionsAndWarnings: [
      'RESTRICTED ANTIMICROBIAL (NAG 2024 Tier R) — Requires ID Physician / AMS Specialist approval within 72 hours.',
      'Avoid combination with Sodium Valproate (drastically reduces serum valproic acid levels and triggers breakthrough seizures).'
    ],
    isHAM: false,
    isLASA: false,
    interactions: [
      {
        interactingDrug: 'Sodium Valproate / Valproic Acid',
        severity: 'CRITICAL',
        effect: 'Meropenem inhibits valproate glucuronide hydrolysis, causing a rapid 60-90% drop in serum valproate within 24 hours, triggering status epilepticus.',
        management: 'STRICT CONTRAINDICATION. Use alternative antibiotic or switch antiepileptic to Levetiracetam.'
      },
      {
        interactingDrug: 'Probenecid',
        severity: 'MODERATE',
        effect: 'Competes for active tubular secretion, doubling meropenem half-life and AUC.',
        management: 'Co-administration is generally not recommended.'
      }
    ],
    reconstitution: {
      isApplicable: true,
      standardVialStrength: '1g Powder Vial',
      preferredSolvent: 'Water for Injection (WFI) or 0.9% Sodium Chloride (NS)',
      solventVolume: '20 mL for 1g vial (or 10 mL for 500mg vial)',
      resultingConcentration: '50 mg/mL',
      displacementVolume: 'Approx 0.8 mL per 1g vial',
      stepByStepInstructions: [
        'Aseptically inject 20 mL WFI or 0.9% NaCl into the 1g powder vial.',
        'Shake vigorously for 1-2 minutes until powder dissolves completely.',
        'Solution should be clear, colourless to pale yellow with no visible particles.'
      ],
      physicalAppearance: 'Clear, colourless to pale straw-coloured solution',
      cautions: ['Do not freeze reconstituted solution.']
    },
    dilution: {
      isApplicable: true,
      compatibleDiluents: ['0.9% Sodium Chloride (NS - Preferred)', '5% Dextrose in Water (D5W - Stability is lower)'],
      incompatibleDiluents: ['Sodium Bicarbonate', 'Lipid emulsions', 'Total Parenteral Nutrition (TPN)'],
      standardDilution: {
        doseRange: '500mg - 2g',
        volume: '100 mL 0.9% NaCl bag (or 50mL in syringe pump for pediatric/fluid-restricted)',
        finalConcentration: '10 mg/mL (1g in 100mL) or up to 20 mg/mL (2g in 100mL).',
        route: 'IV Infusion',
        infusionDuration: 'Extended infusion over 3-4 hours (preferred for critical infections per PK/PD guidelines) or standard 30 minutes.',
        maxConcentrationFluidRestricted: '50 mg/mL (undiluted reconstituted vial via slow IV injection over 5-20 min).',
        syringePumpCompatible: true
      },
      ySiteCompatibility: {
        compatible: ['Amikacin', 'Gentamicin', 'Ciprofloxacin', 'Metronidazole', 'Vancomycin', 'Heparin', 'Morphine', 'Noradrenaline'],
        incompatible: ['Diazepam', 'Pantoprazole', 'Amphotericin B'],
        requiresSeparateLine: false
      },
      monitoringParameters: [
        'Renal function (serum creatinine & eGFR) every 48 hours for dose adjustment',
        'Clinical signs of infection improvement (WBC, CRP, procalcitonin, fever curve)',
        'Bowel habits for C. difficile diarrhoea',
        'AMS 72-Hour Review Form compliance'
      ]
    },
    shelfLife: {
      intactShelfLife: '36 months from manufacture date',
      storageConditions: {
        temperature: 'Room Temperature (15-30°C)',
        protectFromLight: true,
        protectFromMoisture: true
      },
      postReconstitutionStability: {
        roomTempDuration: '3 hours at 25°C (in WFI)',
        refrigeratedDuration: '12 hours at 2-8°C'
      },
      postDilutionStability: {
        roomTempDuration: 'In 0.9% NaCl: 6 hours at 25°C (Extended 3-4h infusion must be completed within 6h). In 5% Dextrose: Only 2 hours at 25°C.',
        refrigeratedDuration: 'In 0.9% NaCl: 24 hours at 2-8°C. In 5% Dextrose: 8 hours at 2-8°C.'
      },
      multiDoseVialPolicy: 'Single Use Only - Discard Remainder'
    },
    antimicrobial: {
      isAntimicrobial: true,
      nagRestrictionTier: 'Restricted (R)',
      antimicrobialClass: 'Carbapenem',
      primaryIndications: [
        'HAP / VAP with multi-drug resistant Gram-negative bacilli',
        'Severe sepsis / septic shock with suspected ESBL',
        'Bacterial meningitis resistant to 3rd generation cephalosporins'
      ],
      spectrumOfActivity: [
        'Gram-negative: ESBL E. coli, Klebsiella, Enterobacter, Proteus, Serratia, Pseudomonas aeruginosa (variable)',
        'Gram-positive: MSSA, Streptococcus pneumoniae, Group A/B Strep',
        'Anaerobes: Bacteroides fragilis, Peptostreptococcus',
        'NO ACTIVITY AGAINST: MRSA, VRE, Stenotrophomonas maltophilia, Burkholderia cepacia'
      ],
      renalDoseAdjustment: {
        normalCrCl: '1g IV Q8H (or 2g Q8H in meningitis)',
        crCl30_50: '1g IV Q12H',
        crCl10_30: '500mg IV Q12H',
        crClLess10: '500mg IV Q24H',
        hemodialysis: '500mg post-hemodialysis on dialysis days'
      },
      ivToOralSwitchCriteria: [
        'Patient clinically stable and afebrile for ≥ 48 hours',
        'Normalising WBC and inflammatory markers',
        'Oral intake tolerated with intact GI absorption',
        'Culture yields pathogen susceptible to oral alternatives (e.g. Ciprofloxacin, Augmentin, Bactrim)'
      ],
      standardDurationDays: '7 - 10 days (14 days for meningitis/pseudomonas)',
      requires72HourReview: true,
      specialistApprovalRequired: 'Infectious Disease Specialist (ID) or Clinical Microbiologist within 72 hours'
    },
    quota: {
      monthlyQuota: 600,
      quotaUsed: 480,
      quotaRemaining: 120,
      unit: 'Vials (1g)',
      lowStockThreshold: 100,
      isLowStock: false,
      isCriticalShortage: false,
      estimatedRunOutDays: 7,
      lastRestockedDate: '2026-08-14',
      bufferStockLevel: 80
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-ABX-002',
        drugName: 'Piperacillin/Tazobactam 4.5g Vial',
        prescriberCategory: 'A*',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Carbapenem-sparing alternative for pseudomonal HAP/VAP and intra-abdominal sepsis.',
        stockStatus: 'In Stock'
      },
      {
        drugId: 'DRUG-ABX-003',
        drugName: 'Ertapenem 1g Vial',
        prescriberCategory: 'A*',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Once-daily carbapenem for non-pseudomonal ESBL infections and OPAT.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-21',
    verifiedBy: 'Infectious Disease Clinical Pharmacist & AMS Committee'
  },

  // 6. IV Antibiotic - Vancomycin (Glycopeptide + TDM + HAM)
  {
    id: 'DRUG-ABX-004',
    genericName: 'Vancomycin Hydrochloride',
    brandNames: ['Vancocin', 'Vancomycin Injection 500mg / 1g'],
    mohDrugCode: 'KKM-ABX-0004',
    atcCode: 'J01XA01',
    atcCategory: 'Antiinfectives for Systemic Use - Glycopeptides',
    therapeuticClass: 'Glycopeptide Antibiotic',
    prescriberCategory: 'A*',
    poisonCategory: 'Group B',
    skimPerolehan: 'APPL',
    dosageForms: ['Powder for Solution for Infusion Vial'],
    strengths: ['500mg Vial', '1g Vial'],
    indications: [
      'Serious MRSA (Methicillin-Resistant S. aureus) infections (bacteraemia, endocarditis, osteomyelitis, pneumonia)',
      'Severe Clostridioides difficile colitis (ORAL administration only)',
      'Severe infections in patients with documented severe penicillin anaphylaxis',
      'Surgical prophylaxis in known MRSA carriers or high-risk implant surgery'
    ],
    contraindications: [
      'Hypersensitivity to vancomycin'
    ],
    standardDosage: {
      adult: 'IV Loading Dose: 25 - 30 mg/kg (actual body weight; max 2g) infused over 2 hours for critically ill. Maintenance: 15 - 20 mg/kg Q8-12H. Target trough concentration: 15 - 20 mcg/mL (severe/MRSA) or AUC/MIC 400-600. Oral for C. diff: 125mg QID.',
      pediatric: '15 mg/kg IV Q6H or Q8H.',
      elderlyOrRenal: 'Dosing interval based on eGFR and guided by Therapeutic Drug Monitoring (TDM) serum trough levels.'
    },
    administrationRoutes: ['Slow IV Infusion ONLY (over at least 60-120 mins)', 'Oral (for C. difficile ONLY — not absorbed systemically)'],
    sideEffects: [
      'Red Man Syndrome (histaminoid reaction from rapid infusion)',
      'Nephrotoxicity (risk increases with trough > 20mcg/mL and concurrent Aminoglycosides/Piperacillin-Tazobactam)',
      'Ototoxicity (tinnitus, high-frequency hearing loss)',
      'Thrombophlebitis'
    ],
    cautionsAndWarnings: [
      'NEVER ADMINISTER AS RAPID IV BOLUS OR INTRAMUSCULARLY (severe pain and tissue necrosis).',
      'Infusion rate must NOT exceed 10 mg/min (i.e. 1g must be given over minimum 100-120 minutes).',
      'Therapeutic Drug Monitoring (TDM) trough level required before 4th dose.'
    ],
    isHAM: true,
    hamCategory: 'Chemotherapy / Cytotoxic', // Classified under high risk parenteral toxicities
    hamRiskLevel: 'HIGH',
    hamPrecautions: [
      'Strict adherence to infusion rate limiter (max 10mg/min) to prevent Red Man Syndrome and anaphylactoid shock.',
      'Mandatory TDM Pharmacokinetic consult by Clinical Pharmacist.'
    ],
    isLASA: false,
    interactions: [
      {
        interactingDrug: 'Piperacillin/Tazobactam (Tazocin)',
        severity: 'MAJOR',
        effect: 'Synergistic acute kidney injury (AKI) rates are significantly higher compared to Vancomycin + Cefepime/Meropenem.',
        management: 'Monitor renal function daily. Consider alternative beta-lactam in high AKI risk patients.'
      },
      {
        interactingDrug: 'Gentamicin / Amikacin',
        severity: 'MAJOR',
        effect: 'Additive nephrotoxicity and ototoxicity.',
        management: 'Strict TDM monitoring for both drugs; limit combination duration.'
      }
    ],
    reconstitution: {
      isApplicable: true,
      standardVialStrength: '1g Powder Vial',
      preferredSolvent: 'Water for Injection (WFI)',
      solventVolume: '20 mL for 1g vial (or 10 mL for 500mg vial)',
      resultingConcentration: '50 mg/mL',
      displacementVolume: 'Approx 0.6 mL per 1g vial',
      stepByStepInstructions: [
        'Add 20 mL WFI into the 1g vial.',
        'Swirl until completely dissolved.',
        'MUST BE FURTHER DILUTED in at least 200 mL infusion fluid before administration.'
      ],
      physicalAppearance: 'Clear, colourless to pale straw-coloured solution',
      cautions: ['Do not administer reconstituted solution directly without secondary dilution.']
    },
    dilution: {
      isApplicable: true,
      compatibleDiluents: ['0.9% Sodium Chloride (NS)', '5% Dextrose in Water (D5W)', 'Hartmanns (RL)'],
      incompatibleDiluents: ['Heparin', 'Sodium Bicarbonate', 'Dexamethasone', 'Ceftriaxone'],
      standardDilution: {
        doseRange: '1g - 2g',
        volume: 'At least 200 mL for 1g (or 500 mL for doses > 1g) to achieve ≤ 5 mg/mL concentration',
        finalConcentration: 'Standard: 5 mg/mL (1g in 200mL). Maximum in fluid restriction: 10 mg/mL (via central line only).',
        route: 'IV Infusion',
        infusionDuration: 'Infuse over at least 100 - 120 minutes (Rate ≤ 10 mg/min). For 1.5g-2g dose: Infuse over 2 - 3 hours.',
        maxConcentrationFluidRestricted: '10 mg/mL via central line only.',
        syringePumpCompatible: true
      },
      ySiteCompatibility: {
        compatible: ['Amikacin', 'Gentamicin', 'Ciprofloxacin', 'Metronidazole', 'Meropenem', 'Midazolam', 'Morphine', 'Noradrenaline'],
        incompatible: ['Heparin', 'Sodium Bicarbonate', 'Frusemide', 'Ceftriaxone', 'Piperacillin/Tazobactam (precipitates at high concentrations)'],
        requiresSeparateLine: false
      },
      monitoringParameters: [
        'Serum trough concentration (trough level 30 mins before 4th dose; Target: 15-20 mcg/mL for MRSA)',
        'Daily serum creatinine & urine output',
        'Audiometry in prolonged therapy (>14 days)',
        'Infusion site for phlebitis'
      ]
    },
    shelfLife: {
      intactShelfLife: '24 months from manufacture date',
      storageConditions: {
        temperature: 'Room Temperature (15-30°C)',
        protectFromLight: true,
        protectFromMoisture: true
      },
      postReconstitutionStability: {
        roomTempDuration: '24 hours at 25°C',
        refrigeratedDuration: '96 hours at 2-8°C'
      },
      postDilutionStability: {
        roomTempDuration: '24 hours at 25°C in NS or D5W',
        refrigeratedDuration: '14 days at 2-8°C'
      },
      multiDoseVialPolicy: 'Single Use Only - Discard Remainder'
    },
    antimicrobial: {
      isAntimicrobial: true,
      nagRestrictionTier: 'Restricted (R)',
      antimicrobialClass: 'Glycopeptide',
      primaryIndications: [
        'Proven or suspected MRSA bacteraemia, pneumonia, and osteomyelitis',
        'Enterococcal endocarditis (in combo with Aminoglycoside)',
        'Severe C. difficile colitis (oral formulation)'
      ],
      spectrumOfActivity: [
        'Gram-positive: MRSA, MSSA, Coagulase-negative Staphylococci (S. epidermidis), Enterococcus faecalis, S. pneumoniae, Clostridioides difficile',
        'NO ACTIVITY AGAINST: Gram-negative bacilli, VRE (Vancomycin-Resistant Enterococci)'
      ],
      renalDoseAdjustment: {
        normalCrCl: '15 - 20 mg/kg Q8-12H (guided by TDM)',
        crCl30_50: '15 mg/kg Q24H',
        crCl10_30: '15 mg/kg Q48H',
        crClLess10: '15 mg/kg loading dose, then redose when level < 15 mcg/mL',
        hemodialysis: '15-20 mg/kg loading, then 500mg-1g post-dialysis guided by pre-dialysis trough'
      },
      ivToOralSwitchCriteria: [
        'Oral Vancomycin is NOT absorbed systemically — Cannot step down to oral vancomycin for systemic infections.',
        'Step down to oral Linezolid 600mg BD or Cotrimoxazole / Clindamycin for suitable MRSA soft tissue / bone infections.'
      ],
      standardDurationDays: '14 days (bacteraemia) to 4-6 weeks (endocarditis / osteomyelitis)',
      requires72HourReview: true,
      specialistApprovalRequired: 'Infectious Disease Specialist / TDM Pharmacist review mandatory'
    },
    quota: {
      monthlyQuota: 400,
      quotaUsed: 310,
      quotaRemaining: 90,
      unit: 'Vials (1g)',
      lowStockThreshold: 80,
      isLowStock: false,
      isCriticalShortage: false,
      estimatedRunOutDays: 8,
      lastRestockedDate: '2026-08-08',
      bufferStockLevel: 60
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-ABX-005',
        drugName: 'Linezolid 600mg IV / Tablet',
        prescriberCategory: 'A*',
        therapeuticEquivalence: 'Alternative Second-Line',
        reasonForChoice: 'Oxazolidinone with 100% oral bioavailability for MRSA pneumonia and VRE.',
        stockStatus: 'In Stock'
      },
      {
        drugId: 'DRUG-ABX-006',
        drugName: 'Teicoplanin 400mg Vial',
        prescriberCategory: 'A*',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Once-daily glycopeptide with lower nephrotoxicity risk and no Red Man Syndrome.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-24',
    verifiedBy: 'Infectious Disease Clinical Pharmacist & TDM Unit Head'
  },

  // 7. Anticoagulant - Unfractionated Heparin (HAM CRITICAL)
  {
    id: 'DRUG-HAM-005',
    genericName: 'Heparin Sodium',
    brandNames: ['Heparin Leo', 'Heparin Injection 25,000 IU/5mL (5,000 IU/mL)'],
    mohDrugCode: 'KKM-BLOD-0005',
    atcCode: 'B01AB01',
    atcCategory: 'Blood and Blood Forming Organs - Antithrombotic Agents',
    therapeuticClass: 'Parenteral Anticoagulant',
    prescriberCategory: 'A',
    poisonCategory: 'Group B',
    skimPerolehan: 'APPL',
    dosageForms: ['Solution for Injection Vial / Ampoule'],
    strengths: ['25,000 IU / 5mL (5,000 IU/mL)', '5,000 IU / 1mL', '1,000 IU / 1mL (for flushes)'],
    indications: [
      'Treatment and prophylaxis of Deep Vein Thrombosis (DVT) and Pulmonary Embolism (PE)',
      'Acute Coronary Syndrome (STEMI / NSTEMI / Unstable Angina)',
      'Anticoagulation for cardiopulmonary bypass and hemodialysis circuits'
    ],
    contraindications: [
      'Active major bleeding or severe uncorrected thrombocytopenia',
      'History of Heparin-Induced Thrombocytopenia (HIT Type II)',
      'Severe uncontrolled hypertension (>200/120 mmHg)',
      'Recent intracranial haemorrhage or neurosurgery'
    ],
    standardDosage: {
      adult: 'DVT/PE treatment: IV Bolus 80 units/kg (max 5,000-10,000 units), followed by continuous infusion of 18 units/kg/hr. ACS treatment: IV Bolus 60 units/kg (max 4,000 units), then 12 units/kg/hr (max 1,000 units/hr). Titrate against aPTT (target 1.5 - 2.5x control, approx 60-85 seconds).',
      pediatric: 'Loading dose 50-100 units/kg IV, then 20-25 units/kg/hr.',
      elderlyOrRenal: 'Preferred anticoagulant in severe renal failure (eGFR < 15 mL/min) over LMWH because it is metabolised by the reticuloendothelial system.'
    },
    administrationRoutes: ['Continuous IV Infusion', 'Subcutaneous Injection (prophylaxis)', 'IV Bolus'],
    sideEffects: [
      'Major hemorrhage (GI, retroperitoneal, intracranial)',
      'Heparin-Induced Thrombocytopenia (HIT) with paradoxial arterial/venous thrombosis',
      'Osteoporosis with long-term use (>3 months)',
      'Hyperkalaemia (aldosterone inhibition)'
    ],
    cautionsAndWarnings: [
      'HIGH ALERT MEDICATION — Frequent dose miscalculations and confusion between 1,000 IU/mL and 25,000 IU/5mL.',
      'Antidote: Protamine Sulphate (1mg neutralises approx 100 units of heparin; max Protamine dose 50mg).'
    ],
    isHAM: true,
    hamCategory: 'Anticoagulant & Antithrombotic',
    hamRiskLevel: 'CRITICAL',
    hamPrecautions: [
      'Store flush vials (1,000 IU/mL) completely separately from therapeutic vials (25,000 IU/5mL).',
      'Independent double check of vial concentration, dose calculation, and infusion pump rate.',
      'Monitor baseline Platelet count and aPTT 6 hours post-initiation and 6 hours after any rate change.'
    ],
    isLASA: true,
    tallManName: 'HEPARIN Sodium',
    lasaPairs: [
      {
        confusedWith: 'Heparin Flush (100 units/mL vs 5,000 units/mL)',
        confusionType: 'look-alike',
        tallManThis: 'HEPARIN Therapeutic (25,000 IU/5mL)',
        tallManOther: 'HEPARIN Lock Flush (100 IU/mL)',
        clinicalRiskWarning: 'Inadvertent administration of 5,000 IU/mL therapeutic vial instead of flush solution causes massive fatal haemorrhage.',
        separationStrategy: 'Remove all high-concentration 25,000 IU vials from general ward floor stock. Use pre-filled commercial saline flushes without heparin whenever possible.'
      }
    ],
    interactions: [
      {
        interactingDrug: 'Aspirin, Clopidogrel, Ticagrelor, NSAIDs',
        severity: 'MAJOR',
        effect: 'Markedly increased bleeding risk due to dual impairment of platelet function and coagulation cascade.',
        management: 'Careful haemodynamic monitoring and risk-benefit evaluation in ACS.'
      },
      {
        interactingDrug: 'Thrombolytics (Alteplase, Tenecteplase, Streptokinase)',
        severity: 'CRITICAL',
        effect: 'Profoundly increased risk of fatal intracranial haemorrhage.',
        management: 'Follow institutional ACS / PE thrombolysis protocol carefully.'
      }
    ],
    reconstitution: {
      isApplicable: false
    },
    dilution: {
      isApplicable: true,
      compatibleDiluents: ['0.9% Sodium Chloride (NS)', '5% Dextrose in Water (D5W)'],
      incompatibleDiluents: ['Doxycycline', 'Erythromycin', 'Gentamicin', 'Hydrocortisone', 'Vancomycin (direct mix)'],
      standardDilution: {
        doseRange: '20,000 IU - 25,000 IU',
        volume: '50 mL in 50mL Syringe (500 IU/mL) or 500 mL NS bag (50 IU/mL)',
        finalConcentration: 'Standard syringe pump: 25,000 IU in 50 mL NS = 500 IU/mL.',
        route: 'Continuous Infusion',
        infusionDuration: 'Continuous titrated infusion',
        maxConcentrationFluidRestricted: '500 IU/mL in syringe pump.',
        syringePumpCompatible: true
      },
      ySiteCompatibility: {
        compatible: ['Amiodarone', 'Adrenaline', 'Dobutamine', 'Dopamine', 'Lidocaine', 'Midazolam', 'Morphine', 'Potassium Chloride'],
        incompatible: ['Diazepam', 'Phenytoin', 'Vancomycin', 'Haloperidol', 'Promethazine'],
        requiresSeparateLine: false
      },
      monitoringParameters: [
        'aPTT every 6 hours until therapeutic (target 60-85s), then daily',
        'Platelet count at baseline and every 2-3 days from Day 4-14 (screen for HIT: drop > 50%)',
        'Haemoglobin / Hematocrit and overt signs of bleeding (stool, urine, drain sites)'
      ]
    },
    shelfLife: {
      intactShelfLife: '36 months from manufacture date',
      storageConditions: {
        temperature: 'Room Temperature (15-30°C)',
        protectFromLight: false,
        protectFromMoisture: false
      },
      postReconstitutionStability: {
        roomTempDuration: 'N/A',
        refrigeratedDuration: 'N/A'
      },
      postDilutionStability: {
        roomTempDuration: '24 hours at 25°C',
        refrigeratedDuration: '48 hours at 2-8°C'
      },
      multiDoseVialPolicy: 'Single Use Only - Discard Remainder'
    },
    quota: {
      monthlyQuota: 500,
      quotaUsed: 390,
      quotaRemaining: 110,
      unit: 'Vials (25,000 IU)',
      lowStockThreshold: 100,
      isLowStock: false,
      isCriticalShortage: false,
      estimatedRunOutDays: 8,
      lastRestockedDate: '2026-08-03',
      bufferStockLevel: 75
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-BLOD-006',
        drugName: 'Enoxaparin Sodium (Clexane) 4,000 IU / 6,000 IU Pre-filled Syringe',
        prescriberCategory: 'A',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Low Molecular Weight Heparin (LMWH) with predictable pharmacokinetics and no routine aPTT monitoring required.',
        stockStatus: 'In Stock'
      },
      {
        drugId: 'DRUG-BLOD-007',
        drugName: 'Fondaparinux Sodium (Arixtra) 2.5mg/0.5mL Syringe',
        prescriberCategory: 'A*',
        therapeuticEquivalence: 'Alternative Second-Line',
        reasonForChoice: 'Synthetic Factor Xa inhibitor, safe alternative in patients with suspected or proven HIT.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-19',
    verifiedBy: 'Haematology Specialist & Medication Safety Committee'
  },

  // 8. Opioid Analgesic - Morphine Sulphate IV (HAM CRITICAL + DDA)
  {
    id: 'DRUG-HAM-006',
    genericName: 'Morphine Sulphate',
    brandNames: ['Morphine Injection 10mg/1mL', 'Morphine Sulphate'],
    mohDrugCode: 'KKM-ANAL-0006',
    atcCode: 'N02AA01',
    atcCategory: 'Nervous System - Natural Opium Alkaloids',
    therapeuticClass: 'Potent Opioid Analgesic',
    prescriberCategory: 'A',
    poisonCategory: 'Dangerous Drug (DD)',
    skimPerolehan: 'APPL',
    dosageForms: ['Solution for Injection Ampoule'],
    strengths: ['10mg/1mL Ampoule'],
    indications: [
      'Severe acute pain (post-operative, major trauma, myocardial infarction)',
      'Severe chronic cancer pain and palliative symptom control',
      'Acute pulmonary oedema (reduces preload and anxiety)'
    ],
    contraindications: [
      'Severe respiratory depression (RR < 10 breaths/min)',
      'Acute severe bronchial asthma or severe COPD exacerbation without ventilatory support',
      'Raised intracranial pressure or acute head injury',
      'Paralytic ileus',
      'Concurrent use with MAO inhibitors within 14 days'
    ],
    standardDosage: {
      adult: 'Acute severe pain IV: 2 - 5 mg slow IV bolus (over 4-5 mins), repeat every 10-15 mins titrated to pain score and sedation score (usual cumulative 10-20mg). Patient-Controlled Analgesia (PCA): 1mg bolus, lockout 5 mins, no background infusion.',
      pediatric: '0.05 - 0.1 mg/kg IV slow push over 5 mins, repeat every 2-4 hours as needed.',
      elderlyOrRenal: 'Reduce initial dose by 50% (active toxic metabolites M6G and M3G accumulate in renal impairment causing prolonged narcosis).'
    },
    administrationRoutes: ['Slow IV Push', 'Subcutaneous (SC)', 'Intramuscular (IM)', 'PCA Pump Infusion'],
    sideEffects: [
      'Dose-dependent respiratory depression and sedation',
      'Hypotension and bradycardia (histamine release)',
      'Nausea, vomiting, and constipation',
      'Euphoria, dysphoria, and urinary retention'
    ],
    cautionsAndWarnings: [
      'DANGEROUS DRUG (DDA 1952) — Kept in double-locked DDA Safe with strict DDA Register Book entry.',
      'Antidote: Naloxone IV (0.1 - 0.4 mg IV titrated every 2-3 mins until reversal of respiratory depression).'
    ],
    isHAM: true,
    hamCategory: 'Opioid & Sedative IV',
    hamRiskLevel: 'CRITICAL',
    hamPrecautions: [
      'Requires dual registered staff sign-off in DDA Register.',
      'Independent double-check of dilution, concentration, and patient identity before administration.',
      'Continuous pulse oximetry and sedation scoring (Ramsay / POSS score) mandatory.'
    ],
    isLASA: true,
    tallManName: 'MORphine Sulphate',
    lasaPairs: [
      {
        confusedWith: 'Hydromorphone (Dilaudid)',
        confusionType: 'both',
        tallManThis: 'MORphine',
        tallManOther: 'HYDROmorphone',
        clinicalRiskWarning: 'Hydromorphone is 5-7 times more potent than Morphine. Mistaking Hydromorphone for Morphine causes fatal respiratory arrest.',
        separationStrategy: 'Never store Hydromorphone on standard ward emergency trays; keep in high-security central pharmacy storage with bold orange warnings.'
      }
    ],
    interactions: [
      {
        interactingDrug: 'Benzodiazepines (Midazolam, Diazepam, Lorazepam)',
        severity: 'CRITICAL',
        effect: 'Profound synergistic central nervous system and respiratory depression, coma, and death.',
        management: 'Avoid concurrent IV administration unless in mechanically ventilated ICU settings.'
      },
      {
        interactingDrug: 'MAO Inhibitors (Phenelzine, Selegiline, Linezolid)',
        severity: 'CRITICAL',
        effect: 'Severe excitation or depression, hyperpyrexia, and cardiovascular collapse.',
        management: 'Contraindicated within 14 days of MAOI therapy.'
      }
    ],
    reconstitution: {
      isApplicable: false
    },
    dilution: {
      isApplicable: true,
      compatibleDiluents: ['Water for Injection (WFI)', '0.9% Sodium Chloride (NS)', '5% Dextrose in Water (D5W)'],
      incompatibleDiluents: ['Aminophylline', 'Frusemide', 'Phenytoin', 'Sodium Bicarbonate', 'Heparin'],
      standardDilution: {
        doseRange: '10mg',
        volume: 'Dilute 10mg (1mL) with 9mL Normal Saline in 10mL syringe to obtain 1 mg/mL',
        finalConcentration: 'Standard IV push: 1 mg/mL (10mg in 10mL). PCA Syringe: 1 mg/mL (50mg in 50mL).',
        route: 'IV Slow Push',
        infusionDuration: 'Administer slow IV bolus at rate of 1-2 mg per minute.',
        maxConcentrationFluidRestricted: '10 mg/mL (undiluted ampoule via slow central push in ICU).',
        syringePumpCompatible: true
      },
      ySiteCompatibility: {
        compatible: ['Adrenaline', 'Dobutamine', 'Dopamine', 'Noradrenaline', 'Midazolam', 'Metoclopramide', 'Ondansetron', 'Potassium Chloride'],
        incompatible: ['Frusemide', 'Phenytoin', 'Sodium Bicarbonate', 'Acyclovir'],
        requiresSeparateLine: false
      },
      monitoringParameters: [
        'Respiratory Rate (hold if RR < 10/min and assess for Naloxone requirement)',
        'Sedation Level (Pasero Opioid-Induced Sedation Scale - POSS)',
        'Pain Score (Numerical Rating Scale 0-10)',
        'Blood pressure and oxygen saturation (SpO2)'
      ]
    },
    shelfLife: {
      intactShelfLife: '36 months from manufacture date',
      storageConditions: {
        temperature: 'Room Temperature (15-30°C)',
        protectFromLight: true,
        protectFromMoisture: false,
        specialStorageNote: 'DDA Double-locked Poison Safe. Key held by Sister-in-charge / Registered Pharmacist.'
      },
      postReconstitutionStability: {
        roomTempDuration: 'N/A',
        refrigeratedDuration: 'N/A'
      },
      postDilutionStability: {
        roomTempDuration: '24 hours in PCA syringe at 25°C',
        refrigeratedDuration: '48 hours at 2-8°C'
      },
      multiDoseVialPolicy: 'Single Use Only - Discard Remainder'
    },
    quota: {
      monthlyQuota: 1200,
      quotaUsed: 890,
      quotaRemaining: 310,
      unit: 'Ampoules',
      lowStockThreshold: 250,
      isLowStock: false,
      isCriticalShortage: false,
      estimatedRunOutDays: 10,
      lastRestockedDate: '2026-08-01',
      bufferStockLevel: 200
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-ANAL-007',
        drugName: 'Fentanyl Citrate 100mcg/2mL Injection',
        prescriberCategory: 'A',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Synthetic opioid with rapid onset and shorter duration; preferred in renal impairment as it has no active toxic metabolites.',
        stockStatus: 'In Stock'
      },
      {
        drugId: 'DRUG-ANAL-008',
        drugName: 'Oxycodone Hydrochloride 10mg/mL Injection',
        prescriberCategory: 'A*',
        therapeuticEquivalence: 'Alternative Second-Line',
        reasonForChoice: 'Alternative strong opioid for acute and cancer pain in patients intolerant to morphine side effects.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-25',
    verifiedBy: 'Palliative Care & Pain Specialist / DDA Officer'
  },

  // 9. Insulin - Regular Insulin Actrapid (HAM + Critical Quota)
  {
    id: 'DRUG-HAM-007',
    genericName: 'Insulin Human (rDNA) - Soluble / Regular',
    brandNames: ['Actrapid HM 100 IU/mL', 'Humulin R'],
    mohDrugCode: 'KKM-ENDO-0007',
    atcCode: 'A10AB01',
    atcCategory: 'Alimentary Tract and Metabolism - Fast-Acting Insulins',
    therapeuticClass: 'Short-Acting Soluble Human Insulin',
    prescriberCategory: 'B',
    poisonCategory: 'Group B',
    skimPerolehan: 'APPL',
    dosageForms: ['Solution for Injection Vial / Cartridge'],
    strengths: ['100 IU/mL (10mL Vial = 1,000 IU)'],
    indications: [
      'Diabetic Ketoacidosis (DKA) and Hyperosmolar Hyperglycaemic State (HHS)',
      'Management of acute hyperglycemia in hospitalized patients and sliding scale protocols',
      'Emergency treatment of severe Hyperkalaemia (with 50% Dextrose)',
      'Type 1 and Type 2 Diabetes Mellitus glycemic control'
    ],
    contraindications: [
      'Hypoglycaemia (blood glucose < 4.0 mmol/L)',
      'Hypokalaemia (serum K+ < 3.3 mmol/L — must replenish K+ before starting IV insulin)'
    ],
    standardDosage: {
      adult: 'DKA Protocol: Fixed rate IV infusion 0.1 unit/kg/hr (or 0.14 unit/kg/hr if no initial bolus). Hyperkalaemia emergency: 10 units IV Actrapid in 50 mL 50% Dextrose infused over 15-30 mins. Sliding Scale: Subcutaneous dose 2-10 units 30 mins before meals.',
      pediatric: 'DKA: 0.05 - 0.1 unit/kg/hr continuous IV infusion without initial bolus.',
      elderlyOrRenal: 'Reduce dose by 25-50% in severe renal impairment (eGFR < 30 mL/min) due to reduced insulin clearance.'
    },
    administrationRoutes: ['Continuous IV Infusion (DKA)', 'Subcutaneous Injection (SC)', 'Intramuscular (emergency)'],
    sideEffects: [
      'Severe, life-threatening hypoglycaemia',
      'Hypokalaemia (drives K+ into intracellular space)',
      'Lipodystrophy at injection sites',
      'Peripheral oedema'
    ],
    cautionsAndWarnings: [
      'HIGH ALERT MEDICATION — USE DEDICATED 100-UNIT INSULIN SYRINGES ONLY.',
      'NEVER MEASURE INSULIN WITH STANDARD 1mL OR 2mL SYRINGES (causes 10-fold overdoses).',
      'Prime IV infusion line with 20 mL of insulin solution before connecting to patient to saturate plastic binding sites.'
    ],
    isHAM: true,
    hamCategory: 'Insulin & Hypoglycaemics',
    hamRiskLevel: 'CRITICAL',
    hamPrecautions: [
      'Requires RED High Alert Insulin warning tag.',
      'Independent double check of insulin type, vial concentration, syringe units, and bedside capillary glucose.',
      'Bedside glucometer checks hourly during continuous IV infusion.'
    ],
    isLASA: true,
    tallManName: 'Regular INSULIN (Actrapid)',
    lasaPairs: [
      {
        confusedWith: 'Insulin Isophane (NPH / Insulatard / Humulin N)',
        confusionType: 'look-alike',
        tallManThis: 'Actrapid (SHORT-acting)',
        tallManOther: 'Insulatard (INTERMEDIATE-acting)',
        clinicalRiskWarning: 'Inadvertent administration of cloudy NPH insulin via IV infusion line causes severe embolic and erratic hypoglycaemic reactions. Only clear soluble Regular insulin may be given IV.',
        separationStrategy: 'Store rapid-acting and basal/intermediate insulins on separate distinct shelves in drug refrigerator.'
      }
    ],
    interactions: [
      {
        interactingDrug: 'Beta Blockers (Propranolol, Atenolol)',
        severity: 'MAJOR',
        effect: 'Masks early adrenergic symptoms of hypoglycaemia (tremor, tachycardia) except diaphoresis.',
        management: 'Educate patient on recognising diaphoresis; monitor blood glucose more frequently.'
      },
      {
        interactingDrug: 'Systemic Corticosteroids (Hydrocortisone, Dexamethasone)',
        severity: 'MAJOR',
        effect: 'Marked increase in blood glucose levels due to insulin resistance.',
        management: 'Anticipate needing a 50-100% increase in daily insulin doses during steroid therapy.'
      }
    ],
    reconstitution: {
      isApplicable: false
    },
    dilution: {
      isApplicable: true,
      compatibleDiluents: ['0.9% Sodium Chloride (NS - Preferred)'],
      incompatibleDiluents: ['Highly alkaline solutions', 'Alcohol-containing solutions'],
      standardDilution: {
        doseRange: '50 IU',
        volume: '50 mL 0.9% NaCl in 50mL Syringe',
        finalConcentration: 'Standard IV Infusion: 50 units Actrapid in 50 mL 0.9% NaCl = 1 unit/mL.',
        route: 'Continuous Infusion',
        infusionDuration: 'Continuous titrated infusion based on hourly glucometer readings',
        maxConcentrationFluidRestricted: '1 unit/mL standard.',
        syringePumpCompatible: true
      },
      ySiteCompatibility: {
        compatible: ['Potassium Chloride', '0.9% NaCl', '5% Dextrose', '10% Dextrose', 'Aminophylline', 'Frusemide', 'Heparin'],
        incompatible: ['Dobutamine', 'Dopamine (incompatible in certain carriers)', 'Phenytoin'],
        requiresSeparateLine: false
      },
      monitoringParameters: [
        'Hourly bedside capillary blood glucose (target DKA reduction 3-4 mmol/L per hour)',
        'Serum potassium every 2-4 hours (maintain K+ between 4.0 - 5.0 mmol/L with IV KCl)',
        'Venous blood gas (VBG) for pH and bicarbonate resolution in DKA',
        'Urine ketones / Serum beta-hydroxybutyrate'
      ]
    },
    shelfLife: {
      intactShelfLife: '30 months when stored in refrigerator (2-8°C)',
      storageConditions: {
        temperature: 'Cold Chain / Refrigerated (2-8°C)',
        protectFromLight: true,
        protectFromMoisture: false,
        specialStorageNote: 'DO NOT FREEZE. Once in-use, vial may be kept at room temperature (<30°C) for up to 28 days.'
      },
      postReconstitutionStability: {
        roomTempDuration: 'N/A',
        refrigeratedDuration: 'N/A'
      },
      postDilutionStability: {
        roomTempDuration: '24 hours in 0.9% NaCl syringe at 25°C',
        refrigeratedDuration: '24 hours at 2-8°C'
      },
      multiDoseVialPolicy: '28 Days Post-Puncture'
    },
    quota: {
      monthlyQuota: 900,
      quotaUsed: 780,
      quotaRemaining: 120,
      unit: 'Vials (10mL)',
      lowStockThreshold: 150,
      isLowStock: true,
      isCriticalShortage: false,
      estimatedRunOutDays: 5,
      lastRestockedDate: '2026-07-28',
      bufferStockLevel: 100
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-ENDO-008',
        drugName: 'Insulin Aspart (NovoRapid) 100 IU/mL',
        prescriberCategory: 'A',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Rapid-acting insulin analogue suitable for pre-meal subcutaneous boluses with faster onset.',
        stockStatus: 'In Stock'
      },
      {
        drugId: 'DRUG-ENDO-009',
        drugName: 'Insulin Lispro (Humalog) 100 IU/mL',
        prescriberCategory: 'A',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Alternative rapid-acting insulin analogue.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-26',
    verifiedBy: 'Endocrinology Specialist & Diabetes Clinical Pharmacist'
  },

  // 10. Neuromuscular Blocker - Atracurium Besylate (HAM CRITICAL)
  {
    id: 'DRUG-HAM-008',
    genericName: 'Atracurium Besylate',
    brandNames: ['Tracrium', 'Atracurium Injection 10mg/mL (2.5mL / 5mL)'],
    mohDrugCode: 'KKM-ANES-0008',
    atcCode: 'M03AC04',
    atcCategory: 'Musculo-Skeletal System - Peripherally Acting Muscle Relaxants',
    therapeuticClass: 'Non-Depolarising Neuromuscular Blocking Agent (NMBA)',
    prescriberCategory: 'A*',
    poisonCategory: 'Group B',
    skimPerolehan: 'APPL',
    dosageForms: ['Solution for Injection Ampoule'],
    strengths: ['25mg/2.5mL Ampoule (10mg/mL)', '50mg/5mL Ampoule (10mg/mL)'],
    indications: [
      'Skeletal muscle relaxation during endotracheal intubation and general anaesthesia in surgery',
      'Facilitation of mechanical ventilation in ARDS / critically ill ICU patients'
    ],
    contraindications: [
      'Hypersensitivity to atracurium or besylate',
      'NON-INTUBATED PATIENTS WITHOUT SECURED AIRWAY AND VENTILATOR SUPPORT'
    ],
    standardDosage: {
      adult: 'Intubation IV Bolus: 0.5 - 0.6 mg/kg (provides intubation conditions in 90-120s; duration 20-35 mins). Maintenance: 0.1 - 0.2 mg/kg as required or continuous infusion of 5 - 9 mcg/kg/min (0.3 - 0.6 mg/kg/hr).',
      pediatric: '0.3 - 0.4 mg/kg IV initial dose.',
      elderlyOrRenal: 'Safe in severe renal and hepatic failure because it undergoes non-enzymatic spontaneous degradation in plasma (Hofmann Elimination).'
    },
    administrationRoutes: ['IV Injection / Continuous IV Infusion ONLY (under expert anaesthetic / airway supervision)'],
    sideEffects: [
      'Complete respiratory paralysis (asphyxiation if airway not secured)',
      'Histamine release causing flushing, bronchospasm, and hypotension',
      'Laudanosine metabolite accumulation during prolonged high-dose ICU infusion (CNS excitation)'
    ],
    cautionsAndWarnings: [
      'DEADLY PARALYTIC AGENT — CAUSES CONSCIOUS SUFFOCATION IF GIVEN WITHOUT ADEQUATE SEDATION/ANAESTHESIA.',
      'Must ALWAYS have Ambu bag, endotracheal tube, suction, and mechanical ventilator ready at bedside.',
      'Reversal agent: Sugammadex or Neostigmine (with Atropine/Glycopyrrolate).'
    ],
    isHAM: true,
    hamCategory: 'Neuromuscular Blocking Agent (NMBA)',
    hamRiskLevel: 'CRITICAL',
    hamPrecautions: [
      'Store in RED-labelled dedicated Paralytic Box inside drug refrigerator.',
      'Strictly prohibited in general wards without ICU/OT privileges.',
      'Must have fluorescent RED WARNING auxiliary label: "WARNING: PARALYSING AGENT - CAUSES ARREST OF BREATHING".'
    ],
    isLASA: false,
    interactions: [
      {
        interactingDrug: 'Aminoglycosides (Gentamicin, Amikacin)',
        severity: 'MAJOR',
        effect: 'Enhancement and prolongation of neuromuscular blockade.',
        management: 'Reduce atracurium dose and monitor with Train-of-Four (TOF) peripheral nerve stimulator.'
      },
      {
        interactingDrug: 'Magnesium Sulphate IV',
        severity: 'MAJOR',
        effect: 'Marked potentiation of neuromuscular blockade.',
        management: 'Dose must be substantially reduced; monitor TOF.'
      }
    ],
    reconstitution: {
      isApplicable: false
    },
    dilution: {
      isApplicable: true,
      compatibleDiluents: ['0.9% Sodium Chloride (NS)', '5% Dextrose in Water (D5W)', 'Hartmanns (RL)'],
      incompatibleDiluents: ['Alkaline solutions (Sodium Bicarbonate, Thiopentone — precipitates free acid)'],
      standardDilution: {
        doseRange: '50mg - 100mg',
        volume: '50 mL in 50mL Syringe for ICU continuous infusion',
        finalConcentration: 'Standard syringe pump: 50mg in 50mL = 1 mg/mL (or undiluted 10 mg/mL for rapid bolus).',
        route: 'Continuous Infusion',
        infusionDuration: 'Titrated continuous infusion guided by TOF nerve stimulator',
        maxConcentrationFluidRestricted: '5 mg/mL in NS.',
        syringePumpCompatible: true
      },
      ySiteCompatibility: {
        compatible: ['Adrenaline', 'Noradrenaline', 'Dopamine', 'Dobutamine', 'Fentanyl', 'Midazolam', 'Propofol', 'Potassium Chloride'],
        incompatible: ['Thiopentone', 'Sodium Bicarbonate', 'Propofol (direct mix without separate carrier)', 'Diazepam'],
        requiresSeparateLine: false
      },
      monitoringParameters: [
        'Continuous Train-of-Four (TOF) neuromuscular transmission monitoring (target 1-2 twitches in ICU)',
        'Continuous pulse oximetry, capnography (EtCO2), and airway pressure',
        'Adequate depth of sedation (RASS -4 to -5, BIS 40-60) before paralytic administration'
      ]
    },
    shelfLife: {
      intactShelfLife: '24 months from manufacture date',
      storageConditions: {
        temperature: 'Cold Chain / Refrigerated (2-8°C)',
        protectFromLight: true,
        protectFromMoisture: false,
        specialStorageNote: 'DO NOT FREEZE. May be stored at room temperature (<25°C) for up to 14 days; do not return to fridge.'
      },
      postReconstitutionStability: {
        roomTempDuration: 'N/A',
        refrigeratedDuration: 'N/A'
      },
      postDilutionStability: {
        roomTempDuration: 'In 0.9% NaCl: 24 hours at 25°C. In Hartmanns: 8 hours at 25°C.',
        refrigeratedDuration: '24 hours at 2-8°C'
      },
      multiDoseVialPolicy: 'Single Use Only - Discard Remainder'
    },
    quota: {
      monthlyQuota: 350,
      quotaUsed: 220,
      quotaRemaining: 130,
      unit: 'Ampoules',
      lowStockThreshold: 80,
      isLowStock: false,
      isCriticalShortage: false,
      estimatedRunOutDays: 12,
      lastRestockedDate: '2026-08-11',
      bufferStockLevel: 60
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-ANES-009',
        drugName: 'Rocuronium Bromide 50mg/5mL Injection',
        prescriberCategory: 'A*',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Rapid onset (60 seconds) non-depolarising agent; reversible with Sugammadex.',
        stockStatus: 'In Stock'
      },
      {
        drugId: 'DRUG-ANES-010',
        drugName: 'Cisatracurium Besylate 10mg/5mL Injection',
        prescriberCategory: 'A*',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Higher potency isomer with zero histamine release and superior hemodynamic stability.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-20',
    verifiedBy: 'Department of Anaesthesiology & Critical Care Clinical Specialist'
  },

  // 11. Analgesic & Antipyretic - Paracetamol
  {
    id: 'DRUG-GEN-011',
    genericName: 'Paracetamol (Acetaminophen)',
    brandNames: ['Panadol 500mg', 'Perfalgan IV 1g/100mL', 'Paracetamol Syrup 120mg/5mL'],
    mohDrugCode: 'KKM-ANAL-0011',
    atcCode: 'N02BE01',
    atcCategory: 'Nervous System - Other Analgesics and Antipyretics',
    therapeuticClass: 'Non-Opioid Analgesic & Antipyretic',
    prescriberCategory: 'C',
    poisonCategory: 'Group C',
    skimPerolehan: 'APPL',
    dosageForms: ['Tablet 500mg', 'Oral Syrup 120mg/5mL', 'IV Infusion 10mg/mL (1g in 100mL)'],
    strengths: ['500mg Tablet', '120mg/5mL Syrup', '1g/100mL Infusion Vial'],
    indications: [
      'Relief of mild to moderate pain (headache, musculoskeletal pain, postoperative pain)',
      'Reduction of fever in adult and paediatric patients'
    ],
    contraindications: [
      'Severe acute hepatic failure or active decompensated liver disease',
      'Hypersensitivity to paracetamol or propacetamol'
    ],
    standardDosage: {
      adult: 'Oral: 500mg - 1000mg every 4-6 hours as needed (Maximum 4000mg/day). IV: 1000mg every 6 hours (Max 4g/24h in patients ≥ 50kg; Max 60mg/kg/day in patients < 50kg).',
      pediatric: 'Oral: 15mg/kg every 4-6 hours (Maximum 60mg/kg/day). IV: 15mg/kg per dose over 15 minutes.',
      elderlyOrRenal: 'Renal impairment (CrCl < 30 mL/min): Increase dosing interval to 6-8 hours. Hepatic impairment / chronic alcoholism: Max 2g - 3g/day.'
    },
    administrationRoutes: ['Oral', 'IV Infusion (over 15 minutes)'],
    sideEffects: [
      'Hepatotoxicity with overdose (> 10-15g acute ingestion)',
      'Rare cutaneous hypersensitivity reactions (Stevens-Johnson syndrome, TEN)',
      'Nausea and vomiting'
    ],
    cautionsAndWarnings: [
      'Avoid duplicate administration with other combination cough/cold medications containing paracetamol.',
      'Antidote for acute overdose: N-Acetylcysteine (NAC) protocol within 8 hours.'
    ],
    isHAM: false,
    isLASA: false,
    interactions: [
      {
        interactingDrug: 'Warfarin Sodium',
        severity: 'MODERATE',
        effect: 'Prolonged high-dose paracetamol (> 2g/day for > 3 days) may potentiate anticoagulant effect and increase INR.',
        management: 'Monitor INR closely during sustained paracetamol therapy.'
      },
      {
        interactingDrug: 'Isoniazid (INH)',
        severity: 'MODERATE',
        effect: 'Increased risk of paracetamol hepatotoxicity due to CYP2E1 induction.',
        management: 'Limit paracetamol dose to < 2g/day in patients on INH.'
      }
    ],
    reconstitution: { isApplicable: false },
    dilution: {
      isApplicable: true,
      compatibleDiluents: ['0.9% Sodium Chloride (NS)', '5% Dextrose (D5W)'],
      incompatibleDiluents: ['Direct physical mixing with other IV additives without testing'],
      standardDilution: {
        doseRange: '1000 mg (100 mL)',
        volume: '100 mL ready-to-infuse glass vial',
        finalConcentration: '10 mg/mL',
        route: 'IV Infusion',
        infusionDuration: 'Infuse over 15 minutes'
      },
      ySiteCompatibility: {
        compatible: ['Morphine', 'Tramadol', 'Fentanyl', 'Ondansetron', 'Ceftriaxone'],
        incompatible: ['Diazepam'],
        requiresSeparateLine: false
      },
      monitoringParameters: ['Pain score', 'Body temperature', 'Liver function tests in high-dose prolonged therapy']
    },
    shelfLife: {
      intactShelfLife: '36 months from manufacture date',
      storageConditions: {
        temperature: 'Room Temperature (15-30°C)',
        protectFromLight: true,
        protectFromMoisture: true,
        specialStorageNote: 'Do not refrigerate IV solution (crystallization risk).'
      },
      postReconstitutionStability: { roomTempDuration: 'N/A', refrigeratedDuration: 'N/A' },
      postDilutionStability: {
        roomTempDuration: 'Use immediately; discard any unused vial portion within 1 hour of opening.',
        refrigeratedDuration: 'Not recommended'
      },
      multiDoseVialPolicy: 'Single Use Only - Discard Remainder'
    },
    quota: {
      monthlyQuota: 10000,
      quotaUsed: 4200,
      quotaRemaining: 5800,
      unit: 'Tablets / Vials',
      lowStockThreshold: 1500,
      isLowStock: false,
      isCriticalShortage: false,
      estimatedRunOutDays: 41,
      lastRestockedDate: '2026-08-15',
      bufferStockLevel: 2000
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-GEN-012',
        drugName: 'Ibuprofen 400mg Tablet',
        prescriberCategory: 'B',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'NSAID option for inflammatory pain when no contraindications (GI ulcer, renal disease, asthma) exist.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-22',
    verifiedBy: 'Pharmacotherapy & Formulari Sub-Committee'
  },

  // 12. Broad Spectrum Antibacterial - Amoxicillin/Clavulanate
  {
    id: 'DRUG-ABX-012',
    genericName: 'Amoxicillin + Clavulanic Acid (Co-Amoxiclav)',
    brandNames: ['Augmentin 625mg', 'Curam 1.2g IV', 'Augmentin Syrup 228mg/5mL'],
    mohDrugCode: 'KKM-ABX-0012',
    atcCode: 'J01CR02',
    atcCategory: 'Antiinfectives for Systemic Use - Beta-lactam Antibacterials, Penicillins',
    therapeuticClass: 'Aminopenicillin with Beta-Lactamase Inhibitor',
    prescriberCategory: 'B',
    poisonCategory: 'Group B',
    skimPerolehan: 'APPL',
    dosageForms: ['Tablet 625mg', 'Oral Suspension 228mg/5mL', 'IV Injection/Infusion Vial 1.2g'],
    strengths: ['625mg (500/125mg)', '228mg/5mL', '1.2g (1000/200mg) IV Vial'],
    indications: [
      'Community-acquired pneumonia (CAP) and acute bacterial exacerbations of COPD',
      'Acute bacterial rhinosinusitis and otitis media',
      'Complicated urinary tract infections (UTI) and intra-abdominal infections',
      'Skin and soft tissue infections (cellulitis, animal bites, diabetic foot ulcers)'
    ],
    contraindications: [
      'History of severe penicillin allergy / anaphylaxis',
      'History of amoxicillin/clavulanate-associated cholestatic jaundice or hepatic dysfunction'
    ],
    standardDosage: {
      adult: 'Oral: 625mg TDS (every 8 hours) or 1g BD with meals. IV: 1.2g every 8 hours (increased to every 6 hours in severe infections).',
      pediatric: 'Oral: 25-45 mg/kg/day (amoxicillin component) in 2 divided doses for mild infections; 80-90 mg/kg/day for severe otitis media. IV: 30 mg/kg every 8 hours.',
      elderlyOrRenal: 'CrCl 10-30 mL/min: 625mg BD or 1.2g stat then 600mg IV BD. CrCl < 10 mL/min: 625mg OD or 1.2g stat then 600mg IV OD.'
    },
    administrationRoutes: ['Oral (take at start of meal to reduce GI intolerance)', 'IV Slow Injection (over 3-4 min)', 'IV Infusion (over 30 min)'],
    sideEffects: [
      'Diarrhea (clavulanic acid motility effect, 10-15%)',
      'Cholestatic jaundice / acute hepatitis (delayed presentation up to 6 weeks post-course)',
      'Maculopapular rash, candidiasis (oral/vaginal)',
      'Clostridioides difficile-associated colitis'
    ],
    cautionsAndWarnings: [
      'Administer IV strictly within 20 minutes of reconstitution in Water for Injection to prevent degradation.',
      'Incompatible with Glucose / Dextrose solutions (causes rapid chemical decomposition).'
    ],
    isHAM: false,
    isLASA: false,
    interactions: [
      {
        interactingDrug: 'Methotrexate',
        severity: 'MAJOR',
        effect: 'Penicillins reduce renal tubular clearance of methotrexate, leading to increased methotrexate toxicity.',
        management: 'Monitor methotrexate levels and hematologic toxicity closely.'
      },
      {
        interactingDrug: 'Warfarin Sodium',
        severity: 'MODERATE',
        effect: 'Alteration of intestinal flora may enhance hypoprothrombinemic effect of oral anticoagulants.',
        management: 'Monitor INR upon starting and stopping antibacterial therapy.'
      }
    ],
    antimicrobial: {
      isAntimicrobial: true,
      nagRestrictionTier: 'Free (F)',
      antimicrobialClass: 'Penicillin + Beta-Lactamase Inhibitor',
      primaryIndications: ['CAP', 'Sinusitis', 'Animal bites', 'Surgical prophylaxis (colorectal/appendectomy)'],
      empiricFirstLineFor: ['Community-Acquired Intra-abdominal Sepsis (Mild-Mod)', 'Infected Diabetic Foot Ulcer']
    },
    reconstitution: {
      isApplicable: true,
      standardVialStrength: '1.2g (1000mg Amoxicillin + 200mg Clavulanate)',
      preferredSolvent: 'Water for Injection (WFI)',
      solventVolume: '20 mL',
      resultingConcentration: '60 mg/mL',
      stepByStepInstructions: [
        'Aseptically inject 20 mL Water for Injection into 1.2g vial.',
        'Shake vigorously until dissolved (a transient pink coloration may appear and fade to pale straw yellow).',
        'Use immediately or dilute within 15 minutes.'
      ],
      physicalAppearance: 'Clear pale yellow to straw colored solution',
      cautions: ['Do not use Dextrose/Glucose infusion solutions for reconstitution.']
    },
    dilution: {
      isApplicable: true,
      compatibleDiluents: ['0.9% Sodium Chloride (NS)', 'Hartmanns / Ringer Lactate'],
      incompatibleDiluents: ['5% Dextrose', '10% Dextrose', 'Sodium Bicarbonate', 'Lipid Emulsion'],
      standardDilution: {
        doseRange: '1.2g - 2.4g',
        volume: '50 mL or 100 mL 0.9% NaCl',
        finalConcentration: '12 - 24 mg/mL',
        route: 'IV Infusion',
        infusionDuration: 'Infuse over 30 to 40 minutes'
      },
      ySiteCompatibility: {
        compatible: ['Paracetamol', 'Furosemide', 'Heparin', 'Metronidazole'],
        incompatible: ['Aminoglycosides (Gentamicin/Amikacin - separate line)'],
        requiresSeparateLine: false
      },
      monitoringParameters: ['Renal function (eGFR)', 'Liver function tests (ALT/ALP)', 'Stool frequency (monitor for C. diff)']
    },
    shelfLife: {
      intactShelfLife: '24 months',
      storageConditions: {
        temperature: 'Room Temperature (15-30°C)',
        protectFromLight: true,
        protectFromMoisture: true,
        specialStorageNote: 'Reconstituted oral suspension MUST be stored in refrigerator (2-8°C) and discarded after 7 days.'
      },
      postReconstitutionStability: {
        roomTempDuration: 'Must be administered within 20 minutes of reconstitution if given as IV push.',
        refrigeratedDuration: 'IV solution: Do not store.'
      },
      postDilutionStability: {
        roomTempDuration: 'Complete infusion within 4 hours in 0.9% NaCl.',
        refrigeratedDuration: '8 hours at 2-8°C in 0.9% NaCl'
      },
      multiDoseVialPolicy: 'Single Use Only - Discard Remainder'
    },
    quota: {
      monthlyQuota: 3000,
      quotaUsed: 1850,
      quotaRemaining: 1150,
      unit: 'Tablets / Vials',
      lowStockThreshold: 500,
      isLowStock: false,
      isCriticalShortage: false,
      estimatedRunOutDays: 19,
      lastRestockedDate: '2026-08-14',
      bufferStockLevel: 400
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-ABX-013',
        drugName: 'Cefuroxime Axetil 500mg Tablet / 750mg IV',
        prescriberCategory: 'B',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Second generation cephalosporin for non-anaphylactic penicillin sensitive patients.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-24',
    verifiedBy: 'Hospital Antibiotic Stewardship & AMS Committee'
  },

  // 13. Third Generation Cephalosporin - Ceftriaxone
  {
    id: 'DRUG-ABX-013',
    genericName: 'Ceftriaxone Sodium',
    brandNames: ['Rocephin 1g IV', 'Ceftriaxone KKM 1g'],
    mohDrugCode: 'KKM-ABX-0013',
    atcCode: 'J01DD04',
    atcCategory: 'Antiinfectives for Systemic Use - Third-generation Cephalosporins',
    therapeuticClass: 'Broad-Spectrum 3rd Generation Cephalosporin',
    prescriberCategory: 'B',
    poisonCategory: 'Group B',
    skimPerolehan: 'APPL',
    dosageForms: ['Powder for Injection 1g Vial', 'Powder for Injection 2g Vial'],
    strengths: ['1g Vial', '2g Vial'],
    indications: [
      'Bacterial meningitis (high CSF penetration)',
      'Severe community-acquired pneumonia (CAP) requiring hospitalization',
      'Pyelonephritis and complicated urinary tract infections',
      'Bacteremia / Sepsis, gonococcal infections, enteric fever (Typhoid)'
    ],
    contraindications: [
      'Severe IgE-mediated cephalosporin or beta-lactam anaphylaxis',
      'Neonates (≤ 28 days) with hyperbilirubinemia or receiving Calcium-containing IV solutions (fatal ceftriaxone-calcium precipitation)'
    ],
    standardDosage: {
      adult: 'Standard: 1g - 2g IV once daily (OD). Severe sepsis / Meningitis: 2g IV BD (every 12 hours).',
      pediatric: '50 - 80 mg/kg/day IV in single dose (Max 2g/day). Meningitis: 100 mg/kg/day divided BD (Max 4g/day).',
      elderlyOrRenal: 'Dual hepatic and renal excretion: No dose adjustment needed in pure renal impairment unless combined hepatic and renal failure exists (max 2g/day).'
    },
    administrationRoutes: ['IV Infusion (over 30 min)', 'IV Slow Push (over 3-5 min)', 'Deep IM (with 1% Lidocaine solvent)'],
    sideEffects: [
      'Biliary sludging / pseudolithiasis (reversible upon cessation)',
      'Diarrhea, C. difficile colitis',
      'Eosinophilia, thrombocytosis, rash'
    ],
    cautionsAndWarnings: [
      'ABSOLUTE CONTRAINDICATION: Co-administration with Calcium-containing IV fluids (e.g. Hartmanns / Ringer Lactate) via same line even with flushing in neonates.'
    ],
    isHAM: false,
    isLASA: false,
    interactions: [
      {
        interactingDrug: 'Calcium Salts (IV Calcium Gluconate / Calcium Chloride)',
        severity: 'CRITICAL',
        effect: 'Insoluble calcium-ceftriaxone precipitation in lungs and kidneys (fatal risk in neonates).',
        management: 'Absolute contraindication in neonates. Flush line thoroughly in older children and adults.'
      },
      {
        interactingDrug: 'Warfarin Sodium',
        severity: 'MODERATE',
        effect: 'Inhibition of vitamin K-producing gut flora may increase INR and bleeding risk.',
        management: 'Monitor INR during ceftriaxone therapy.'
      }
    ],
    antimicrobial: {
      isAntimicrobial: true,
      nagRestrictionTier: 'Free (F)',
      antimicrobialClass: '3rd Generation Cephalosporin',
      primaryIndications: ['Meningitis', 'Severe CAP', 'Pyelonephritis', 'Typhoid'],
      empiricFirstLineFor: ['Bacterial Meningitis (empiric)', 'Inpatient CAP with Azithromycin']
    },
    reconstitution: {
      isApplicable: true,
      standardVialStrength: '1g Vial',
      preferredSolvent: 'Water for Injection (WFI) for IV; 1% Lidocaine for IM',
      solventVolume: '10 mL for IV push; 3.5 mL for IM',
      resultingConcentration: '100 mg/mL (IV)',
      stepByStepInstructions: ['Inject 10 mL WFI into 1g vial. Shake well until clear.'],
      physicalAppearance: 'Clear pale yellow to amber solution'
    },
    dilution: {
      isApplicable: true,
      compatibleDiluents: ['0.9% Sodium Chloride', '5% Dextrose in Water', '10% Dextrose'],
      incompatibleDiluents: ['Calcium-containing solutions (Hartmanns, Ringer Lactate, TPN with Calcium)'],
      standardDilution: {
        doseRange: '1g - 2g',
        volume: '50 mL or 100 mL 0.9% NaCl',
        finalConcentration: '10 - 20 mg/mL',
        route: 'IV Infusion',
        infusionDuration: 'Infuse over 30 minutes'
      },
      ySiteCompatibility: {
        compatible: ['Vancomycin (with thorough intermediate flush)', 'Metronidazole', 'Paracetamol'],
        incompatible: ['Calcium Gluconate', 'Fluconazole', 'Aminophylline'],
        requiresSeparateLine: false
      },
      monitoringParameters: ['CBC with differential', 'Renal & liver function on prolonged therapy (> 14 days)']
    },
    shelfLife: {
      intactShelfLife: '36 months',
      storageConditions: {
        temperature: 'Room Temperature (15-30°C)',
        protectFromLight: true,
        protectFromMoisture: true
      },
      postReconstitutionStability: {
        roomTempDuration: '24 hours at 25°C',
        refrigeratedDuration: '72 hours at 2-8°C'
      },
      postDilutionStability: {
        roomTempDuration: '24 hours in 0.9% NaCl',
        refrigeratedDuration: '72 hours at 2-8°C'
      },
      multiDoseVialPolicy: 'Single Use Only - Discard Remainder'
    },
    quota: {
      monthlyQuota: 2500,
      quotaUsed: 1600,
      quotaRemaining: 900,
      unit: 'Vials (1g)',
      lowStockThreshold: 400,
      isLowStock: false,
      isCriticalShortage: false,
      estimatedRunOutDays: 17,
      lastRestockedDate: '2026-08-16',
      bufferStockLevel: 300
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-ABX-014',
        drugName: 'Cefotaxime Sodium 1g IV Vial',
        prescriberCategory: 'B',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Safe 3rd generation cephalosporin for neonates with hyperbilirubinemia or requiring Calcium fluids.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-25',
    verifiedBy: 'National Antimicrobial Guideline Review Team'
  },

  // 14. First-line Antidiabetic - Metformin
  {
    id: 'DRUG-ENDO-014',
    genericName: 'Metformin Hydrochloride',
    brandNames: ['Glucophage 500mg/850mg', 'Glucophage XR 500mg/1000mg', 'Metformin KKM 500mg'],
    mohDrugCode: 'KKM-ENDO-0014',
    atcCode: 'A10BA02',
    atcCategory: 'Alimentary Tract and Metabolism - Blood Glucose Lowering Drugs',
    therapeuticClass: 'Biguanide Oral Antidiabetic',
    prescriberCategory: 'B',
    poisonCategory: 'Group B',
    skimPerolehan: 'APPL',
    dosageForms: ['Tablet 500mg', 'Tablet 850mg', 'Extended Release Tablet (XR) 500mg', 'XR 1000mg'],
    strengths: ['500mg', '850mg', '500mg XR', '1000mg XR'],
    indications: [
      'First-line pharmacological treatment of Type 2 Diabetes Mellitus (T2DM)',
      'Prediabetes and metabolic syndrome insulin resistance',
      'Polycystic ovary syndrome (PCOS) insulin sensitizer'
    ],
    contraindications: [
      'Severe renal impairment (eGFR < 30 mL/min/1.73m²)',
      'Acute metabolic acidosis, diabetic ketoacidosis, or lactic acidosis history',
      'Severe tissue hypoperfusion (cardiogenic / septic shock, acute decompensated heart failure, severe hepatic failure)'
    ],
    standardDosage: {
      adult: 'Immediate Release: Start 500mg OD or BD with meals; titrate weekly to 850mg BD or 1000mg BD (Maximum 2550mg/day). XR formulation: Start 500mg OD with evening dinner, titrate to max 2000mg OD.',
      pediatric: '≥ 10 years old: Start 500mg OD with food, max 2000mg/day in divided doses.',
      elderlyOrRenal: 'eGFR 45-59 mL/min: Max 1000mg/day, monitor renal function every 3-6 months. eGFR 30-44 mL/min: Max 500mg/day, monitor every 3 months. eGFR < 30 mL/min: CONTRAINDICATED.'
    },
    administrationRoutes: ['Oral (administer with or after meals to minimize gastrointestinal discomfort)'],
    sideEffects: [
      'Gastrointestinal: Diarrhea, nausea, vomiting, abdominal bloating, metallic taste (20-30% on initiation)',
      'Lactic acidosis (rare 3-5 per 100,000 patient-years, but 50% mortality)',
      'Vitamin B12 deficiency on long-term treatment (> 3-5 years)'
    ],
    cautionsAndWarnings: [
      'Withhold metformin 48 hours prior to iodinated radiological contrast procedures in patients with eGFR < 60 mL/min; re-evaluate renal function before resuming.',
      'Temporarily stop during acute dehydrating illness (severe gastroenteritis, sepsis).'
    ],
    isHAM: false,
    isLASA: false,
    interactions: [
      {
        interactingDrug: 'Iodinated Radiocontrast Media',
        severity: 'MAJOR',
        effect: 'Contrast-induced nephropathy leading to acute metformin accumulation and lactic acidosis.',
        management: 'Suspend metformin at time of or prior to contrast exam; restart after 48h if eGFR confirmed stable.'
      }
    ],
    reconstitution: { isApplicable: false },
    dilution: { isApplicable: false, compatibleDiluents: [], incompatibleDiluents: [], standardDilution: { doseRange: '', volume: '', finalConcentration: '', route: 'IV Infusion', infusionDuration: '' }, ySiteCompatibility: { compatible: [], incompatible: [], requiresSeparateLine: false }, monitoringParameters: ['HbA1c', 'eGFR', 'Serum Creatinine', 'Serum Vitamin B12'] },
    shelfLife: {
      intactShelfLife: '36 months',
      storageConditions: { temperature: 'Room Temperature (15-30°C)', protectFromLight: false, protectFromMoisture: true },
      postReconstitutionStability: { roomTempDuration: 'N/A', refrigeratedDuration: 'N/A' },
      postDilutionStability: { roomTempDuration: 'N/A', refrigeratedDuration: 'N/A' },
      multiDoseVialPolicy: 'Single Use Only - Discard Remainder'
    },
    quota: {
      monthlyQuota: 25000,
      quotaUsed: 14500,
      quotaRemaining: 10500,
      unit: 'Tablets',
      lowStockThreshold: 4000,
      isLowStock: false,
      isCriticalShortage: false,
      estimatedRunOutDays: 22,
      lastRestockedDate: '2026-08-10',
      bufferStockLevel: 3500
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-ENDO-015',
        drugName: 'Gliclazide 80mg / Gliclazide Modified Release (MR) 60mg',
        prescriberCategory: 'B',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Sulfonylurea secretagogue for glycemic control when Metformin is contraindicated due to renal failure.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-20',
    verifiedBy: 'Department of Internal Medicine & Endocrine Subspecialty'
  },

  // 15. Dihydropyridine Calcium Channel Blocker - Amlodipine
  {
    id: 'DRUG-CARD-015',
    genericName: 'Amlodipine Besylate',
    brandNames: ['Norvasc 5mg/10mg', 'Amlodipine KKM 5mg', 'Amlodipine KKM 10mg'],
    mohDrugCode: 'KKM-CARD-0015',
    atcCode: 'C08CA01',
    atcCategory: 'Cardiovascular System - Calcium Channel Blockers',
    therapeuticClass: 'Dihydropyridine Calcium Channel Blocker (CCB)',
    prescriberCategory: 'B',
    poisonCategory: 'Group B',
    skimPerolehan: 'APPL',
    dosageForms: ['Tablet 5mg', 'Tablet 10mg'],
    strengths: ['5mg Tablet', '10mg Tablet'],
    indications: [
      'Essential hypertension (first-line monotherapy or in combination)',
      'Chronic stable angina pectoris and vasospastic (Prinzmetal) angina',
      'Coronary artery disease (CAD) risk reduction'
    ],
    contraindications: [
      'Severe hypotension (systolic BP < 90 mmHg)',
      'Cardiogenic shock or severe aortic stenosis',
      'Unstable heart failure post-acute myocardial infarction'
    ],
    standardDosage: {
      adult: 'Hypertension / Angina: Initial 5mg once daily (OD); may increase to maximum 10mg OD after 1-2 weeks based on clinical blood pressure response.',
      pediatric: '6-17 years old: 2.5mg - 5mg once daily.',
      elderlyOrRenal: 'Elderly / Hepatic impairment: Start at 2.5mg OD. Renal impairment: No dose adjustment required.'
    },
    administrationRoutes: ['Oral (may be taken with or without meals, with a glass of water)'],
    sideEffects: [
      'Dose-dependent peripheral ankle edema (precapillary vasodilation, 10-15% at 10mg)',
      'Headache, facial flushing, dizziness, fatigue',
      'Palpitations, gingival hyperplasia (rare)'
    ],
    cautionsAndWarnings: [
      'Gradual onset and prolonged elimination half-life (35-50 hours) — full antihypertensive effect takes 7-14 days to stabilize.'
    ],
    isHAM: false,
    isLASA: false,
    interactions: [
      {
        interactingDrug: 'Simvastatin',
        severity: 'MAJOR',
        effect: 'Amlodipine inhibits CYP3A4-mediated simvastatin metabolism, increasing rhabdomyolysis risk.',
        management: 'Limit Simvastatin dose to maximum 20mg/day when co-prescribed with Amlodipine (or switch to Atorvastatin).'
      }
    ],
    reconstitution: { isApplicable: false },
    dilution: { isApplicable: false, compatibleDiluents: [], incompatibleDiluents: [], standardDilution: { doseRange: '', volume: '', finalConcentration: '', route: 'IV Infusion', infusionDuration: '' }, ySiteCompatibility: { compatible: [], incompatible: [], requiresSeparateLine: false }, monitoringParameters: ['Blood pressure', 'Heart rate', 'Lower extremity edema'] },
    shelfLife: {
      intactShelfLife: '36 months',
      storageConditions: { temperature: 'Room Temperature (15-30°C)', protectFromLight: true, protectFromMoisture: true },
      postReconstitutionStability: { roomTempDuration: 'N/A', refrigeratedDuration: 'N/A' },
      postDilutionStability: { roomTempDuration: 'N/A', refrigeratedDuration: 'N/A' },
      multiDoseVialPolicy: 'Single Use Only - Discard Remainder'
    },
    quota: {
      monthlyQuota: 30000,
      quotaUsed: 18200,
      quotaRemaining: 11800,
      unit: 'Tablets',
      lowStockThreshold: 5000,
      isLowStock: false,
      isCriticalShortage: false,
      estimatedRunOutDays: 20,
      lastRestockedDate: '2026-08-12',
      bufferStockLevel: 4500
    },
    alternativeDrugs: [
      {
        drugId: 'DRUG-CARD-016',
        drugName: 'Felodipine 5mg / 10mg Extended Release Tablet',
        prescriberCategory: 'B',
        therapeuticEquivalence: 'Class Equivalent',
        reasonForChoice: 'Alternative dihydropyridine CCB for patients experiencing severe amlodipine ankle edema.',
        stockStatus: 'In Stock'
      }
    ],
    lastUpdated: '2026-08-20',
    verifiedBy: 'Hospital Cardiology & Non-Communicable Disease (NCD) Clinic'
  }
]

export const FORMULARI_DATABASE: DrugEntry[] = [
  ...DETAILED_SPECIALIST_MONOGRAPHS,
  ...(officialFukkmData as DrugEntry[]).filter(
    kkm => !DETAILED_SPECIALIST_MONOGRAPHS.some(
      d => d.genericName.toLowerCase().trim() === kkm.genericName.toLowerCase().trim() ||
           (d.mohDrugCode && kkm.mohDrugCode && d.mohDrugCode === kkm.mohDrugCode)
    )
  )
]

