import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { PurchaseOrderWithRelations } from '@/types/pharmacy'
import { PurchaseOrderTemplate } from '../PurchaseOrderTemplate'
import { PharmacyPOSignatures, getPharmacyPOSignatures, DEPT_CODE_MAPPING } from '@/services/pharmacy/pharmacySettingsService'
import { Button } from '@/components/ui/Button'

interface POItemsModalProps {
    isOpen: boolean
    onClose: () => void
    po: PurchaseOrderWithRelations | null
}

export const POItemsModal: React.FC<POItemsModalProps> = ({ isOpen, onClose, po }) => {
    const [signatures, setSignatures] = useState<PharmacyPOSignatures>({
        applicantName: '',
        applicantPosition: '',
        headName: '',
        headPosition: ''
    })

    useEffect(() => {
        if (!isOpen || !po) return

        const loadSignatures = async () => {
            // 1. If snapshot exists, use it (History of truth)
            if ((po as any).signature_snapshot) {
                setSignatures((po as any).signature_snapshot)
                return
            }

            // 2. Fetch from Settings based on Department
            if (po.hospital_id) {
                try {
                    let deptId = 'pharmacy_logistics';
                    if (po.department) {
                        deptId = DEPT_CODE_MAPPING[po.department] || po.department
                    }

                    const result = await getPharmacyPOSignatures(po.hospital_id, deptId)
                    if (result.data) {
                        setSignatures(result.data)
                        return
                    }
                } catch (e) {
                    console.error('Failed to load signatures', e)
                }
            }

            // 3. Fallback
            setSignatures({
                applicantName: po.created_by_user?.full_name || 'System User',
                applicantPosition: 'Pegawai Farmasi',
                headName: 'Ketua Jabatan',
                headPosition: 'Pegawai Farmasi YM'
            })
        }

        loadSignatures()
    }, [isOpen, po])

    if (!po) return null

    // Safe access to budget
    const budgetObj = Array.isArray(po.budget) ? po.budget[0] : po.budget
    const balance = budgetObj?.remaining_balance || budgetObj?.current_balance

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Purchase Order Details: ${po.po_number}`}
            size="full"
        >
            <div className="flex flex-col items-center min-h-[500px] w-full bg-slate-100 p-4 rounded-lg overflow-y-auto">
                <PurchaseOrderTemplate
                    order={po}
                    items={po.items || []}
                    signatures={signatures}
                    balance={balance}
                    compact={false}
                    className="shadow-md"
                />
            </div>

            <div className="flex justify-end pt-4 gap-2">
                <Button onClick={onClose} variant="outline" className="font-bold px-8">
                    Close View
                </Button>
            </div>
        </Modal>
    )
}
