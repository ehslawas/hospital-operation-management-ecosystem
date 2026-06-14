import React, { forwardRef } from 'react'
import { JATA_LOGO_BASE64 } from '@/constants/logo'
import { UnitCatalogItemWithRelations, DrugCategory } from '@/types/pharmacy'

interface UnitCatalogPrintTemplateProps {
    items: UnitCatalogItemWithRelations[]
    categories: DrugCategory[]
    hospitalName?: string
    unitName?: string
    activeTab: 'drug' | 'non_drug'
}

export const UnitCatalogPrintTemplate = forwardRef<HTMLDivElement, UnitCatalogPrintTemplateProps>(({
    items,
    categories,
    hospitalName = 'Hospital Daerah Lawas',
    unitName = 'Unit Catalog',
    activeTab
}, ref) => {

    const getSourceName = (item: UnitCatalogItemWithRelations) => {
        // Check relations first as they are definitely populated by the service
        // Use type assertion to access nested properties safely
        const itemAny = item as any

        // 1. Check explicit Foreign Key relations (Strongest signal)
        if (item.contract_id || itemAny.contract) return 'KONTRAK'
        if (item.appl_drug_id || item.appl_non_drug_id || itemAny.appl_drug || itemAny.appl_non_drug) return 'APPL'
        if (item.lp_drug_id || item.lp_non_drug_id || itemAny.lp_drug || itemAny.lp_non_drug) return 'LP'

        // 2. Check Item's Procurement Vote (Unit Level Override)
        if (item.procurement_vote) {
            const vote = item.procurement_vote.toLowerCase()
            if (vote === 'appl') return 'APPL'
            if (vote === 'cc' || vote === 'contract') return 'KONTRAK'
            if (vote === 'lp') return 'LP'
            if (vote === 'dp') return 'DP'
        }

        // 3. Check Master Drug's Procurement Vote (Default from Master Catalog)
        if (item.drug && item.drug.procurement_vote) {
            const vote = item.drug.procurement_vote.toLowerCase()
            if (vote === 'appl') return 'APPL'
            if (vote === 'cc' || vote === 'contract') return 'KONTRAK'
            if (vote === 'lp') return 'LP'
        }

        return 'MASTER'
    }

    // Helper to get item details
    const getItemDetails = (item: UnitCatalogItemWithRelations) => {
        const itemAny = item as any
        const contract = item.contract || itemAny.contract

        if (activeTab === 'drug') {
            const drug = item.drug
            // Type assertion to access nested relations that are populated by the service but might be missing in strict types
            const drugWithRelations = drug as any
            const applDrug = item.appl_drug || itemAny.appl_drug
            const lpDrug = item.lp_drug || itemAny.lp_drug

            // Try to get category name from:
            // 1. Unit catalog override (most specific)
            // 2. Nested drug object (master data)
            // 3. ID lookup (fallback)
            let fukkmName = '-'
            if (item.unit_category?.category_name) {
                fukkmName = item.unit_category.category_name
            } else if (drugWithRelations?.category?.category_name) {
                fukkmName = drugWithRelations.category.category_name
            } else if (drug?.category_id) {
                fukkmName = categories.find(c => c.id === drug.category_id)?.category_name || '-'
            }

            let therapeuticName = '-'
            if (item.unit_therapeutic_class?.category_name) {
                therapeuticName = item.unit_therapeutic_class.category_name
            } else if (drugWithRelations?.therapeutic_class?.category_name) {
                therapeuticName = drugWithRelations.therapeutic_class.category_name
            } else if (item.therapeutic_class_id) {
                therapeuticName = categories.find(c => c.id === item.therapeutic_class_id)?.category_name || '-'
            } else if (drug?.therapeutic_class_id) {
                therapeuticName = categories.find(c => c.id === drug.therapeutic_class_id)?.category_name || '-'
            }

            return {
                code: drug?.drug_code || contract?.item_code || applDrug?.item_code || lpDrug?.item_code || contract?.contract_number || '-',
                name: drug?.drug_name || contract?.item_name || applDrug?.item_name || lpDrug?.item_name || '-',
                fukkm: fukkmName,
                therapeutic: therapeuticName
            }
        } else {
            const nonDrug = item.non_drug
            const applNonDrug = item.appl_non_drug || itemAny.appl_non_drug
            const lpNonDrug = item.lp_non_drug || itemAny.lp_non_drug

            return {
                code: nonDrug?.item_code || contract?.item_code || applNonDrug?.item_code || lpNonDrug?.item_code || contract?.contract_number || '-',
                name: nonDrug?.item_name || contract?.item_name || applNonDrug?.item_name || lpNonDrug?.item_name || '-',
                fukkm: '-', // Not applicable
                therapeutic: '-' // Not applicable
            }
        }
    }

    return (
        <div ref={ref} className="print-content bg-white p-8 font-serif text-black hidden print:block">
            <style type="text/css" media="print">
                {`
                    @page { size: A4 landscape; margin: 10mm; }
                    body { 
                        visibility: hidden; 
                    }
                    .print-content { 
                        visibility: visible;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        z-index: 9999;
                    }
                    .print-content * {
                        visibility: visible;
                    }
                    table { page-break-inside: auto; width: 100%; border-collapse: collapse; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    thead { display: table-header-group; }
                    tfoot { display: table-footer-group; }
                    th, td { border: 1px solid black; padding: 4px 8px; font-size: 12px; }
                    th { background-color: #f3f4f6 !important; font-weight: bold; text-align: left; }
                `}
            </style>

            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
                <div className="flex items-center gap-6">
                    <img src={JATA_LOGO_BASE64} alt="Jata Negara" className="w-[80px] h-[80px] object-contain" />
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-wider">Kementerian Kesihatan Malaysia</h1>
                        <h2 className="text-lg font-bold">{hospitalName}</h2>
                        <h3 className="text-base font-semibold mt-2 uppercase">{unitName} - Senarai Item {activeTab === 'drug' ? 'Ubat' : 'Bukan Ubat'}</h3>
                    </div>
                </div>
                <div className="text-right text-sm">
                    <p><strong>Tarikh Cetakan:</strong> {new Date().toLocaleDateString('en-MY')}</p>
                    <p><strong>Jumlah Item:</strong> {items.length}</p>
                </div>
            </div>

            {/* Table */}
            <table className="w-full">
                <thead>
                    <tr>
                        <th className="text-center w-[50px]">Bil.</th>
                        <th>Kod Item</th>
                        <th>Nama Item</th>
                        {activeTab === 'drug' && (
                            <>
                                <th>Kategori FUKKM</th>
                                <th>Kategori Terapeutik</th>
                            </>
                        )}
                        {/* Only show source for Non-Drug as requested implicitly by user focus on Drug Categorization, but User Prompt said "display specific item details such as... Source" generally. I will include Source for both. */}
                        <th className="text-center w-[100px]">Sumber</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => {
                        const details = getItemDetails(item)
                        return (
                            <tr key={item.id}>
                                <td className="text-center">{index + 1}</td>
                                <td>{details.code}</td>
                                <td>{details.name}</td>
                                {activeTab === 'drug' && (
                                    <>
                                        <td>{details.fukkm}</td>
                                        <td>{details.therapeutic}</td>
                                    </>
                                )}
                                <td className="text-center text-xs font-bold uppercase">
                                    {getSourceName(item)}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-black text-center text-xs">
                <p>Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia</p>
                <p>Dikeluarkan oleh Sistem Pengurusan Operasi Hospital</p>
            </div>
        </div>
    )
})

UnitCatalogPrintTemplate.displayName = 'UnitCatalogPrintTemplate'
