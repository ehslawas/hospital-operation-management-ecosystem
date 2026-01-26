import React from 'react'
import { JATA_LOGO_BASE64 } from '@/constants/logo'
import { OxygenReceptionRecordWithRelations } from '@/types/pharmacy'

// Helper functions matching PurchaseOrderTemplate.tsx
const formatDateMalay = (dateStr: string | Date | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    const months = ['JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN', 'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER']
    const day = String(date.getDate()).padStart(2, '0')
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
}

const formatCurrencyMalay = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '—'
    const formatted = new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR',
        minimumFractionDigits: 2,
    }).format(amount)
    return formatted.replace('MYR', 'RM')
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR',
        minimumFractionDigits: 2,
    }).format(amount)
}

const formatPosition = (position: string) => {
    if (!position) return ''
    let formatted = position.trim().toUpperCase()
    formatted = formatted.replace(/\s+/g, ' ')
    formatted = formatted.replace(/\b(U|UF)\s+(\d+)\b/g, '$1$2')
    formatted = formatted.replace(/\bTBK\s+(\d+)\b/g, 'TBK$1')
    formatted = formatted.replace(/\bPEN\b\s*\.?\s*/g, 'PEN. ')
    formatted = formatted.replace(/\.\s*([A-Z])/g, '. $1')
    formatted = formatted.replace(/\s+/g, ' ').trim()
    return formatted
}

interface OxygenPurchaseOrderTemplateProps {
    reception: OxygenReceptionRecordWithRelations
    items: any[]
    cylinderType: string // This will now serve as the Item Name (e.g. "101-N")
    totalAmount: number
    id: string
    className?: string
    signatures?: {
        applicantName: string;
        applicantPosition: string;
        headName: string;
        headPosition: string;
    } | null
    initialBalance?: number // New prop for Warrant Allocation
}

const DEFAULT_SIGNATURES = {
    applicantName: 'AMRI AMIT',
    applicantPosition: 'PENOLONG PEGAWAI FARMASI U5',
    headName: 'TAN YUAN ZHANG',
    headPosition: 'PEGAWAI FARMASI UF 12',
}

