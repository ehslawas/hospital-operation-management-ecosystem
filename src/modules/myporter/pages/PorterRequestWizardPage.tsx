// src/modules/myporter/pages/PorterRequestWizardPage.tsx
import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Truck, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Bed, 
  FlaskConical, 
  Droplets, 
  Pill, 
  AirVent, 
  Shield, 
  FileText, 
  Activity,
  MapPin,
  Clock,
  User,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/stores/toastStore'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { createPorterJob } from '../services/porterService'
import type { 
  PorterTaskCategory, 
  PorterUrgency, 
  PatientMobility,
  PorterJobRequest 
} from '@/shared/types/myporter'
import { soundAlert } from '../components/PorterAudioAlert'

export const PorterRequestWizardPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const loggedUser = useAuthStore((state) => state.user)
  const toast = useToast()

  const defaultCategory = (searchParams.get('category') as PorterTaskCategory) || 'patient_transfer'

  const [step, setStep] = useState<number>(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Category & Urgency
  const [category, setCategory] = useState<PorterTaskCategory>(defaultCategory)
  const [subCategory, setSubCategory] = useState<string>('')
  const [urgency, setUrgency] = useState<PorterUrgency>('routine')

  // Step 2: Locations
  const [originDeptName, setOriginDeptName] = useState('Wad Kenanga (Wad 4A)')
  const [originDeptId, setOriginDeptId] = useState('dept-w4a')
  const [originDetails, setOriginDetails] = useState('Katil 04A')
  
  const [destDeptName, setDestDeptName] = useState('Jabatan Radiologi')
  const [destDeptId, setDestDeptId] = useState('dept-rad')
  const [destDetails, setDestDetails] = useState('Bilik CT Scan 1')

  // Step 3: Specifics
  // Patient fields
  const [patientName, setPatientName] = useState('')
  const [patientRn, setPatientRn] = useState('')
  const [patientGender, setPatientGender] = useState<'Lelaki' | 'Perempuan'>('Lelaki')
  const [patientAge, setPatientAge] = useState<number>(45)
  const [mobility, setMobility] = useState<PatientMobility>('wheelchair')
  const [o2Dependent, setO2Dependent] = useState(false)
  const [o2FlowRate, setO2FlowRate] = useState(3)
  const [nurseEscort, setNurseEscort] = useState(false)
  const [isolationPrecaution, setIsolationPrecaution] = useState<'NONE' | 'CONTACT' | 'DROPLET' | 'AIRBORNE'>('NONE')

  // Specimen fields
  const [specimenType, setSpecimenType] = useState('Darah Lengkap (FBC & Renal Profile)')
  const [tubeCount, setTubeCount] = useState(2)
  const [isColdChain, setIsColdChain] = useState(false)
  const [isUrgentAbg, setIsUrgentAbg] = useState(false)

  // Blood bank fields
  const [bloodGroup, setBloodGroup] = useState('O+')
  const [bloodProductType, setBloodProductType] = useState<'PRBC' | 'PLATELET' | 'FFP' | 'CRYOPRECIPITATE' | 'MTP_BOX'>('PRBC')
  const [bloodUnitCount, setBloodUnitCount] = useState(2)

  // Pharmacy fields
  const [isDda, setIsDda] = useState(false)
  const [prescriptionNo, setPrescriptionNo] = useState('')

  // Gas / Equipment fields
  const [cylinderSize, setCylinderSize] = useState<'E' | 'G' | 'J'>('E')
  const [cylinderCount, setCylinderCount] = useState(2)

  // Notes
  const [notes, setNotes] = useState('')
  const categoriesList = [
    { key: 'patient_transfer', title: 'Pemindahan Pesakit', desc: 'Katil, kerusi roda, isolasi, OT & Radiologi', icon: Bed, color: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10' },
    { key: 'lab_specimen', title: 'Spesimen Makmal', desc: 'Sampel darah, urin, ABG, biopsi, cold-chain', icon: FlaskConical, color: 'text-teal-400 border-teal-500/40 bg-teal-500/10' },
    { key: 'blood_bank', title: 'Tabung Darah (Transfusi)', desc: 'PRBC, Platelet, FFP, MTP Emergency Box', icon: Droplets, color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
    { key: 'pharmacy_run', title: 'Ubat-Ubatan & Farmasi', desc: 'Ubat STAT, DDA Dangerous Drugs, TPN & IV', icon: Pill, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
    { key: 'gas_equipment', title: 'Gas Perubatan & Alat', desc: 'Silinder Oksigen (E/G/J), pam, kerusi roda', icon: AirVent, color: 'text-sky-400 border-sky-500/40 bg-sky-500/10' },
    { key: 'mortuary', title: 'Unit Forensik / Jenazah', desc: 'Pemindahan jenazah dengan kereta sorong bertutup', icon: Shield, color: 'text-slate-300 border-slate-500/40 bg-slate-500/10' },
    { key: 'medical_records', title: 'Rekod Perubatan (BHT)', desc: 'Fail pesakit antara Jabatan Rekod & Klinik', icon: FileText, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
    { key: 'cssd_linen', title: 'CSSD, Linen & Sisa', desc: 'Set steril CSSD, linen bersih/kotor & sisa klinikal', icon: Activity, color: 'text-fuchsia-400 border-fuchsia-500/40 bg-fuchsia-500/10' }
  ]

  const hospitalDepartments = [
    { id: 'dept-w4a', name: 'Wad Kenanga (Wad 4A - Aras 4)' },
    { id: 'dept-w5b', name: 'Wad Mawar (Wad 5B - Aras 5)' },
    { id: 'dept-ed', name: 'Jabatan Kecemasan & Trauma (ED - Aras B1)' },
    { id: 'dept-ot', name: 'Dewan Bedah Utama (OT - Aras 3)' },
    { id: 'dept-icu', name: 'Unit Rawatan Rapi (ICU - Aras 3)' },
    { id: 'dept-lab', name: 'Makmal Patologi & Diagnostik (Aras 1)' },
    { id: 'dept-bb', name: 'Tabung Darah (Blood Bank - Aras 2)' },
    { id: 'dept-pharma', name: 'Farmasi Satelit Pesakit Dalam (Aras 2)' },
    { id: 'dept-rad', name: 'Jabatan Radiologi & CT Scan (Aras 1)' },
    { id: 'dept-forensic', name: 'Unit Forensik & Rumah Mayat (Aras B2)' },
    { id: 'dept-cssd', name: 'Unit Pensterilan CSSD (Aras B1)' },
    { id: 'dept-records', name: 'Jabatan Rekod Perubatan (Aras 1)' }
  ]

  const handleSubmitOrder = async () => {
    setLoading(true)
    try {
      let subCatLabel = 'Tugasan Am'
      const found = categoriesList.find(c => c.key === category)
      if (found) subCatLabel = found.title

      const payload: Partial<PorterJobRequest> = {
        category,
        sub_category: subCatLabel,
        urgency,
        origin_department_id: originDeptId,
        origin_department_name: originDeptName,
        origin_location_details: originDetails,
        destination_department_id: destDeptId,
        destination_department_name: destDeptName,
        destination_location_details: destDetails,
        requester_id: loggedUser?.id || 'user-1',
        requester_name: loggedUser?.full_name || 'Jururawat Wad',
        requester_role: loggedUser?.role?.role_code || 'nurse',
        notes
      }

      if (category === 'patient_transfer') {
        payload.patient_data = {
          patient_name: patientName || 'Pesakit Tanpa Nama',
          patient_rn: patientRn || 'RN-PENDING',
          patient_gender: patientGender,
          patient_age: patientAge,
          mobility_type: mobility,
          o2_dependent: o2Dependent,
          o2_flow_rate_lpm: o2FlowRate,
          nurse_escort_required: nurseEscort,
          isolation_precautions: isolationPrecaution
        }
      } else if (category === 'lab_specimen') {
        payload.specimen_data = {
          specimen_type: specimenType,
          tube_count: tubeCount,
          cold_chain_required: isColdChain,
          is_urgent_abg: isUrgentAbg
        }
      } else if (category === 'blood_bank') {
        payload.blood_data = {
          blood_group: bloodGroup,
          product_type: bloodProductType,
          unit_numbers: Array.from({ length: bloodUnitCount }, (_, i) => `UNIT-${i + 1}`)
        }
      } else if (category === 'pharmacy_run') {
        payload.pharmacy_data = {
          prescription_no: prescriptionNo,
          is_dangerous_drug: isDda
        }
      } else if (category === 'gas_equipment') {
        payload.equipment_data = {
          gas_type: 'oxygen',
          cylinder_size: cylinderSize,
          cylinder_count: cylinderCount
        }
      }

      const res = await createPorterJob(payload)
      if (res.data) {
        soundAlert.playSuccessTone()
        toast.success('Pesanan Berjaya Dihantar', `No Rujukan: ${res.data.no_rujukan} sedang disiarkan ke radar PPK.`)
        navigate('/porter/requests/my')
      }
    } catch (err: any) {
      toast.error('Ralat Menghantar Pesanan', err.message || 'Sila semak maklumat yang dimasukkan.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/porter/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-semibold">Kembali ke Dashboard</span>
        </button>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Langkah {step} daripada 4</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
        {/* Wizard Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className={step >= 1 ? 'text-sky-400' : 'text-slate-500'}>1. Kategori & Urgensi</span>
            <span className={step >= 2 ? 'text-sky-400' : 'text-slate-500'}>2. Lokasi Laluan</span>
            <span className={step >= 3 ? 'text-sky-400' : 'text-slate-500'}>3. Butiran Khusus</span>
            <span className={step >= 4 ? 'text-sky-400' : 'text-slate-500'}>4. Semakan & Hantar</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${(step / 4) * 100}%` }}
              className="bg-gradient-to-r from-sky-500 to-blue-600 h-full"
            />
          </div>
        </div>

        {/* STEP 1: Category & Urgency */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white">Pilih Kategori Tugasan</h2>
              <p className="text-xs text-slate-400 mt-1">Sila pilih jenis item atau perkhidmatan yang diperlukan</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoriesList.map((item) => {
                const Icon = item.icon
                const isSelected = category === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCategory(item.key as PorterTaskCategory)}
                    className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/30'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-3 rounded-xl border ${item.color} shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Urgency Selector */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Tahap Keutamaan (SLA Triage)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'routine', label: 'Biasa (Routine)', desc: 'Masa SASARAN < 60 min', color: 'border-slate-700 hover:border-slate-600' },
                  { key: 'urgent', label: 'Segera (Urgent)', desc: 'Masa SASARAN < 30 min', color: 'border-amber-500/40 text-amber-300' },
                  { key: 'stat', label: '⚡ STAT KECEMASAN', desc: 'Masa SASARAN < 15 min', color: 'border-rose-500/60 text-rose-300 bg-rose-500/10' }
                ].map((u) => {
                  const isSel = urgency === u.key
                  return (
                    <button
                      key={u.key}
                      type="button"
                      onClick={() => setUrgency(u.key as PorterUrgency)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isSel
                          ? 'border-sky-500 bg-sky-500/20 ring-2 ring-sky-500/40'
                          : `bg-slate-950/40 ${u.color}`
                      }`}
                    >
                      <p className="text-xs font-black">{u.label}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{u.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Locations */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white">Tetapkan Lokasi Ambil & Hantar</h2>
              <p className="text-xs text-slate-400 mt-1">Pastikan nama wad dan nombor katil/bilik tepat</p>
            </div>

            <div className="space-y-6">
              {/* Origin */}
              <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
                  <MapPin className="w-4 h-4" />
                  <span>Lokasi Ambil (Asal / Pickup)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Jabatan / Wad</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200"
                      value={originDeptName}
                      onChange={(e) => {
                        setOriginDeptName(e.target.value)
                        const found = hospitalDepartments.find(d => d.name === e.target.value)
                        if (found) setOriginDeptId(found.id)
                      }}
                    >
                      {hospitalDepartments.map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Perincian (cth: Katil / Bilik)</label>
                    <Input
                      value={originDetails}
                      onChange={(e) => setOriginDetails(e.target.value)}
                      placeholder="cth: Katil 12B / Kaunter Depan"
                    />
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase">
                  <MapPin className="w-4 h-4" />
                  <span>Lokasi Hantar (Destinasi / Drop-off)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Jabatan / Wad</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200"
                      value={destDeptName}
                      onChange={(e) => {
                        setDestDeptName(e.target.value)
                        const found = hospitalDepartments.find(d => d.name === e.target.value)
                        if (found) setDestDeptId(found.id)
                      }}
                    >
                      {hospitalDepartments.map((d) => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Perincian (cth: Bilik / Kaunter)</label>
                    <Input
                      value={destDetails}
                      onChange={(e) => setDestDetails(e.target.value)}
                      placeholder="cth: Bilik CT Scan 1 / Bilik Ubat"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Specifics by Category */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white">Butiran Khusus Tugas</h2>
              <p className="text-xs text-slate-400 mt-1">Maklumat sokongan untuk kelancaran tugas PPK</p>
            </div>

            {category === 'patient_transfer' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nama Pesakit *</label>
                    <Input
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="cth: Puan Lim Siew Mei"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nombor RN Pesakit *</label>
                    <Input
                      value={patientRn}
                      onChange={(e) => setPatientRn(e.target.value)}
                      placeholder="cth: RN-2026-99214"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Mod Pengangkutan</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200"
                      value={mobility}
                      onChange={(e) => setMobility(e.target.value as PatientMobility)}
                    >
                      <option value="bed">Katil Wad (Bed Transfer)</option>
                      <option value="wheelchair">Kerusi Roda (Wheelchair)</option>
                      <option value="stretcher">Stretcher / Usungan</option>
                      <option value="walking">Berjalan Kaki (Walking)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Oksigen Mudah Alih?</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200"
                      value={o2Dependent ? 'yes' : 'no'}
                      onChange={(e) => setO2Dependent(e.target.value === 'yes')}
                    >
                      <option value="no">Tiada Oksigen</option>
                      <option value="yes">Perlu Oksigen (E-Cylinder)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Pengiring Jururawat</label>
                    <select
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200"
                      value={nurseEscort ? 'yes' : 'no'}
                      onChange={(e) => setNurseEscort(e.target.value === 'yes')}
                    >
                      <option value="no">Tiada Pengiring</option>
                      <option value="yes">Diiringi Jururawat</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {category === 'lab_specimen' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Jenis Spesimen</label>
                  <Input
                    value={specimenType}
                    onChange={(e) => setSpecimenType(e.target.value)}
                    placeholder="cth: ABG / Darah / Urin"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Bilangan Tiub / Bekas</label>
                  <Input
                    type="number"
                    value={tubeCount}
                    onChange={(e) => setTubeCount(Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            {category === 'blood_bank' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Kumpulan Darah</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    <option value="O+">O Positif</option>
                    <option value="A+">A Positif</option>
                    <option value="B+">B Positif</option>
                    <option value="AB+">AB Positif</option>
                    <option value="O-">O Negatif</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Jenis Produk</label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200"
                    value={bloodProductType}
                    onChange={(e) => setBloodProductType(e.target.value as any)}
                  >
                    <option value="PRBC">Packed Red Cells (PRBC)</option>
                    <option value="PLATELET">Platelet Concentrate</option>
                    <option value="FFP">Fresh Frozen Plasma (FFP)</option>
                    <option value="MTP_BOX">Massive Transfusion (MTP Box)</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">Nota Tambahan untuk PPK</label>
              <textarea
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="cth: Sila bawa bersama tiang titisan IV dan pastikan pesakit berselimut."
              />
            </div>
          </motion.div>
        )}

        {/* STEP 4: Review & Submit */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white">Semakan Pesanan Porter</h2>
              <p className="text-xs text-slate-400 mt-1">Sila semak semula butiran sebelum menyiarkan ke radar</p>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-slate-400">Kategori:</span>
                <span className="font-bold text-white uppercase">{category.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-slate-400">Keutamaan:</span>
                <span className={`font-bold uppercase ${urgency === 'stat' ? 'text-rose-400' : urgency === 'urgent' ? 'text-amber-400' : 'text-slate-200'}`}>
                  {urgency}
                </span>
              </div>
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <span className="text-slate-400">Laluan:</span>
                <span className="font-bold text-right text-slate-200">
                  {originDeptName} ({originDetails})<br />
                  ➔ {destDeptName} ({destDetails})
                </span>
              </div>
              {patientName && (
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-slate-400">Pesakit:</span>
                  <span className="font-bold text-slate-200">{patientName} ({patientRn})</span>
                </div>
              )}
              {notes && (
                <div className="flex justify-between items-start">
                  <span className="text-slate-400">Nota:</span>
                  <span className="text-slate-300 text-right">{notes}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800">
          {step > 1 ? (
            <Button
              variant="outline"
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Sebelumnya</span>
            </Button>
          ) : <div />}

          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep(prev => prev + 1)}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
            >
              <span>Seterusnya</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmitOrder}
              isLoading={loading}
              className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black px-6 shadow-lg shadow-sky-500/25"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span>Hantar Pesanan ke Radar PPK</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PorterRequestWizardPage
