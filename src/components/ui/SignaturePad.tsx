import React, { useRef, useEffect, useState } from 'react'

interface SignaturePadProps {
    onSave: (dataUrl: string) => void
    onCancel: () => void
    width?: number
    height?: number
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel, width = 500, height = 200 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
    }, [])

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true)
        draw(e)
    }

    const stopDrawing = () => {
        setIsDrawing(false)
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        ctx?.beginPath() // Reset path
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return

        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        let x, y

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left
            y = e.touches[0].clientY - rect.top
        } else {
            x = e.clientX - rect.left
            y = e.clientY - rect.top
        }

        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x, y)
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    const handleSave = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Trim canvas or check if empty could be added here
        const dataUrl = canvas.toDataURL('image/png')
        onSave(dataUrl)
    }

    return (
        <div className="space-y-4">
            <div className="border-2 border-slate-200 rounded-lg bg-white overflow-hidden touch-none">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="cursor-crosshair w-full h-auto"
                />
            </div>
            <div className="flex justify-end gap-3">
                <button
                    onClick={clearCanvas}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                    Clear
                </button>
                <div className="flex-1" />
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                >
                    Save Signature
                </button>
            </div>
        </div>
    )
}

export default SignaturePad
