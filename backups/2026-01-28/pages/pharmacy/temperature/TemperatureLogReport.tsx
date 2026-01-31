import React from 'react'
import { getDaysInMonth, format } from 'date-fns'
import { TemperatureReading } from '@/types/pharmacy/temperature'
import { JATA_LOGO_BASE64 } from '../../../constants/logo';

interface TemperatureLogReportProps {
    readings?: TemperatureReading[]
    locationName: string
    month: Date
    minLimit?: number
    maxLimit?: number
}

export const TemperatureLogReport: React.FC<TemperatureLogReportProps> = ({
    readings = [],
    locationName,
    month,
    minLimit = 2,
    maxLimit = 8
}) => {
    // Process readings into a daily map
    const dailyReadings = React.useMemo(() => {
        const map: Record<number, {
            am?: TemperatureReading,
            pm?: TemperatureReading
        }> = {}

        if (!Array.isArray(readings)) return map;

        readings.forEach(reading => {
            const date = new Date(reading.recorded_at)
            const day = date.getDate()
            const hour = date.getHours()

            if (!map[day]) map[day] = {}

            if (hour < 12) {
                map[day].am = reading
            } else {
                map[day].pm = reading
            }
        })
        return map
    }, [readings])

    // 1. Determine exact days in this month
    const totalDays = getDaysInMonth(month)
    const days = Array.from({ length: totalDays }, (_, i) => i + 1)

    // 4. Graph Grid Logic
    const ROW_COUNT = 21
    // Calculate top of range based on maxLimit + buffer
    const startTemp = Math.ceil((maxLimit || 8) + 8)
    const endTemp = startTemp - ROW_COUNT + 1

    const tempRows = []
    for (let t = startTemp; t >= endTemp; t--) {
        tempRows.push(t)
    }



    // SVG Path Generation Logic
    const getCoordinates = (day: number, isPm: boolean, value: number) => {
        // X Logic:
        // Columns: 31 days * 2 = 62 columns.
        // Index: (day - 1) * 2 + (isPm ? 1 : 0)
        // Center of column: index + 0.5
        const colIndex = (day - 1) * 2 + (isPm ? 1 : 0)
        const x = colIndex + 0.5

        // Y Logic:
        const roundedVal = Math.round(value)
        const rowIndex = startTemp - roundedVal
        const y = rowIndex + 0.5

        return { x, y }
    }

    const pointsMax: string[] = []
    const pointsMin: string[] = []
    const pointsCurr: string[] = []

    // Store dots for SVG rendering
    interface PlotDot {
        x: number
        y: number
        color: string
        type: 'max' | 'min' | 'curr'
        value: number
    }
    const svgDots: PlotDot[] = []

    // Sort valid readings by time to ensure lines connect chronologically
    const sortedDays = days.sort((a, b) => a - b)

    sortedDays.forEach(day => {
        const slots = [
            { isPm: false, data: dailyReadings[day]?.am },
            { isPm: true, data: dailyReadings[day]?.pm }
        ]

        slots.forEach(slot => {
            if (slot.data) {
                // Max
                if (slot.data.max_reading !== undefined) {
                    const { x, y } = getCoordinates(day, slot.isPm, slot.data.max_reading)
                    pointsMax.push(`${x},${y}`)
                    svgDots.push({ x, y, color: '#dc2626', type: 'max', value: slot.data.max_reading })
                }
                // Min
                if (slot.data.min_reading !== undefined) {
                    const { x, y } = getCoordinates(day, slot.isPm, slot.data.min_reading)
                    pointsMin.push(`${x},${y}`)
                    svgDots.push({ x, y, color: '#16a34a', type: 'min', value: slot.data.min_reading })
                }
                // Current
                if (slot.data.current_temp !== undefined) {
                    const { x, y } = getCoordinates(day, slot.isPm, slot.data.current_temp)
                    pointsCurr.push(`${x},${y}`)
                    svgDots.push({ x, y, color: '#2563eb', type: 'curr', value: slot.data.current_temp })
                }
            }
        })
    })

    // Layout Constants
    const ROW_HEIGHT = 13.5 // px
    const HEADER_HEIGHT = 20 // px
    const TOTAL_HEADER_HEIGHT = HEADER_HEIGHT * 2 // px
    const COL_TEMP_WIDTH = 45 // px

    return (
        <div className="p-4">
            <style>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 5mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        visibility: hidden;
                    }
                    .print-container {
                        visibility: visible;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        display: block !important;
                        background: white;
                    }
                }

                @media screen {
                    .print-container {
                        display: none;
                    }
                }
                
                .graph-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    font-size: 7.5pt;
                    table-layout: fixed;
                }
                .graph-table th, .graph-table td {
                    border: 1px solid #334155; 
                    padding: 0;
                    text-align: center;
                    vertical-align: middle;
                    overflow: hidden; 
                    white-space: nowrap; 
                }
                /* Enforce strict heights */
                .graph-table th {
                    height: ${HEADER_HEIGHT}px;
                }
                .graph-table td {
                    height: ${ROW_HEIGHT}px;
                }
                
                /* Target Range Highlight */
                .range-highlight {
                    background-color: #ecfdf5; /* Emerald-50 */
                }

                .header-cell {
                    background-color: #f1f5f9; /* Slate-100 */
                    font-weight: 700;
                    color: #0f172a; /* Slate-900 */
                }
                
                .col-temp { width: ${COL_TEMP_WIDTH}px; }

                .graph-overlay-container {
                    position: relative;
                }
            `}</style>

            <div className="print-container h-full flex flex-col bg-white">
                {/* Header - Modern Standard */}
                <div className="flex items-center justify-between mb-1 border-b-2 border-slate-900 pb-1">
                    <div className="flex items-center gap-3">
                        <img src={JATA_LOGO_BASE64} alt="Jata Negara" className="h-12 w-auto drop-shadow-sm" />
                        <div>
                            <h1 className="text-lg font-bold uppercase tracking-wide text-slate-900 leading-tight">Kementerian Kesihatan Malaysia</h1>
                            <h2 className="text-base font-bold uppercase text-slate-700 leading-tight">Hospital Lawas</h2>
                        </div>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs font-bold uppercase text-slate-900 border px-3 py-1 border-slate-900 bg-slate-50">
                            Rekod Pemantauan Suhu Peti Sejuk Farmasi
                        </h3>
                    </div>
                </div>

                {/* Metadata - Clean Grid */}
                <div className="grid grid-cols-2 gap-x-12 text-[9px] mb-1 font-medium uppercase text-slate-700 bg-slate-50 p-1.5 border border-slate-200">
                    <div className="space-y-0.5">
                        <div className="flex justify-between border-b border-slate-200">
                            <span>Lokasi:</span>
                            <span className="font-bold text-slate-900">{locationName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200">
                            <span>Bulan/Tahun:</span>
                            <span className="font-bold text-slate-900">{format(month, 'MMMM yyyy')}</span>
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex justify-between border-b border-slate-200">
                            <span>No. Siri Peti Sejuk:</span>
                            <span className="font-bold text-slate-900">________________________</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200">
                            <span>Julat Suhu:</span>
                            <span className="font-bold text-slate-900">{minLimit}°C - {maxLimit}°C</span>
                        </div>
                    </div>
                </div>

                {/* Graph Table */}
                <div className="flex-grow graph-overlay-container">
                    <table className="graph-table">
                        <thead>
                            <tr className="bg-slate-100">
                                <th rowSpan={2} className="header-cell col-temp border-slate-900">SUHU (°C)</th>
                                {days.map(day => (
                                    <th key={day} colSpan={2} className="header-cell">{day}</th>
                                ))}
                            </tr>
                            <tr className="bg-slate-50">
                                {days.map(day => (
                                    <React.Fragment key={day}>
                                        <th className="header-cell text-[6pt] text-slate-500 font-normal">AM</th>
                                        <th className="header-cell text-[6pt] text-slate-500 font-normal">PM</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* SVG Anchor Row: Zero height, strictly for positioning the overlay relative to tbody start */}
                            <tr style={{ height: 0 }}>
                                <td colSpan={1 + (totalDays * 2)} style={{ height: 0, padding: 0, border: 0, overflow: 'visible' }}>
                                    <div style={{ position: 'relative', width: '100%', height: 0, overflow: 'visible' }}>
                                        <svg
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: `${COL_TEMP_WIDTH}px`,
                                                width: `calc(100% - ${COL_TEMP_WIDTH}px)`,
                                                height: `${ROW_COUNT * ROW_HEIGHT}px`,
                                                pointerEvents: 'none',
                                                zIndex: 5
                                            }}
                                            viewBox={`0 0 ${totalDays * 2} ${ROW_COUNT}`}
                                            preserveAspectRatio="none"
                                        >
                                            {/* Max Line (Red) */}
                                            {pointsMax.length > 1 && (
                                                <polyline
                                                    points={pointsMax.join(' ')}
                                                    fill="none"
                                                    stroke="#dc2626"
                                                    strokeWidth="0.12"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeDasharray="0.3"
                                                />
                                            )}
                                            {/* Min Line (Green) */}
                                            {pointsMin.length > 1 && (
                                                <polyline
                                                    points={pointsMin.join(' ')}
                                                    fill="none"
                                                    stroke="#16a34a"
                                                    strokeWidth="0.12"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeDasharray="0.3"
                                                />
                                            )}
                                            {/* Current Line (Blue) */}
                                            {pointsCurr.length > 1 && (
                                                <polyline
                                                    points={pointsCurr.join(' ')}
                                                    fill="none"
                                                    stroke="#2563eb"
                                                    strokeWidth="0.12"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeDasharray="0.3"
                                                />
                                            )}

                                            {/* Dots Layer - Rendered in SVG for perfect alignment */}
                                            {svgDots.map((dot, i) => (
                                                <circle
                                                    key={i}
                                                    cx={dot.x}
                                                    cy={dot.y}
                                                    r={0.25}
                                                    fill={dot.color}
                                                >
                                                    <title>{dot.type.toUpperCase()}: {dot.value}°C</title>
                                                </circle>
                                            ))}
                                        </svg>
                                    </div>
                                </td>
                            </tr>

                            {tempRows.map(temp => {
                                const isTargetRange = temp >= minLimit && temp <= maxLimit;
                                return (
                                    <tr key={temp} className={isTargetRange ? 'range-highlight' : ''}>
                                        <td className="header-cell font-bold text-slate-700">{temp}</td>
                                        {days.map(day => (
                                            <React.Fragment key={day}>
                                                <td className="p-0"></td>
                                                <td className="p-0"></td>
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer and Signatures */}
                <div className="mt-2">
                    {/* Legend */}
                    <div className="flex border border-slate-900 bg-slate-50 p-1.5 mb-1 text-[8px]">
                        <div className="w-1/3">
                            <p className="font-bold mb-1 border-b border-slate-300 pb-0.5">Petunjuk</p>
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-600 rounded-full" />
                                    <span>Maksima (Merah)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                                    <span>Minima (Hijau)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                    <span>Semasa (Biru)</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 border-l border-slate-300 pl-3">
                            <p className="font-bold mb-1 border-b border-slate-300 pb-0.5">Arahan & Jadual</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="font-bold">Isnin - Jumaat:</p>
                                    <p>08:00 AM & 05:00 PM</p>
                                </div>
                                <div>
                                    <p className="font-bold">Hujung Minggu:</p>
                                    <p>08:00 AM & 12:00 PM</p>
                                </div>
                                <div className="col-span-2 mt-1 text-red-600 italic font-medium text-right">
                                    *Sila lapor segera kepada Ketua Unit jika suhu di luar julat standard.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-8 mt-1 border border-slate-900 bg-slate-50 p-1.5">
                        <div className="text-center">
                            <p className="font-bold mb-4 text-[8px] tracking-widest">DISEMAK OLEH:</p>
                            <div className="border-b border-black w-3/4 mx-auto"></div>
                        </div>
                        <div className="text-center">
                            <p className="font-bold mb-4 text-[8px] tracking-widest">DISAHKAN OLEH:</p>
                            <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
                            <p className="text-[7px] text-slate-500">(Ketua Unit)</p>
                        </div>
                    </div>

                    {/* System Footer */}
                    <div className="mt-1 text-center text-[7px] text-slate-400 italic">
                        Temperature Management created by Hospital Operation and Management Ecosystem
                    </div>
                </div>
            </div>
        </div>
    )
}
