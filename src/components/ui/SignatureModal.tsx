
import React, { useRef, useState, useEffect } from 'react'
import { Dialog, DialogContent, Button } from '@/components/ui'
import { X } from 'lucide-react'

interface SignatureModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: string) => void
    title: string
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onSave, title }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)

    useEffect(() => {
        if (isOpen && canvasRef.current) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            if (ctx) {
                ctx.lineWidth = 2
                ctx.lineCap = 'round'
                ctx.strokeStyle = '#000'
                ctx.clearRect(0, 0, canvas.width, canvas.height)
            }
        }
    }, [isOpen])

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }

        const rect = canvas.getBoundingClientRect()
        let clientX, clientY

        if ('touches' in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = (e as React.MouseEvent).clientX
            clientY = (e as React.MouseEvent).clientY
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        }
    }

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault() // Prevent scrolling on touch
        setIsDrawing(true)
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const { x, y } = getCoordinates(e)
        ctx.beginPath()
        ctx.moveTo(x, y)
    }

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return
        e.preventDefault() // Prevent scrolling on touch
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const { x, y } = getCoordinates(e)
        ctx.lineTo(x, y)
        ctx.stroke()
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const handleSave = () => {
        if (canvasRef.current) {
            onSave(canvasRef.current.toDataURL())
            onClose()
        }
    }

    const handleClear = () => {
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d')
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
    }

    // Additional listeners to smooth out drawing if mouse leaves canvas
    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDrawing(false)
        window.addEventListener('mouseup', handleGlobalMouseUp)
        window.addEventListener('touchend', handleGlobalMouseUp)
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp)
            window.removeEventListener('touchend', handleGlobalMouseUp)
        }
    }, [])

    if (!isOpen) return null

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-2xl">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg">{title}</h3>
                        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
                    </div>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 touch-none">
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={200}
                            className="w-full h-[200px] cursor-crosshair touch-none"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleClear}>Clear</Button>
                        <Button onClick={handleSave} className="bg-slate-900 text-white">Save Signature</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
