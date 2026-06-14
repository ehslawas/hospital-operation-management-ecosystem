import { format } from 'date-fns'

interface ReminderLetterTemplateProps {
    poNumber: string
    lpoNumber: string
    lpoDate: string
    supplierName: string
    supplierAddress?: string
    items: any[]
    reminderCount: number
}

/**
 * A Formal Reminder Letter Template (Malaysian Government Standard).
 * Optimized for Standard A4 (210mm x 297mm) Fit:
 * 1. Zero internal padding (controlled by generator/parent) to fix scaling.
 * 2. Tightened vertical spacing to ensure single-page fit.
 * 3. Correct Signature: Tan Yuan Zhang.
 * 4. Resolves character overlapping.
 */
export const ReminderLetterTemplate = ({
    poNumber,
    lpoNumber,
    lpoDate,
    supplierName,
    supplierAddress,
    items,
    reminderCount
}: ReminderLetterTemplateProps) => {
    const today = new Date()

    return (
        <div
            id="reminder-letter"
            style={{
                backgroundColor: 'white',
                padding: '0',
                width: '100%',
                maxWidth: '794px', // A4 Width
                margin: '0 auto',
                color: '#1f2937', // Slate-800
                fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: '10pt',
                lineHeight: '1.5',
                boxSizing: 'border-box',
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
            }}
        >
            {/* 1. Header with Logo */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '30px' }}>
                <img
                    src="/jata-logo.png"
                    alt="Jata Negara"
                    style={{ height: '75px', width: 'auto', marginRight: '20px' }}
                />
                <div>
                    <div style={{ fontSize: '14pt', fontWeight: '800', lineHeight: '1.2', color: '#0f172a', letterSpacing: '-0.5px' }}>JABATAN KESIHATAN NEGERI SARAWAK</div>
                    <div style={{ fontSize: '13pt', fontWeight: '700', lineHeight: '1.2', color: '#334155' }}>HOSPITAL LAWAS</div>
                    <div style={{ fontSize: '9pt', color: '#64748b', marginTop: '4px' }}>
                        Jalan Hospital, 98850 Lawas, Sarawak • Tel: 085-283781
                    </div>
                </div>
            </div>

            {/* 2. Meta Info (Ref & Date) - Professional Grid */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '35px' }}>
                {/* Supplier Address */}
                <div style={{ width: '55%' }}>
                    <div style={{ fontSize: '9pt', fontWeight: '600', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TO:</div>
                    <div style={{ fontWeight: '700', fontSize: '11pt', color: '#0f172a' }}>PENGARAH URUSAN</div>
                    <div style={{ fontWeight: '700', fontSize: '11pt', color: '#0f172a', marginBottom: '4px' }}>{supplierName.toUpperCase()}</div>
                    {supplierAddress && (
                        <div style={{ fontSize: '10pt', color: '#475569', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                            {supplierAddress.toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Reference Right Block */}
                <div style={{ width: '40%', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                        <tbody>
                            <tr>
                                <td style={{ color: '#64748b', fontWeight: '600', paddingBottom: '6px' }}>Our Ref</td>
                                <td style={{ fontWeight: '700', textAlign: 'right', color: '#0f172a', paddingBottom: '6px' }}>{lpoNumber}/REM-{reminderCount}</td>
                            </tr>
                            <tr>
                                <td style={{ color: '#64748b', fontWeight: '600' }}>Date</td>
                                <td style={{ fontWeight: '700', textAlign: 'right', color: '#0f172a' }}>{format(today, 'dd MMMM yyyy')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. Title */}
            <div style={{ marginBottom: '25px' }}>
                <h1 style={{
                    fontSize: '14pt',
                    fontWeight: '800',
                    color: '#dc2626', // Red-600 for urgency
                    marginBottom: '10px',
                    letterSpacing: '-0.2px',
                    textDecoration: 'none'
                }}>
                    REMINDER {reminderCount}: NOTICE OF LATE DELIVERY
                </h1>
                <p style={{ fontSize: '10pt', color: '#334155', textAlign: 'justify' }}>
                    Tuan/Puan,<br /><br />
                    Perkara di atas adalah dirujuk. Pihak hospital mendapati bahawa bekalan bagi <strong>Pesanan Tempatan (LPO) {lpoNumber}</strong> masih belum diterima dan telah melebihi tarikh jangkaan penghantaran.
                </p>
            </div>

            {/* 4. Order Information Box */}
            <div style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '15px', marginBottom: '25px', borderRadius: '0 4px 4px 0' }}>
                <table style={{ width: '100%', fontSize: '10pt' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '150px', color: '#64748b', fontWeight: '600' }}>LPO Number</td>
                            <td style={{ fontWeight: '700', color: '#0f172a' }}>: {lpoNumber}</td>
                        </tr>
                        <tr>
                            <td style={{ color: '#64748b', fontWeight: '600' }}>Order Date</td>
                            <td style={{ fontWeight: '700', color: '#0f172a' }}>: {format(new Date(lpoDate), 'dd/MM/yyyy')}</td>
                        </tr>
                        <tr>
                            <td style={{ color: '#64748b', fontWeight: '600' }}>PO Number</td>
                            <td style={{ fontWeight: '700', color: '#0f172a' }}>: {poNumber}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* 5. Items Table */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ fontSize: '10pt', fontWeight: '700', color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Senarai Item Belum Diterima
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1e293b', color: 'white' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'center', width: '40px', borderRadius: '4px 0 0 4px' }}>#</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', width: '100px' }}>Item Code</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left' }}>Item Name</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center', width: '80px' }}>Qty (Unit)</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center', width: '100px' }}>ETA Date</th>
                            <th style={{ padding: '8px 12px', textAlign: 'center', width: '80px', borderRadius: '0 4px 4px 0' }}>Overdue</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>{index + 1}</td>
                                <td style={{ padding: '10px 12px', fontWeight: '600', color: '#334155' }}>{item.code}</td>
                                <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>{item.name}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700' }}>{item.quantity}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                                    {format(new Date(item.expectedDate), 'dd/MM/yyyy')}
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                    <span style={{
                                        backgroundColor: '#fee2e2',
                                        color: '#ef4444',
                                        padding: '2px 8px',
                                        borderRadius: '999px',
                                        fontWeight: '700',
                                        fontSize: '8pt'
                                    }}>
                                        +{item.daysOverdue} Days
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 6. Footer Content */}
            <div style={{ marginBottom: '40px' }}>
                <p style={{ marginBottom: '10px' }}>
                    2. Sehubungan itu, sila maklumkan pihak kami mengenai <strong>Tarikh Jangkaan Tiba (ETA)</strong> bagi item-item di atas selewat-lewatnya dalam tempoh <strong>3 hari bekerja</strong> dari tarikh surat ini.
                </p>
                <p style={{ marginBottom: '10px' }}>
                    3. Pihak kami amat menghargai sekiranya pihak tuan/puan dapat memberikan perhatian segera berhubung perkara ini.
                </p>
                <p>
                    Kerjasama pihak tuan/puan didahului dengan ucapan terima kasih.
                </p>
            </div>

            {/* 7. Signature */}
            <div style={{ pageBreakInside: 'avoid' }}>
                <div style={{ fontWeight: '800', fontSize: '10pt', color: '#0f172a', marginBottom: '4px' }}>"MALAYSIA MADANI"</div>
                <div style={{ fontWeight: '800', fontSize: '10pt', color: '#0f172a', marginBottom: '30px' }}>"BERKHIDMAT UNTUK NEGARA"</div>

                <div style={{ marginBottom: '5px', color: '#334155' }}>Saya yang menjalankan amanah,</div>

                <div style={{ marginTop: '50px' }}>
                    <div style={{ fontWeight: '700', fontSize: '11pt', color: '#0f172a', textTransform: 'uppercase' }}>( TAN YUAN ZHANG )</div>
                    <div style={{ fontSize: '10pt', color: '#475569' }}>Pegawai Farmasi UF 12</div>
                    <div style={{ fontSize: '10pt', color: '#475569' }}>Farmasi Logistik Hospital Lawas</div>
                </div>
            </div>
        </div>
    )
}

