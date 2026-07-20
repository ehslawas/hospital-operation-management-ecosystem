// src/modules/mykunci/pages/KunciPolicyPage.tsx
import React, { useState } from 'react'
import { 
  ScrollText, 
  ShieldAlert, 
  FileText, 
  Clipboard, 
  Check, 
  Key, 
  Lock, 
  AlertTriangle,
  ClipboardList
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import { useToast } from '@/stores/toastStore'

export const KunciPolicyPage: React.FC = () => {
  const toast = useToast()
  const [copied, setCopied] = useState(false)
  
  // Incident Report form state
  const [lostKeyNo, setLostKeyNo] = useState('')
  const [lostKeyName, setLostKeyName] = useState('')
  const [lostDate, setLostDate] = useState('')
  const [lostOfficer, setLostOfficer] = useState('')
  const [lostDescription, setLostDescription] = useState('')

  const handleCopyReport = () => {
    const reportText = `
RUJUKAN: KKM/JKNS/LOG-KUNCI/HOSP-1/2026/L-09
TARIKH: ${new Date().toLocaleDateString('ms-MY')}

KEPADA: 
Ketua Unit Keselamatan & Pengarah Hospital
Hospital Operation Management Ecosystem (HOME)

LAPORAN KEHILANGAN ANAK KUNCI JABATAN / PREMIS KKM
--------------------------------------------------

Siri Laporan: L-KUNCI-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}
Tarikh Kejadian: ${lostDate ? new Date(lostDate).toLocaleDateString('ms-MY') : '________'}
Nama Pegawai Melapor: ${lostOfficer || '________________'}
Pegawai Jawatan: Pegawai Penjaga Kunci / Kakitangan Jabatan

1. BUTIRAN KUNCI YANG HILANG:
   - Kod Anak Kunci: ${lostKeyNo || 'E.g., KUNCI-PH-LOG-01'}
   - Nama Kunci: ${lostKeyName || 'E.g., Kunci Utama Stor Logistik Farmasi'}

2. PERIHAL KEJADIAN:
   - Keterangan ringkas: ${lostDescription || 'Sila nyatakan kronologi bagaimana anak kunci tersebut boleh hilang dari simpanan/peti kunci...'}

3. TINDAKAN SEGERA YANG DIJALANKAN (SLA POLISI KKM):
   [x] Melaporkan segera kepada Ketua Jabatan & Unit Keselamatan Hospital (dalam 12 jam).
   [ ] Melakukan laporan polis rasmi (SLA 24 jam) - Rujukan Polis No: ________________
   [ ] Menukar mangga pintu / silinder kunci fizikal (mangga lama disytiharkan tidak selamat).
   [ ] Menguji dan menggantikan dengan Kunci Pendua (Duplicate Key) dalam sampul bermeterai.

Pegawai Melapor,

____________________________
(Nama: ${lostOfficer || '________________'} )
Jawatan: _____________________
`
    navigator.clipboard.writeText(reportText)
    setCopied(true)
    toast.success('Deraf laporan kehilangan telah disalin ke papan klip (clipboard)')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ScrollText className="w-7 h-7 text-amber-500" />
          Rujukan Polisi Pengurusan Kunci KKM
        </h1>
        <p className="text-sm text-slate-500">
          Ringkasan garis panduan keselamatan fizikal anak kunci jabatan KKM dan Jabatan Kesihatan Negeri Sarawak
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Policies */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Kawalan Am */}
          <Card className="rounded-xl shadow-soft bg-white border border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                1. Kawalan Am & Tanggungjawab Custodian
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                Mengikut **Buku Panduan Arahan Keselamatan Kerajaan (Bab Keselamatan Fizikal)**, anak kunci dan ibu kunci merupakan aset keselamatan kerajaan berisiko tinggi.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Buku Daftar Kunci</strong>: Setiap jabatan wajib mengekalkan daftar induk bagi mencatatkan nama kunci, nombor siri, dan senarai pemegang kunci yang sah.
                </li>
                <li>
                  <strong>Larangan Membawa Balik</strong>: Kakitangan dilarang sama sekali membawa balik kunci premis KKM ke rumah. Semua kunci hendaklah diserahkan semula ke Peti Kunci Utama sebelum pulang.
                </li>
                <li>
                  <strong>Larangan Duplikasi Sendiri</strong>: Penduaan kunci tanpa kebenaran bertulis daripada Pengarah Hospital adalah satu <strong>Kesalahan Tatatertib Serius</strong>.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Card 2: Narcotic DDA Storage */}
          <Card className="rounded-xl shadow-soft bg-white border border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-500" />
                2. Peti Dadah Kawalan (Dangerous Drugs Act / DDA Cabinet)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                Kunci peti dadah kawalan (DDA) dan racun terkawal Kategori A mempunyai syarat kawalan keselamatan tambahan:
              </p>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3 text-xs text-rose-800">
                <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Polisi Double-Custody (Dua Pegawai):</strong>
                  <ul className="list-disc pl-4 mt-1.5 space-y-1.5 leading-relaxed">
                    <li>Peminjaman kunci peti DDA mestilah dilakukan oleh sekurang-kurangnya dua pegawai berasingan (Peminjam dan Saksi/Pegawai Kedua).</li>
                    <li>Saksi mesti mengesahkan tujuan peminjaman dan menyaksikan pengeluaran ubat kawalan tersebut dari peti besi dadah kawalan.</li>
                    <li>Kedua-dua nama pegawai didaftarkan secara kekal di dalam log transaksi kunci.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Kehilangan Kunci SLA */}
          <Card className="rounded-xl shadow-soft bg-white border border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                3. Alur Kerja & SLA Kehilangan Anak Kunci
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                Sekiranya kunci fizikal hilang atau disyaki hilang, pegawai bertanggungjawab wajib melaksanakan tindakan berikut mengikut SLA:
              </p>
              <div className="relative border-l-2 border-slate-200 pl-4 ml-2 space-y-4 py-2">
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 bg-amber-500 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">1</div>
                  <h4 className="font-bold text-slate-800 text-xs">Lapor Segera (SLA: 12 Jam)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Laporkan secara bertulis kepada Pengarah Hospital dan Unit Keselamatan.</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 bg-amber-500 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">2</div>
                  <h4 className="font-bold text-slate-800 text-xs">Laporan Polis (SLA: 24 Jam)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Pegawai bertanggungjawab wajib membuat laporan polis rasmi dalam tempoh 24 jam selepas kehilangan dikesan.</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[21px] top-1 bg-amber-500 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">3</div>
                  <h4 className="font-bold text-slate-800 text-xs">Gantian Silinder / Mangga Pintu</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Bilik/premis tidak dibenarkan dikunci dengan mangga yang sama. Mangga pintu/padlock baharu hendaklah dipasang dengan kadar segera.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Lost Key Template Generator */}
        <div>
          <Card className="rounded-xl shadow-soft bg-white border border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-500" />
                Deraf Laporan Kehilangan Kunci
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Gunakan borang pantas ini untuk menjana draf rasmi Laporan Kehilangan Anak Kunci KKM untuk diserahkan kepada Unit Keselamatan Hospital.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Kod Kunci Hilang *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., KUNCI-PH-LOG-01"
                    value={lostKeyNo}
                    onChange={(e) => setLostKeyNo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nama Kunci *</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Kunci Stor Farmasi A"
                    value={lostKeyName}
                    onChange={(e) => setLostKeyName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Tarikh Kehilangan *</label>
                    <input
                      type="date"
                      required
                      value={lostDate}
                      onChange={(e) => setLostDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Nama Melapor *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nama Anda"
                      value={lostOfficer}
                      onChange={(e) => setLostOfficer(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Sebab / Kronologi Kehilangan *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="E.g., Kunci kali terakhir dikesan berada di atas meja kaunter stor farmasi pada jam 5 petang..."
                    value={lostDescription}
                    onChange={(e) => setLostDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all resize-none"
                  />
                </div>

                <Button
                  onClick={handleCopyReport}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-2.5 font-bold flex items-center justify-center gap-2 text-xs shadow-soft mt-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4" />}
                  {copied ? 'Berjaya Disalin' : 'Jana & Salin Laporan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default KunciPolicyPage
