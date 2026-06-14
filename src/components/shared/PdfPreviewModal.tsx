import React from 'react'
import { X, Download, FileText, Printer } from 'lucide-react'
import { PDFViewer } from './PDFViewer'

interface PdfPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string | null
  title: string
  fileName: string
}

export function PdfPreviewModal({ isOpen, onClose, pdfUrl, title, fileName }: PdfPreviewModalProps) {
  if (!isOpen || !pdfUrl) return null

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-w-5xl w-full h-[88vh] border border-slate-100 transition-all duration-300 transform scale-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider">{title}</h3>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">{fileName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-600/10"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (PDF Viewport) */}
        <div className="flex-1 bg-slate-150 p-4 relative flex flex-col overflow-hidden">
          <PDFViewer url={pdfUrl} title={fileName} />
        </div>
      </div>
    </div>
  )
}
