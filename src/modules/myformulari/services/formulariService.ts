import { DrugEntry, PrescriberCategory, HAMCategory, DrugInteraction } from '../types/formulariTypes'
import { FORMULARI_DATABASE } from '../data/formulariDatabase'

const STORAGE_KEY_FORMULARI_V2 = 'myformulari_database_v12.0_comprehensive_storage_infusion_guidelines'

/**
 * Get all drugs with localStorage fallback & cache invalidation support
 */
export function getAllFormulariDrugs(): DrugEntry[] {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_FORMULARI_V2)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Failed to read formulari database cache', err)
  }
  
  // Set default seed
  try {
    localStorage.setItem(STORAGE_KEY_FORMULARI_V2, JSON.stringify(FORMULARI_DATABASE))
  } catch (e) {
    // Ignore quota errors
  }
  return FORMULARI_DATABASE
}

/**
 * Get single drug by ID
 */
export function getDrugById(id: string): DrugEntry | undefined {
  const all = getAllFormulariDrugs()
  return all.find(d => d.id === id || d.mohDrugCode === id)
}

/**
 * Filter drugs with rich clinical search
 */
export function searchDrugs(
  query: string,
  filters: {
    prescriberCategory?: PrescriberCategory | 'ALL'
    hamOnly?: boolean
    hamCategory?: HAMCategory | 'ALL'
    lasaOnly?: boolean
    antimicrobialOnly?: boolean
    lowStockOnly?: boolean
    therapeuticClass?: string | 'ALL'
    skimPerolehan?: string | 'ALL'
  } = {}
): DrugEntry[] {
  const all = getAllFormulariDrugs()
  const q = query.trim().toLowerCase()

  return all.filter(drug => {
    // Text search
    if (q) {
      const matchGeneric = drug.genericName.toLowerCase().includes(q)
      const matchBrand = drug.brandNames.some(b => b.toLowerCase().includes(q))
      const matchCode = (drug.mohDrugCode || '').toLowerCase().includes(q)
      const matchAtc = drug.atcCode.toLowerCase().includes(q)
      const matchClass = drug.therapeuticClass.toLowerCase().includes(q)
      const matchIndication = drug.indications.some(ind => ind.toLowerCase().includes(q))
      
      if (!matchGeneric && !matchBrand && !matchCode && !matchAtc && !matchClass && !matchIndication) {
        return false
      }
    }

    // Prescriber Category
    if (filters.prescriberCategory && filters.prescriberCategory !== 'ALL') {
      if (drug.prescriberCategory !== filters.prescriberCategory) return false
    }

    // HAM
    if (filters.hamOnly && !drug.isHAM) return false
    if (filters.hamCategory && filters.hamCategory !== 'ALL') {
      if (drug.hamCategory !== filters.hamCategory) return false
    }

    // LASA
    if (filters.lasaOnly && !drug.isLASA) return false

    // Antimicrobial
    if (filters.antimicrobialOnly && !drug.antimicrobial?.isAntimicrobial) return false

    // Low stock
    if (filters.lowStockOnly && !drug.quota.isLowStock && !drug.quota.isCriticalShortage) return false

    // Therapeutic class
    if (filters.therapeuticClass && filters.therapeuticClass !== 'ALL') {
      if (!drug.therapeuticClass.toLowerCase().includes(filters.therapeuticClass.toLowerCase())) return false
    }

    // Skim Perolehan
    if (filters.skimPerolehan && filters.skimPerolehan !== 'ALL') {
      if (drug.skimPerolehan !== filters.skimPerolehan) return false
    }

    return true
  })
}

/**
 * Check drug-drug interactions between a list of drugs
 */
export function checkDrugInteractions(drugIds: string[]): {
  drugA: DrugEntry
  drugB: DrugEntry
  interaction: DrugInteraction
}[] {
  const all = getAllFormulariDrugs()
  const selected = all.filter(d => drugIds.includes(d.id))
  const results: { drugA: DrugEntry; drugB: DrugEntry; interaction: DrugInteraction }[] = []

  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const drugA = selected[i]
      const drugB = selected[j]

      // Check if drugA lists interactions with drugB
      for (const inter of drugA.interactions) {
        if (
          inter.interactingDrug.toLowerCase().includes(drugB.genericName.toLowerCase()) ||
          drugB.genericName.toLowerCase().includes(inter.interactingDrug.toLowerCase()) ||
          drugB.brandNames.some(b => inter.interactingDrug.toLowerCase().includes(b.toLowerCase()))
        ) {
          results.push({ drugA, drugB, interaction: inter })
        }
      }
    }
  }

  return results
}

/**
 * Summary stats for hub & dashboard
 */
export function getFormulariSummaryStats() {
  const all = getAllFormulariDrugs()
  const totalDrugs = all.length
  const hamCount = all.filter(d => d.isHAM).length
  const lasaCount = all.filter(d => d.isLASA).length
  const lowStockCount = all.filter(d => d.quota.isLowStock || d.quota.isCriticalShortage).length
  const antimicrobialCount = all.filter(d => d.antimicrobial?.isAntimicrobial).length
  const ivDilutionCount = all.filter(d => d.dilution?.isApplicable).length

  return {
    totalDrugs,
    hamCount,
    lasaCount,
    lowStockCount,
    antimicrobialCount,
    ivDilutionCount
  }
}
