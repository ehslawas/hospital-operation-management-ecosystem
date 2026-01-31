import React from 'react'
import { JATA_LOGO_BASE64 } from '@/constants/logo'
import { PurchaseOrderWithRelations, PurchaseOrderItem, ContractWithRelations } from '@/types/pharmacy'
import { PharmacyPOSignatures } from '@/services/pharmacy/pharmacySettingsService'

// Helper functions
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

const formatDateMalay = (dateString: string | undefined | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const months = ['JANUARI', 'FEBRUARI', 'MAC', 'APRIL', 'MEI', 'JUN', 'JULAI', 'OGOS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DISEMBER']
    const day = String(date.getDate()).padStart(2, '0')
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year} `
}

const formatPosition = (position: string) => {
    if (!position) return ''

    // Format position text to match Malaysian government document standards
    let formatted = position.trim().toUpperCase()

    // Step 1: Normalize all whitespace to single spaces
    formatted = formatted.replace(/\s+/g, ' ')

    // Step 2: Fix grade codes - remove spaces between grade letters and numbers
    // "U 7" -> "U7", "UF 32" -> "UF32"
    formatted = formatted.replace(/\b(U|UF)\s+(\d+)\b/g, '$1$2')

    // Step 3: Fix TBK codes - remove spaces between TBK and number
    // "TBK 2" -> "TBK2", but keep standalone "TBK" as is
    formatted = formatted.replace(/\bTBK\s+(\d+)\b/g, 'TBK$1')

    // Step 4: Standardize PEN abbreviation with proper spacing
    // "PEN." or "PEN" -> "PEN."
    formatted = formatted.replace(/\bPEN\b\s*\.?\s*/g, 'PEN. ')

    // Step 5: Ensure consistent spacing after periods
    formatted = formatted.replace(/\.\s*([A-Z])/g, '. $1')

    // Step 6: Final cleanup - ensure single spaces between all words
    formatted = formatted.replace(/\s+/g, ' ').trim()

    return formatted
}

interface PurchaseOrderTemplateProps {
    order: PurchaseOrderWithRelations
    items: Array<PurchaseOrderItem & { item_name?: string; item_code?: string; packaging_description?: string }>
    contract?: ContractWithRelations | null
    balance?: number | null
    signatures: PharmacyPOSignatures
    className?: string
    compact?: boolean
}

export const PurchaseOrderTemplate: React.FC<PurchaseOrderTemplateProps> = ({
    order,
    items,
    contract,
    balance,
    signatures,
    className,
    compact = false
}) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0)
    const total = subtotal

    const renderWatermark = () => {
        // Watermark logic from PurchaseOrderDetailPage
        // Note: Page uses a static image watermark, Component previously used text.
        // We will use the logic from the Page which uses image logo.
        return (
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0 overflow-hidden print:opacity-[0.05]">
                <img
                    src={JATA_LOGO_BASE64}
                    alt="Watermark"
                    style={{ width: '450px', height: '450px', objectFit: 'contain' }}
                />
            </div>
        );
    }

    const renderPage1Content = () => (
        <div className={`page bg-white border-2 border-gray-800 shadow-lg relative ${className || ''}`}
            style={{
                fontFamily: "'Times New Roman', serif",
                width: '210mm',
                minHeight: compact ? 'auto' : '297mm',
                maxWidth: '100%',
                margin: '0 auto',
                boxSizing: 'border-box',
                padding: compact ? '20px' : '0 0 270px 0'
            }}>
            {renderWatermark()}
            {/* Government Document Header */}
            <div className="border-b-2 border-gray-800 bg-white py-2 px-8">
                <div className="flex items-center justify-between gap-6 mb-2">
                    <div className="flex-shrink-0">
                        <img
                            src={JATA_LOGO_BASE64}
                            alt="Jata Negara"
                            style={{
                                width: '100px',
                                height: '100px',
                                display: 'block',
                                objectFit: 'contain'
                            }}
                        />
                    </div>

                    <div className="w-1 h-24 bg-gray-800 flex-shrink-0"></div>

                    <div className="flex-1 text-center flex flex-col justify-center py-1" style={{
                        textShadow: 'none',
                        letterSpacing: 'normal',
                    }}>
                        <h1 className="text-xl font-bold text-gray-900 uppercase m-0 p-0 leading-normal" style={{
                            textShadow: 'none',
                            letterSpacing: '0.05em',
                        }}>
                            KEMENTERIAN KESIHATAN
                        </h1>
                        <h2 className="text-lg font-bold text-gray-800 uppercase m-0 p-0 leading-normal" style={{
                            textShadow: 'none',
                            letterSpacing: '0.03em',
                        }}>
                            MINISTRY OF HEALTH
                        </h2>
                        <h2 className="text-lg font-bold text-gray-800 uppercase m-0 p-0 leading-normal" style={{
                            textShadow: 'none',
                            letterSpacing: '0.03em',
                        }}>
                            MALAYSIA
                        </h2>
                        <p className="text-sm font-semibold text-gray-700 m-0 p-0 leading-normal mt-3">
                            Hospital Daerah Lawas
                        </p>
                    </div>

                    <div className="w-1 h-24 bg-gray-800 flex-shrink-0"></div>
                </div>
                <div className="text-center border-t-2 border-gray-800 pt-2">
                    <h3 className="text-base font-bold text-gray-900 uppercase tracking-wide">
                        Borang Permohonan Untuk Pengeluaran Pesanan Kerajaan
                    </h3>
                    <p className="text-xs font-semibold text-gray-700 mt-0.5 italic">
                        Application Form for Government Purchase Order
                    </p>
                </div>
            </div>

            {/* Document Information Section */}

            <div className="px-8 py-2 border-b-2 border-gray-800">
                <table className="w-full text-left border-collapse" style={{ width: '100%' }}>
                    <tbody>
                        <tr>
                            <td className="w-1/2 align-top pr-4" style={{ width: '50%', verticalAlign: 'top', paddingRight: '1rem' }}>
                                <div className="space-y-2">
                                    <div className="border-b border-gray-400 pb-1">
                                        <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">No. Pesanan / PO Number</label>
                                        <p className="text-sm font-bold text-gray-900">{order.po_number}</p>
                                    </div>
                                    <div className="border-b border-gray-400 pb-1">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <label className="text-xs font-bold text-gray-600 uppercase block">Kod Undi / Vote Code</label>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-900">{order.vote_code || '—'}</p>
                                    </div>
                                    <div className="border-b border-gray-400 pb-1">
                                        <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Aktiviti Undi / Vote Activity</label>
                                        <p className="text-sm font-semibold text-gray-900">{order.vote_activity || '—'}</p>
                                    </div>
                                    {/* Contract Number if available */}
                                    {order.kkm_contract_number && (
                                        <div className="border-b border-gray-400 pb-1">
                                            <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">No. Kontrak / Contract No.</label>
                                            <p className="text-sm font-bold text-gray-900">{order.kkm_contract_number}</p>
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="w-1/2 align-top pl-4" style={{ width: '50%', verticalAlign: 'top', paddingLeft: '1rem' }}>
                                <div className="space-y-2">
                                    <div className="border-b border-gray-400 pb-1">
                                        <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Jabatan / Department</label>
                                        <p className="text-sm font-semibold text-gray-900 uppercase">{order.department || '—'}</p>
                                    </div>
                                    <div className="border-b border-gray-400 pb-1">
                                        <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Tarikh Pesanan / Order Date</label>
                                        <p className="text-sm font-semibold text-gray-900">{formatDateMalay(order.order_date)}</p>
                                    </div>
                                    <div className="border-b border-gray-400 pb-1">
                                        <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Kategori / Category</label>
                                        <p className="text-sm font-semibold text-gray-900 uppercase">{order.category?.replace('_', ' ') || '—'}</p>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="px-8 py-1 border-b-2 border-gray-800 bg-gray-50">
                <h4 className="text-xs font-bold text-gray-900 uppercase mb-2">Maklumat Pembekal / Supplier Information</h4>
                <div className="grid grid-cols-1 gap-2">
                    <div className="border border-gray-600 p-2 bg-white">
                        <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Nama Syarikat / Company Name</label>
                        {order.po_type === 'sq' && order.sq_suppliers && order.sq_suppliers.length > 0 ? (
                            <div className="space-y-1">
                                {order.sq_suppliers.map((supplierName, idx) => (
                                    <p key={idx} className="text-sm font-semibold text-gray-900 uppercase">{idx + 1}. {supplierName}</p>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm font-semibold text-gray-900 uppercase">{order.supplier?.company_name || order.manual_supplier_name || '—'}</p>
                        )}
                    </div>
                    {order.po_type !== 'sq' && (order.supplier?.address || order.manual_supplier_address) && (
                        <div className="border border-gray-600 p-2 bg-white">
                            <label className="text-xs font-bold text-gray-600 uppercase block mb-0.5">Alamat / Address</label>
                            <p className="text-xs text-gray-900 whitespace-pre-line">{order.supplier?.address || order.manual_supplier_address}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Items Table - Government Document Style */}
            <div className="px-8 py-1 border-b-2 border-gray-800">
                <h4 className="text-xs font-bold text-gray-900 uppercase mb-3">Butir-butir Barang / Items Purchased</h4>

                {items.length === 0 ? (
                    <div className="border-2 border-gray-600 p-8 text-center bg-gray-50">
                        <p className="text-sm font-semibold text-gray-600">Tiada item dijumpai / No items found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border-2 border-gray-800" style={{ fontFamily: "'Times New Roman', serif" }}>
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-800 px-2 py-1 text-xs font-bold text-gray-900 uppercase text-center" style={{ width: '4%' }}>Bil</th>
                                    <th className="border border-gray-800 px-2 py-1 text-xs font-bold text-gray-900 uppercase text-center" style={{ width: '37%' }}>Nama Item / Item Name</th>
                                    <th className="border border-gray-800 px-2 py-1 text-xs font-bold text-gray-900 uppercase text-center" style={{ width: '12%' }}>Kod Item / Item Code</th>
                                    <th className="border border-gray-800 px-2 py-1 text-xs font-bold text-gray-900 uppercase text-center" style={{ width: '9%' }}>Kuantiti / Quantity</th>
                                    <th className="border border-gray-800 px-2 py-1 text-xs font-bold text-gray-900 uppercase text-center" style={{ width: '11%' }}>Harga Unit / Unit Price</th>
                                    <th className="border border-gray-800 px-2 py-1 text-xs font-bold text-gray-900 uppercase text-center" style={{ width: '11%' }}>Jumlah / Total</th>
                                    <th className="border border-gray-800 px-2 py-1 text-xs font-bold text-gray-900 uppercase text-center" style={{ width: '14%' }}>Pembungkusan / Packaging</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="border border-gray-600 px-2 py-1 text-xs text-gray-900 text-center font-semibold">{index + 1}</td>
                                        <td className="border border-gray-600 px-2 py-0.5 text-xs text-gray-900">
                                            <span className="font-bold">{item.item_name || '—'}</span>
                                            {/* SQ Details */}
                                            {order.po_type === 'sq' && (
                                                <div className="mt-1 text-[10px] font-normal leading-tight text-gray-700">
                                                    <div className="font-semibold text-blue-700">INV SQ no : </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="border border-gray-600 px-2 py-1 text-xs text-gray-700 font-mono">{item.item_code || '—'}</td>
                                        <td className="border border-gray-600 px-2 py-1 text-xs text-gray-900 text-center font-semibold">{item.quantity_ordered}</td>
                                        <td className="border border-gray-600 px-2 py-1 text-xs text-gray-900 text-right font-semibold">{formatCurrency(item.unit_price)}</td>
                                        <td className="border border-gray-600 px-2 py-1 text-xs text-gray-900 text-right font-bold">
                                            {formatCurrency(item.quantity_ordered * item.unit_price)}
                                        </td>
                                        <td className="border border-gray-600 px-2 py-1 text-xs text-gray-700">{item.packaging_description || '—'}</td>
                                    </tr>
                                ))}
                                {/* Consolidated Contract Details Row */}
                                {(order.kkm_contract_number || contract?.delivery_period || contract?.end_date) && (
                                    <tr className="bg-white">
                                        <td className="border border-gray-600 px-2 py-1"></td>
                                        <td className="border border-gray-600 px-2 py-1 text-[9px] leading-none text-gray-800 font-serif">
                                            {order.kkm_contract_number && (
                                                <div className="mb-0.5"><span className="font-bold">No. Kontrak:</span> {order.kkm_contract_number}</div>
                                            )}
                                            {contract?.delivery_period && (
                                                <div className="mb-0.5 text-justify"><span className="font-bold">Tempoh Serahan:</span> {contract.delivery_period}</div>
                                            )}
                                            {contract?.end_date && (
                                                <div><span className="font-bold">Tamat Kontrak:</span> {formatDateMalay(contract.end_date)}</div>
                                            )}
                                        </td>
                                        <td className="border border-gray-600 px-2 py-1"></td>
                                        <td className="border border-gray-600 px-2 py-1"></td>
                                        <td className="border border-gray-600 px-2 py-1"></td>
                                        <td className="border border-gray-600 px-2 py-1"></td>
                                        <td className="border border-gray-600 px-2 py-1"></td>
                                    </tr>
                                )}
                                <tr className="bg-gray-200 font-bold border-t-2 border-gray-800">
                                    <td colSpan={5} className="border border-gray-800 px-2 py-2 text-xs text-gray-900 uppercase text-right">
                                        JUMLAH KESELURUHAN / TOTAL AMOUNT:
                                    </td>
                                    <td className="border border-gray-800 px-2 py-2 text-xs text-black text-right">
                                        {formatCurrency(total)}
                                    </td>
                                    <td className="border border-gray-800"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Financial Summary and Signature */}
            <div className="px-8 py-4 bg-white border-t-2 border-gray-800" style={compact ? {} : { position: 'absolute', bottom: '95px', left: 0, width: '100%', height: '175px' }}>
                <div className="flex gap-6 h-full items-end">
                    {/* Left - Signature (no box) */}
                    <div className="w-[55%] flex flex-col justify-end items-center pb-2">
                        <div className="text-center w-full">
                            <div className="border-b-2 border-gray-800 w-[80%] mx-auto mb-2"></div>
                            <p className="text-[11pt] font-bold text-gray-900 mb-1 leading-tight">(Tandatangan)</p>
                            <p className="text-[10pt] font-bold text-gray-800 mb-1 leading-tight">Pegawai Yang Mengesahkan Peruntukan</p>
                            <p className="text-[10pt] font-bold text-gray-800 leading-tight">Pengarah Hospital Lawas</p>
                        </div>
                    </div>
                    {/* Right Box - Financial Summary */}
                    <div className="w-[45%] flex flex-col justify-end">
                        <table className="w-full border-collapse border-2 border-gray-800 bg-white" style={{ fontFamily: "'Times New Roman', serif", tableLayout: 'fixed' }}>
                            <colgroup>
                                <col style={{ width: '60%' }} />
                                <col style={{ width: '40%' }} />
                            </colgroup>
                            <tbody>
                                <tr className="border-b border-gray-800">
                                    <td className="px-2 py-1.5 text-[9.5pt] font-bold uppercase border-r border-gray-800 leading-tight" style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                        BAKI SEBELUM /<br />BALANCE BEFORE:
                                    </td>
                                    <td className="px-2 py-1.5 text-[10.5pt] font-bold text-right" style={{ whiteSpace: 'nowrap' }}>
                                        {balance !== null && balance !== undefined ? formatCurrencyMalay(balance) : '—'}
                                    </td>
                                </tr>
                                <tr className="border-b border-gray-800 bg-gray-50">
                                    <td className="px-2 py-1.5 text-[9.5pt] font-bold uppercase border-r border-gray-800 leading-tight" style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                        JUMLAH KESELURUHAN /<br />TOTAL AMOUNT:
                                    </td>
                                    <td className="px-2 py-1.5 text-[11.5pt] font-black text-right" style={{ whiteSpace: 'nowrap' }}>
                                        {formatCurrencyMalay(total)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-2 py-1.5 text-[9.5pt] font-bold uppercase border-r border-gray-800 leading-tight" style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                        BAKI SELEPAS /<br />BALANCE AFTER:
                                    </td>
                                    <td className="px-2 py-1.5 text-[11.5pt] font-black text-right" style={{ whiteSpace: 'nowrap' }}>
                                        {(!order.vote_code || order.vote_code === '-') && (!order.vote_activity || order.vote_activity === '-') ? formatCurrencyMalay(0) : (balance !== null && balance !== undefined ? formatCurrencyMalay(balance - total) : '—')}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Document Footer */}
            <div className="px-8 py-3 bg-gray-100 border-t-2 border-gray-800" style={compact ? {} : { position: 'absolute', bottom: '30px', left: 0, width: '100%' }}>
                <div className="text-center">
                    <p className="text-xs font-semibold text-gray-700">
                        Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        Dikeluarkan oleh Sistem Pengurusan Operasi Hospital / Issued by Hospital Operation Management System
                    </p>
                </div>
            </div>
        </div >
    );

    const renderPage2Content = () => (
        <div className={`page bg-white border-2 border-gray-800 shadow-lg relative ${className || ''}`}
            style={{
                fontFamily: "'Times New Roman', serif",
                width: '210mm',
                minHeight: compact ? 'auto' : '297mm',
                maxWidth: '100%',
                margin: '0 auto',
                boxSizing: 'border-box',
                padding: compact ? '20px' : '0 0 95px 0'
            }}>
            {renderWatermark()}
            {/* Section 3: Supplier Details */}
            <div className="px-8 pt-24 pb-1 border-b-2 border-gray-800">
                <div className="flex justify-center">
                    <table className="w-full max-w-4xl border-collapse border-2 border-gray-800">
                        <tbody>
                            <tr>
                                <td className="border border-gray-800 px-3 py-1.5 font-bold bg-gray-200 text-sm" style={{ width: '30%', verticalAlign: 'top' }}>Nama Pembekal :</td>
                                <td className="border border-gray-800 px-3 py-1.5 font-bold text-sm uppercase" style={{ lineHeight: '1.3' }}>
                                    {order.po_type === 'sq' && order.sq_suppliers && order.sq_suppliers.length > 0 ? (
                                        order.sq_suppliers.join(', ')
                                    ) : (
                                        <>
                                            {order.supplier?.company_name || order.manual_supplier_name || '—'}
                                            <br />
                                            <span className="font-normal text-xs normal-case">{order.supplier?.address || order.manual_supplier_address || ''}</span>
                                        </>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="border border-gray-800 px-3 py-1.5 font-bold bg-gray-200 text-sm">No. Telefon :</td>
                                <td className="border border-gray-800 px-3 py-1.5 font-bold text-sm">{order.supplier?.phone || '—'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Federal Treasury Registration */}
            <div className="px-8 py-1 border-b-2 border-gray-800">
                <p className="text-sm mb-1" style={{ lineHeight: '1.3' }}>Berdaftar dengan Pejabat Kewangan Persekutuan Sarawak ( Ya / Tidak )</p>
                <div className="border-b border-black min-w-[350px] mb-1 inline-block"></div>
                <p className="text-sm mb-1" style={{ lineHeight: '1.3' }}>No. Rujukan Pendaftaran :</p>
                <div className="border-b border-black min-w-[350px] inline-block"></div>
            </div>

            {/* Section 4: Purchase Order Details */}
            <div className="px-8 py-1 border-b-2 border-gray-800">
                <p className="text-sm font-bold text-gray-900 mb-1" style={{ lineHeight: '1.3' }}>Bersama-sama ini dinyatakan (Penuhkan mana yang sesuai).</p>
                <div className="ml-4 space-y-1">
                    <div className="flex items-baseline">
                        <span className="text-sm w-6">(i)</span>
                        <div className="flex-1 text-sm leading-[1.4]">
                            No. rujukan surat mampu :
                            <span className="border-b border-black min-w-[350px] ml-2 inline-block"></span>
                        </div>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-sm w-6">(ii)</span>
                        <div className="flex-1 text-sm leading-[1.4]">
                            No. rujukan kontrak :
                            <span className="font-bold underline ml-2 decoration-dotted underline-offset-4">{order.kkm_contract_number || '...................................................'}</span>
                        </div>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-sm w-6">(iii)</span>
                        <div className="flex-1 text-sm leading-[1.4]">
                            Salinan surat kelulusan Pejabat Kewangan Persekutuan Bil.:
                            <span className="border-b border-black min-w-[200px] ml-2 inline-block"></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 4 Signature */}
            <div className="px-8 py-1 border-b-2 border-gray-800 bg-gray-50">
                <div className="flex justify-between items-start">
                    <div className="pt-8">
                        <div className="flex gap-2 pl-4">
                            <span className="text-sm font-bold">Tarikh :</span>
                            <span className="text-sm font-bold font-serif">{formatDateMalay(order.order_date)}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="inline-block min-w-[250px] border-b border-dotted border-black mb-1"></div>
                        <p className="text-sm font-bold mb-1" style={{ lineHeight: '1.2' }}>(Tandatangan Pegawai yang Memohon.)</p>
                        <div className="text-left inline-block">
                            <table className="border-collapse">
                                <tbody>
                                    <tr>
                                        <td className="pr-3 text-right pb-2" style={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                                            <span className="text-sm font-bold">Nama :</span>
                                        </td>
                                        <td className="pb-2">
                                            <span className="text-sm font-bold block leading-relaxed">{signatures.applicantName}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="pr-3 text-right" style={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                                            <span className="text-sm font-bold">Jawatan :</span>
                                        </td>
                                        <td>
                                            <span className="text-sm font-bold block leading-relaxed" style={{ maxWidth: '300px' }}>
                                                {formatPosition(signatures.applicantPosition)}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 5: Head of Department Account & Approval */}
            <div className="px-8 py-1 border-b-2 border-gray-800">
                <div className="flex items-start gap-2 mb-1">
                    <span className="text-sm font-bold">5.</span>
                    <p className="text-sm font-bold text-gray-900" style={{ lineHeight: '1.3' }}>Akaun Ketua Bahagian.</p>
                </div>
                <div className="ml-8 mb-2 space-y-1">
                    <div className="flex gap-2">
                        <span className="text-sm">(i)</span>
                        <p className="text-sm" style={{ lineHeight: '1.4' }}>Adalah disahkan pembelian ini telah dimasukan dalam cadangan anggaran Belanjawan tahunan.</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-sm">(ii)</span>
                        <p className="text-sm" style={{ lineHeight: '1.4' }}>Pembelian ini adalah diperlukan.</p>
                    </div>
                </div>

                {/* Head of Department Signature */}
                <div className="flex justify-between items-start mb-2">
                    <div className="pt-4 pl-4">
                        <div className="flex gap-2">
                            <span className="text-sm font-bold">Tarikh :</span>
                            <span className="text-sm font-bold font-serif">{formatDateMalay(order.order_date)}</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="inline-block min-w-[250px] border-b border-dotted border-black mb-1"></div>
                        <p className="text-sm font-bold mb-1" style={{ lineHeight: '1.2' }}>(Tandatangan Ketua Bahagian)</p>
                        <p className="text-sm font-bold uppercase mb-0.5">{signatures.headName}</p>
                        <p className="text-sm font-bold mb-0.5">{formatPosition(signatures.headPosition)}</p>
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

            {/* Section 6: Finance Department Use - UNTUK KEGUNAAN BAHAGIAN KEWANGAN */}
            <div className="px-8 py-2 border-b-2 border-gray-800">
                <p className="text-sm font-bold text-gray-900 text-center uppercase mb-2" style={{ lineHeight: '1.2' }}>
                    UNTUK KEGUNAAN BAHAGIAN KEWANGAN
                </p>

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

                {/* Notes Section - Matches Reference Image 0 */}
                <div className="pt-4 mt-2">
                    <p className="text-sm font-bold mb-2">Catatan :</p>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">No. Rujukan Pesanan Kerajaan:</span>
                        </div>
                        {/* Contract Number Removed from Footer as per request */}
                        <div className="flex gap-2 mt-4">
                            <span className="text-sm font-bold">Tarikh:</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-3 bg-gray-100 border-t-2 border-gray-800" style={compact ? {} : { position: 'absolute', bottom: '30px', left: 0, width: '100%' }}>
                <div className="text-center">
                    <p className="text-xs font-semibold text-gray-700">
                        Dokumen Rasmi Kerajaan Malaysia / Official Government Document of Malaysia
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        Dikeluarkan oleh Sistem Pengurusan Operasi Hospital / Issued by Hospital Operation Management System
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`space-y-8 ${className || ''}`}>
            {renderPage1Content()}
            {renderPage2Content()}
        </div>
    )
}
