import React, { forwardRef } from 'react'
import { LPOWithRelations } from '@/types/pharmacy/procurementNew'
import { format } from 'date-fns'

interface LpoDocumentTemplateProps {
    lpo: LPOWithRelations
    hospitalName: string
    hospitalAddress: string
}

export const LpoDocumentTemplate = forwardRef<HTMLDivElement, LpoDocumentTemplateProps>(
    ({ lpo, hospitalName, hospitalAddress }, ref) => {
        const po = lpo.purchase_order
        const supplier = po?.supplier

        return (
            <div ref={ref} className="page bg-white p-8 text-black" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', fontSize: '11pt', boxSizing: 'border-box' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-4">
                    {/* Jata Negara Placeholder - In usage, replace with standard img tag using public URL */}
                    <div className="w-24 h-24 bg-gray-200 flex items-center justify-center text-xs">Jata Negara</div>
                    <div className="text-center flex-1">
                        <h1 className="font-bold text-xl uppercase mb-1">Kementerian Kesihatan Malaysia</h1>
                        <h2 className="font-bold text-lg uppercase">{hospitalName}</h2>
                        <p className="text-sm whitespace-pre-wrap">{hospitalAddress}</p>
                    </div>
                    {/* Hospital Logo Placeholder */}
                    <div className="w-24 h-24 bg-gray-200" />
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="font-bold text-2xl underline uppercase tracking-wider">Letter of Purchase Order</h1>
                    <p className="text-sm italic mt-1">(Pesanan Kerajaan)</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                    {/* Left Column: Supplier Info */}
                    <div className="border border-black p-4">
                        <h3 className="font-bold border-b border-black mb-2 pb-1">To: (Supplier)</h3>
                        <p className="font-bold">{supplier?.company_name || 'N/A'}</p>
                        <p>{supplier?.address || 'N/A'}</p>
                        <p>Tel: {supplier?.phone || 'N/A'}</p>
                        <p>Email: {supplier?.email || 'N/A'}</p>
                    </div>

                    {/* Right Column: LPO Details */}
                    <div className="border border-black p-4">
                        <div className="grid grid-cols-3 gap-2 mb-1">
                            <span className="font-bold">LPO No:</span>
                            <span className="col-span-2 font-bold text-lg">{lpo.lpo_number}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-1">
                            <span className="font-bold">Date:</span>
                            <span className="col-span-2">{format(new Date(lpo.document_date), 'dd/MM/yyyy')}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-1">
                            <span className="font-bold">PO Ref:</span>
                            <span className="col-span-2">{po?.po_number}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <span className="font-bold">Contract:</span>
                            <span className="col-span-2">{po?.kkm_contract_number || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse border border-black mb-8 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black p-2 w-12">No.</th>
                            <th className="border border-black p-2 text-left">Item Description</th>
                            <th className="border border-black p-2 w-24">Item Code</th>
                            <th className="border border-black p-2 w-20">UOM</th>
                            <th className="border border-black p-2 w-20">Qty</th>
                            <th className="border border-black p-2 w-32 text-right">Unit Price (RM)</th>
                            <th className="border border-black p-2 w-32 text-right">Total (RM)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {po?.items?.map((item, index) => (
                            <tr key={index}>
                                <td className="border border-black p-2 text-center">{index + 1}</td>
                                <td className="border border-black p-2">
                                    <div className="font-bold">{item.item_name}</div>
                                    <div className="text-xs text-gray-600">{item.packaging_description}</div>
                                </td>
                                <td className="border border-black p-2 text-center">{item.item_code}</td>
                                <td className="border border-black p-2 text-center">-</td>
                                <td className="border border-black p-2 text-center">{item.quantity_ordered}</td>
                                <td className="border border-black p-2 text-right">{item.unit_price.toFixed(2)}</td>
                                <td className="border border-black p-2 text-right">{(item.quantity_ordered * item.unit_price).toFixed(2)}</td>
                            </tr>
                        ))}
                        {/* Total Row */}
                        <tr>
                            <td colSpan={6} className="border border-black p-2 text-right font-bold">Grand Total (RM)</td>
                            <td className="border border-black p-2 text-right font-bold">{po?.total_amount?.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Terms & Conditions */}
                <div className="mb-12 text-xs text-justify">
                    <h4 className="font-bold mb-1 uppercase">Terms & Conditions:</h4>
                    <p>
                        1. This order is subject to the terms and conditions of the Contract.
                        2. Delivery must be made within the specified timeframe (APPL: 10 working days, Contract: as per schedule).
                        3. Detailed Delivery Order (DO) and Invoice must verify this LPO number.
                        4. Late delivery will be subject to Liquidated Ascertained Damages (re-Penalty).
                    </p>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-16 mt-auto">
                    <div className="text-center">
                        <div className="border-b border-black h-24 mb-2"></div>
                        <p className="font-bold">Prepared By</p>
                        <p className="text-xs">(Procurement Officer)</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b border-black h-24 mb-2"></div>
                        <p className="font-bold">Approved By</p>
                        <p className="text-xs">(Head of Pharmacy/Director)</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                    Generated via HOME System on {format(new Date(), 'dd/MM/yyyy HH:mm')} | Page 1 of 1
                </div>
            </div>
        )
    }
)

LpoDocumentTemplate.displayName = 'LpoDocumentTemplate'