export const OxygenPurchaseOrderTemplate: React.FC<OxygenPurchaseOrderTemplateProps> = ({
    reception,
    items,
    cylinderType, // This is the Item Name
    totalAmount,
    id,
    className,
    signatures,
    initialBalance // New prop for Warrant Allocation
}) => {
    const activeSignatures = signatures || DEFAULT_SIGNATURES
    const total = totalAmount
    const balanceBefore = initialBalance
    const balanceAfter = (balanceBefore !== undefined) ? balanceBefore - total : undefined

    // Default supplier for Oxygen
    const supplierName = "LINDE EOX SDN BHD (CAW. MIRI)"
    const supplierAddress = "Lot 1525, Block 3 Piasau Industrial Estate, MCLD 98008 Miri Sarawak Bumi Kenyalang"

    const renderWatermark = () => (
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0 overflow-hidden print:opacity-[0.05]">
            <img
                src={JATA_LOGO_BASE64}
                alt="Watermark"
                style={{ width: '450px', height: '450px', objectFit: 'contain' }}
            />
        </div>
    )

    const renderPageHeader = () => (
        <div className="border-b-2 border-gray-800 bg-white py-2 px-8">
            <div className="flex items-center justify-between gap-6 mb-2">
                <div className="flex-shrink-0">
                    <img src={JATA_LOGO_BASE64} alt="Jata Negara" style={{ width: '100px', height: '100px', display: 'block', objectFit: 'contain' }} />
                </div>
                <div className="w-1 h-24 bg-gray-800 flex-shrink-0"></div>
                <div className="flex-1 text-center flex flex-col justify-center py-1">
                    <h1 className="text-xl font-bold text-gray-900 uppercase m-0 p-0 leading-normal" style={{ letterSpacing: '0.05em' }}>KEMENTERIAN KESIHATAN</h1>
                    <h2 className="text-lg font-bold text-gray-800 uppercase m-0 p-0 leading-normal" style={{ letterSpacing: '0.03em' }}>MINISTRY OF HEALTH</h2>
                    <h2 className="text-lg font-bold text-gray-800 uppercase m-0 p-0 leading-normal" style={{ letterSpacing: '0.03em' }}>MALAYSIA</h2>
                    <p className="text-sm font-semibold text-gray-700 m-0 p-0 leading-normal mt-3">Hospital Lawas</p>
                </div>
                <div className="w-1 h-24 bg-gray-800 flex-shrink-0"></div>
            </div>
            <div className="text-center border-t-2 border-gray-800 pt-2">
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">Borang Permohonan Untuk Pengeluaran Pesanan Kerajaan</h3>
                <p className="text-xs font-semibold text-gray-700 mt-0.5 italic">Application Form for Government Purchase Order</p>
            </div>
        </div>
    )

    const renderPage1Content = () => (
        <div className="page bg-white border-2 border-gray-800 relative"
            style={{
                fontFamily: "'Times New Roman', serif",
                width: '210mm',
                height: '296.5mm',
                margin: '0',
                boxSizing: 'border-box',
                padding: '0'
            }}>
            <div className="flex flex-col justify-between h-full relative" style={{ height: '100%' }}>
                <div className="flex-grow">
                    {renderWatermark()}
                    {renderPageHeader()}

                    <div className="px-8 py-2 border-b-2 border-gray-800">
                        <table className="w-full text-left border-collapse">
                            <tbody>
                                <tr>
                                    <td className="w-1/2 align-top pr-4">
                                        <div className="space-y-2">
                                            <div className="border-b border-gray-400 pb-1">
                                                <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">No. Pesanan / PO Number</label>
                                                <p className="text-sm font-bold text-gray-900">{reception.delivery_order_no || '—'}</p>
                                            </div>
                                            <div className="border-b border-gray-400 pb-1">
                                                <label className="text-xs font-bold text-gray-600 uppercase block">Kod Undi / Vote Code</label>
                                                <p className="text-sm font-semibold text-gray-900">{reception.vote_code || '—'}</p>
                                            </div>
                                            <div className="border-b border-gray-400 pb-1">
                                                <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Aktiviti Undi / Vote Activity</label>
                                                <p className="text-sm font-semibold text-gray-900">{reception.vote_activity || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="w-1/2 align-top pl-4">
                                        <div className="space-y-2">
                                            <div className="border-b border-gray-400 pb-1">
                                                <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Jabatan / Department</label>
                                                <p className="text-sm font-semibold text-gray-900 uppercase">FARMASI / PHARMACY</p>
                                            </div>
                                            <div className="border-b border-gray-400 pb-1">
                                                <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Tarikh Pesanan / Order Date</label>
                                                <p className="text-sm font-semibold text-gray-900">{formatDateMalay(reception.reception_date)}</p>
                                            </div>
                                            <div className="border-b border-gray-400 pb-1">
                                                <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Kategori / Category</label>
                                                <p className="text-sm font-semibold text-gray-900 uppercase">GAS PERUBATAN</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="px-8 py-1 border-b-2 border-gray-800 bg-gray-50">
                        <h4 className="text-xs font-bold text-gray-900 uppercase mb-2">Maklumat Pembekal / Supplier Information</h4>
                        <div className="grid grid-cols-1">
                            <div className="border border-gray-600 p-2 bg-white">
                                <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Nama Syarikat / Company Name</label>
                                <p className="text-sm font-semibold text-gray-900 uppercase">{supplierName}</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-1 border-b-2 border-gray-800">
                        <h4 className="text-xs font-bold text-gray-900 uppercase mb-3">Butir-butir Barang / Items Purchased</h4>
                        <table className="w-full border-collapse border-2 border-gray-800">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-800 px-2 py-1 text-xs font-bold uppercase text-center w-[5%]">Bil</th>
                                    <th className="border border-gray-800 px-2 py-1 text-xs font-bold uppercase text-center w-[45%]">Nama Item</th>
                                    <th className="border border-gray-800 px-2 py-1 text-xs font-bold uppercase text-center w-[15%]">Kuantiti</th>
                                    <th className="border border-gray-800 px-2 py-1 text-xs font-bold uppercase text-center w-[15%]">Harga Unit</th>
                                    <th className="border border-gray-800 px-2 py-1 text-xs font-bold uppercase text-center w-[20%]">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-gray-600 px-2 py-1 text-xs text-center font-semibold">1</td>
                                    <td className="border border-gray-600 px-2 py-1 text-xs font-bold uppercase">{cylinderType}</td>
                                    <td className="border border-gray-600 px-2 py-1 text-xs text-center font-semibold">{items.length} UNIT</td>
                                    <td className="border border-gray-600 px-2 py-1 text-xs text-right font-semibold">{formatCurrency(total / (items.length || 1))}</td>
                                    <td className="border border-gray-600 px-2 py-1 text-xs text-right font-bold">{formatCurrency(total)}</td>
                                </tr>
                                <tr className="bg-gray-200 font-bold border-t-2 border-gray-800">
                                    <td colSpan={4} className="border border-gray-800 px-2 py-2 text-xs uppercase text-right">JUMLAH KESELURUHAN:</td>
                                    <td className="border border-gray-800 px-2 py-2 text-xs text-right">{formatCurrency(total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="px-8 py-4 bg-white border-t-2 border-gray-800">
                        <div className="flex gap-6 items-end">
                            <div className="w-[55%] flex flex-col justify-end items-center pb-2">
                                <div className="border-b-2 border-gray-800 w-[80%] mx-auto mb-2"></div>
                                <p className="text-[11pt] font-bold text-gray-900 mb-1 leading-tight">(Tandatangan)</p>
                                <p className="text-[10pt] font-bold text-gray-800 mb-1 leading-tight">Pegawai Yang Mengesahkan Peruntukan</p>
                                <p className="text-[10pt] font-bold text-gray-800 leading-tight">Pengarah Hospital Lawas</p>
                            </div>
                            <div className="w-[45%] flex flex-col justify-end">
                                <table className="w-full border-collapse border-2 border-gray-800 bg-white" style={{ tableLayout: 'fixed' }}>
                                    <tbody>
                                        <tr className="border-b border-gray-800">
                                            <td className="px-2 py-1.5 text-[9.5pt] font-bold uppercase border-r border-gray-800">BAKI SEBELUM:</td>
                                            <td className="px-2 py-1.5 text-[10.5pt] font-bold text-right">{balanceBefore !== undefined ? formatCurrency(balanceBefore) : '—'}</td>
                                        </tr>
                                        <tr className="border-b border-gray-800 bg-gray-50">
                                            <td className="px-2 py-1.5 text-[9.5pt] font-bold uppercase border-r border-gray-800">JUMLAH KESELURUHAN:</td>
                                            <td className="px-2 py-1.5 text-[11.5pt] font-black text-right">{formatCurrencyMalay(total)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-2 py-1.5 text-[9.5pt] font-bold uppercase border-r border-gray-800">BAKI SELEPAS:</td>
                                            <td className="px-2 py-1.5 text-[11.5pt] font-black text-right">{balanceAfter !== undefined ? formatCurrency(balanceAfter) : '—'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="px-8 py-3 bg-gray-100 border-t-2 border-gray-800 text-center">
                        <p className="text-xs font-semibold text-gray-700">Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia</p>
                        <p className="text-xs text-gray-600 mt-1">Dikeluarkan oleh Sistem Pengurusan Operasi Hospital</p>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderPage2Content = () => (
        <div className="page bg-white border-2 border-gray-800 relative"
            style={{
                fontFamily: "'Times New Roman', serif",
                width: '210mm',
                height: '296.5mm',
                margin: '0',
                boxSizing: 'border-box',
                padding: '0'
            }}>
            <div className="flex flex-col justify-between h-full relative" style={{ height: '100%' }}>
                <div className="flex-grow">
                    {renderWatermark()}


                    <div className="px-8 pt-2 pb-1 border-b-2 border-gray-800">
                        <div className="flex justify-center">
                            <table className="w-full max-w-4xl border-collapse border-2 border-gray-800">
                                <tbody>
                                    <tr>
                                        <td className="border border-gray-800 px-3 py-1.5 font-bold bg-gray-200 text-sm w-[30%]">Nama Pembekal :</td>
                                        <td className="border border-gray-800 px-3 py-1.5 font-bold text-sm uppercase">
                                            {supplierName}<br />
                                            <span className="font-normal text-xs normal-case">{supplierAddress}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-800 px-3 py-1.5 font-bold bg-gray-200 text-sm">No. Telefon :</td>
                                        <td className="border border-gray-800 px-3 py-1.5 font-bold text-sm">—</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="px-8 py-1 border-b-2 border-gray-800">
                        <p className="text-sm mb-1">Berdaftar dengan Pejabat Kewangan Persekutuan Sarawak ( Ya / Tidak )</p>
                        <div className="border-b border-black min-w-[350px] mb-1 inline-block"></div>
                        <p className="text-sm mb-1">No. Rujukan Pendaftaran :</p>
                        <div className="border-b border-black min-w-[350px] inline-block"></div>
                    </div>

                    <div className="px-8 py-1 border-b-2 border-gray-800">
                        <p className="text-sm font-bold text-gray-900 mb-1">Bersama-sama ini dinyatakan (Penuhkan mana yang sesuai).</p>
                        <div className="ml-4 space-y-1">
                            <div className="flex items-baseline"><span className="text-sm w-6">(i)</span><span className="text-sm">No. rujukan surat mampu : _________________</span></div>
                            <div className="flex items-baseline"><span className="text-sm w-6">(ii)</span><span className="text-sm">No. rujukan kontrak : _________________</span></div>
                            <div className="flex items-baseline"><span className="text-sm w-6">(iii)</span><span className="text-sm">Salinan surat kelulusan Pejabat Kewangan : _________________</span></div>
                        </div>
                    </div>

                    <div className="px-8 py-1 border-b-2 border-gray-800 bg-gray-50">
                        <div className="flex justify-between items-start">
                            <div className="pt-2 flex gap-2 pl-4">
                                <span className="text-sm font-bold">Tarikh :</span>
                                <span className="text-sm font-bold">{formatDateMalay(reception.reception_date)}</span>
                            </div>
                            <div className="text-right">
                                <div className="inline-block min-w-[250px] border-b border-dotted border-black mb-1"></div>
                                <p className="text-sm font-bold mb-1">(Tandatangan Pegawai yang Memohon.)</p>
                                <div className="text-left inline-block">
                                    <p className="text-sm font-bold">Nama : {activeSignatures.applicantName}</p>
                                    <p className="text-sm font-bold">Jawatan : {formatPosition(activeSignatures.applicantPosition)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-1 border-b-2 border-gray-800">
                        <p className="text-sm font-bold mb-1">5. Akaun Ketua Bahagian.</p>
                        <div className="ml-8 mb-2 space-y-1">
                            <p className="text-sm">(i) Adalah disahkan pembelian ini telah dimasukan dalam cadangan anggaran Belanjawan tahunan.</p>
                            <p className="text-sm">(ii) Pembelian ini adalah diperlukan.</p>
                        </div>
                        <div className="flex justify-between items-start mb-2">
                            <div className="pt-2 flex gap-2 pl-4">
                                <span className="text-sm font-bold">Tarikh :</span>
                                <span className="text-sm font-bold">{formatDateMalay(reception.reception_date)}</span>
                            </div>
                            <div className="text-center">
                                <div className="inline-block min-w-[250px] border-b border-dotted border-black mb-1"></div>
                                <p className="text-sm font-bold mb-1">(Tandatangan Ketua Bahagian)</p>
                                <p className="text-sm font-bold uppercase">{activeSignatures.headName}</p>
                                <p className="text-sm font-bold">{formatPosition(activeSignatures.headPosition)}</p>
                            </div>
                        </div>

                        {/* Approval Text */}
                        <p className="text-sm font-bold text-center mb-2">Permohonan diluluskan/tidak diluluskan</p>

                        {/* Director Approval Signature */}
                        <div className="flex justify-between items-start">
                            <div className="pt-4 pl-4">
                                <div className="flex gap-2">
                                    <span className="text-sm font-bold">Tarikh :</span>
                                    <span className="inline-block min-w-[150px] border-b border-black"></span>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="inline-block min-w-[250px] border-b border-dotted border-black mb-1"></div>
                                <p className="text-sm font-bold mb-1" style={{ lineHeight: '1.2' }}>(Tandatangan Pegawai Yang Meluluskan)</p>
                                <p className="text-sm font-bold">Pengarah Hospital Daerah, Lawas.</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 py-2 border-b-2 border-gray-800">
                        <p className="text-sm font-bold text-center uppercase mb-2">UNTUK KEGUNAAN BAHAGIAN KEWANGAN</p>
                        <div className="flex justify-between items-end min-h-[60px]">
                            <div className="space-y-1 mb-2">
                                <p className="text-sm font-bold mb-1">6. Kerani Kewangan</p>
                                <div className="ml-8 space-y-1">
                                    <p className="text-sm" style={{ lineHeight: '1.4' }}>(iii) Sila Keluarkan Pesanan Kerajaan</p>
                                    <p className="text-sm" style={{ lineHeight: '1.4' }}>(iv) Sila dapatkan Sebut harga.</p>
                                </div>
                            </div>
                            <div className="text-right mb-2">
                                <div className="inline-block min-w-[250px] border-b border-dotted border-black mb-1"></div>
                                <p className="text-sm font-bold mb-1">(Bahagian Kewangan)</p>
                                <p className="text-sm font-bold">B.P. Pengarah Hospital Daerah, Lawas.</p>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="pt-4 mt-2">
                            <p className="text-sm font-bold mb-2">Catatan :</p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold">No. Rujukan Pesanan Kerajaan:</span>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <span className="text-sm font-bold">Tarikh:</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto">
                    <div className="px-8 py-3 bg-gray-100 border-t-2 border-gray-800 text-center">
                        <p className="text-xs font-semibold text-gray-700">Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia</p>
                        <p className="text-xs text-gray-600 mt-1">Dikeluarkan oleh Sistem Pengurusan Operasi Hospital</p>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div id={id} className={className || ""}>
            {renderPage1Content()}
            {renderPage2Content()}
        </div>
    )
}
