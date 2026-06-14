import React from 'react';
import QRCode from 'react-qr-code';

interface OxyIdentityCardProps {
    itemName: string;
    itemCode: string;
    serialNumber: string;
    quantity: number;
}

// Volume mapping based on cylinder codes
const VOLUME_MAP: Record<string, string> = {
    'P101D': '0.5m³',
    'P101E': '0.7m³',
    'P101F': '1.4m³',
    'P101HS': '6.4m³',
    '101N': '8.0m³',
};

// Valve type mapping
const getValveType = (cleanCode: string): string => {
    // Explicit markers
    if (cleanCode.includes('BN')) return 'Bullnose';
    if (cleanCode.includes('PI')) return 'Pin Index';

    // Pin Index cylinders (small)
    if (cleanCode.includes('P101D') || cleanCode.includes('P101E') || cleanCode.includes('P101C')) {
        return 'Pin Index';
    }

    // Bullnose cylinders (large)
    if (cleanCode.includes('HS') || cleanCode.includes('101N') || cleanCode.includes('101F') || cleanCode.includes('101G') || cleanCode.includes('101H')) {
        return 'Bullnose';
    }

    return 'Standard';
};

// Get volume from code
const getVolume = (cleanCode: string, rawName: string): string => {
    // First try explicit pattern in raw name: (0.7m3)
    const match = rawName.match(/\(\s*([\d.]+)\s*m3\s*\)/i);
    if (match) return `${match[1]}m³`;

    // Fallback to mapping
    for (const [key, vol] of Object.entries(VOLUME_MAP)) {
        if (cleanCode.includes(key)) return vol;
    }

    // Check for HS anywhere (unique identifier)
    if (cleanCode.includes('HS')) return '6.4m³';

    return 'N/A';
};

export const OxyIdentityCard: React.FC<OxyIdentityCardProps> = ({
    itemName,
    itemCode,
    serialNumber,
}) => {
    // Normalize: Remove ALL non-alphanumeric characters
    const cleanCode = itemName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    // DEBUG: Remove this after confirming
    console.log('[OxyIdentityCard v2]', { itemName, cleanCode });

    // Parse data
    const volume = getVolume(cleanCode, itemName);

    // Split volume into number and unit for styling (e.g. "0.5m³" -> ["0.5", "m³"])
    const volMatch = volume.match(/^([\d.]+)(.*)$/);
    const volNum = volMatch ? volMatch[1] : volume;
    const volUnit = volMatch ? volMatch[2] : '';

    const valveType = getValveType(cleanCode);
    const displayName = itemName.split('(')[0].trim();
    const seqNumber = serialNumber.split('-').pop() || '0001';

    // QR Data payload
    const qrData = {
        id: serialNumber,
        code: itemCode,
        volume: volume,
        valve: valveType,
        name: displayName,
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden w-full max-w-md print:shadow-none print:border-black print:border-[0.5pt] print:rounded-none print:w-[75mm] print:h-[66mm] print:flex print:box-border">
            <div className="flex flex-row h-full min-h-[180px] print:min-h-0 print:w-full">
                {/* LEFT SIDEBAR: Header + QR + Footer */}
                <div className="w-[150px] bg-slate-50 border-r border-slate-200 flex flex-col items-center justify-between p-3 shrink-0 print:w-[35%] print:bg-transparent print:border-black print:border-r-[0.5pt] print:p-1">
                    {/* Header */}
                    <div className="flex flex-col items-center gap-1 w-full text-center print:gap-0.5">
                        <div className="flex items-center gap-1.5 opacity-90">
                            <svg className="w-3.5 h-3.5 text-cyan-600 print:text-black print:w-2 print:h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            </svg>
                            <span className="text-[9px] font-black text-slate-950 uppercase tracking-widest print:text-[5pt]">
                                OXY ID
                            </span>
                        </div>
                        <span className="text-[10px] font-black text-slate-950 px-1.5 py-0.5 rounded border border-slate-200 bg-white print:text-[6pt] print:border-black print:border-[0.5pt] print:px-1 print:py-0">
                            #{seqNumber}
                        </span>
                    </div>

                    {/* QR Code */}
                    <div className="py-2 print:py-1">
                        <QRCode
                            size={100}
                            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                            value={JSON.stringify(qrData)}
                            viewBox="0 0 256 256"
                            level="H"
                            className="print:w-[18mm] print:h-[18mm]"
                        />
                    </div>

                    {/* Footer / Ownership */}
                    <div className="text-center w-full">
                        <p className="text-[10px] font-black text-rose-700 uppercase tracking-tight leading-none mb-0.5 print:text-[6pt] print:text-black print:mb-0">
                            HOSPITAL LAWAS
                        </p>
                        <p className="text-[8px] font-black text-slate-950 uppercase tracking-wider print:text-[4.5pt]">
                            (PRIVATE)
                        </p>
                    </div>
                </div>

                {/* RIGHT CONTENT: Data Details */}
                <div className="flex-1 p-3 flex flex-col justify-center gap-4 print:p-2 print:gap-1">
                    {/* Cylinder Name */}
                    <div className="border-b-2 border-slate-100 pb-2 print:border-black print:border-b-[0.5pt] print:pb-1">
                        <h2 className="text-4xl font-black text-slate-950 leading-none tracking-tighter print:text-[20pt] print:whitespace-nowrap">
                            {displayName}
                        </h2>
                    </div>

                    <div className="space-y-3 print:space-y-1">
                        {/* Valve Type */}
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-950 uppercase tracking-widest print:text-[5pt]">
                                VALVE
                            </span>
                            <span className="text-xs font-black text-slate-950 bg-slate-100 px-2 py-1 rounded border border-slate-200 print:text-[7pt] print:bg-transparent print:border-black print:border-[0.5pt] print:px-1.5 print:py-0.5">
                                {valveType}
                            </span>
                        </div>

                        {/* Volume - MASSIVE */}
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-950 uppercase tracking-widest print:text-[5pt]">
                                VOL
                            </span>
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-6xl font-black text-slate-950 leading-none tracking-tighter print:text-[28pt]">
                                    {volNum}
                                </span>
                                <span className="text-sm font-black text-slate-950 print:text-[8pt]">
                                    {volUnit}
                                </span>
                            </div>
                        </div>

                        {/* Serial ID */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-50 print:border-black print:border-t-[0.5pt]">
                            <span className="text-[9px] font-black text-slate-950 uppercase tracking-widest text-slate-400 print:text-[5pt] print:text-black">
                                SN
                            </span>
                            <span className="text-xs font-mono font-black text-slate-950 print:text-[7pt]">
                                {serialNumber}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OxyIdentityCard;
