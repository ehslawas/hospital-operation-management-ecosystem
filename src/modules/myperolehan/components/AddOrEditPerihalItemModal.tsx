// src/modules/myperolehan/components/AddOrEditPerihalItemModal.tsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Tag, Plus, Edit2, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import {
  createPerihalItem,
  updatePerihalItem,
  getAdminHierarchy
} from '../services/perolehanAdminService'
import type { AdminPerihalItem, AdminProgram, AdminObjek, AdminKategori } from '@/shared/types/myperolehan'
import { Button } from '@/components/ui'

interface AddOrEditPerihalItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  itemToEdit?: AdminPerihalItem | null
}

export const AddOrEditPerihalItemModal: React.FC<AddOrEditPerihalItemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  itemToEdit
}) => {
  const { user } = useAuthStore()
  const toast = useToast()

  const [perihalName, setPerihalName] = useState('')
  const [description, setDescription] = useState('')
  const [programCode, setProgramCode] = useState('022300')
  const [objekCode, setObjekCode] = useState('29000')
  const [kategoriCode, setKategoriCode] = useState('29126')
  const [mealSession, setMealSession] = useState('')
  const [unit, setUnit] = useState('UNIT')
  const [unitPrice, setUnitPrice] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [programs, setPrograms] = useState<AdminProgram[]>([])
  const [objeks, setObjeks] = useState<AdminObjek[]>([])
  const [kategoris, setKategoris] = useState<AdminKategori[]>([])

  useEffect(() => {
    if (!isOpen) return
    const loadHierarchy = async () => {
      const res = await getAdminHierarchy()
      setPrograms(res.programs)
      setObjeks(res.objeks)
      setKategoris(res.kategoris)
    }
    loadHierarchy()
  }, [isOpen])

  useEffect(() => {
    if (itemToEdit) {
      setPerihalName(itemToEdit.perihal_name || '')
      setDescription(itemToEdit.description || '')
      setProgramCode(itemToEdit.program_code || '022300')
      setObjekCode(itemToEdit.objek_code || '29000')
      setKategoriCode(itemToEdit.kategori_code || '29126')
      setMealSession(itemToEdit.meal_session || '')
      setUnit(itemToEdit.unit || 'UNIT')
      setUnitPrice(Number(itemToEdit.unit_price) || 0)
    } else {
      setPerihalName('')
      setDescription('')
      setProgramCode('022300')
      setObjekCode('29000')
      setKategoriCode('29126')
      setMealSession('Makan Tengah Hari')
      setUnit('UNIT')
      setUnitPrice(0)
    }
  }, [itemToEdit, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!perihalName.trim()) {
      toast.error('Sila masukkan nama perihal item.')
      return
    }

    setIsSubmitting(true)
    try {
      if (itemToEdit) {
        const { error } = await updatePerihalItem(itemToEdit.id, {
          perihal_name: perihalName.trim(),
          description: description.trim() || undefined,
          program_code: programCode,
          objek_code: objekCode,
          kategori_code: kategoriCode,
          meal_session: mealSession.trim() || null,
          unit: unit.trim() || 'UNIT',
          unit_price: Number(unitPrice)
        })
        if (error) throw error
        toast.success('Item Katalog Berjaya Dikemaskini!')
      } else {
        const { error } = await createPerihalItem({
          perihal_name: perihalName.trim(),
          description: description.trim() || undefined,
          program_code: programCode,
          objek_code: objekCode,
          kategori_code: kategoriCode,
          meal_session: mealSession.trim() || null,
          unit: unit.trim() || 'UNIT',
          unit_price: Number(unitPrice),
          created_by: user?.id
        })
        if (error) throw error
        toast.success('Item Katalog Baharu Berjaya Ditambah!')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error saving perihal item:', err)
      toast.error('Gagal menyimpan item katalog', err.message || 'Ralat sistem.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 text-slate-900 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              {itemToEdit ? <Edit2 className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {itemToEdit ? 'Kemaskini Item Katalog' : 'Tambah Item Katalog Perihal'}
              </h3>
              <p className="text-xs text-slate-500">
                {itemToEdit ? `ID: ${itemToEdit.id.slice(0, 8)}...` : 'Daftar item perihal & harga kontrak baharu'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Perihal / Nama Item</label>
            <input
              type="text"
              placeholder="cth: Diet Blenderised / Sewaan Mesin / Bacaan Meter"
              value={perihalName}
              onChange={(e) => setPerihalName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none font-semibold"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Keterangan / Spesifikasi</label>
            <textarea
              rows={2}
              placeholder="cth: Sajian diet pemulihan klinikal pesakit..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-600 mb-1 text-[11px]">Program</label>
              <select
                value={programCode}
                onChange={(e) => setProgramCode(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="020200">020200 (Pengurusan)</option>
                <option value="022300">022300 (Dietetik)</option>
                <option value="P42">P42 (Pembangunan)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1 text-[11px]">Kod Objek</label>
              <input
                type="text"
                placeholder="29000 / 24000"
                value={objekCode}
                onChange={(e) => setObjekCode(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1 text-[11px]">Kod Kategori</label>
              <input
                type="text"
                placeholder="29126 / 24202"
                value={kategoriCode}
                onChange={(e) => setKategoriCode(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sesi Makanan / Sesi</label>
              <input
                type="text"
                placeholder="cth: Makan Tengah Hari / Sarapan Pagi / UNIT"
                value={mealSession}
                onChange={(e) => setMealSession(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Harga Kontrak / Unit (RM)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-xl shadow-sm"
            >
              {isSubmitting ? 'Menyimpan...' : itemToEdit ? 'Simpan Perubahan' : 'Tambah Item'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
