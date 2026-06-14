import React, { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { Loader2, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react'

// Set up the PDFJS worker using the CDN that matches the version in package.json
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`

interface PDFViewerProps {
  url: string
  title?: string
}

export function PDFViewer({ url, title }: PDFViewerProps) {
  const [pdf, setPdf] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scale, setScale] = useState(1.5)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    const fetchPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(url)
        const pdfDoc = await loadingTask.promise
        if (isMounted) {
          setPdf(pdfDoc)
          setLoading(false)
        }
      } catch (err: any) {
        console.error('Error loading PDF:', err)
        if (isMounted) {
          setError('Could not load PDF document. Please verify the URL or try downloading.')
          setLoading(false)
        }
      }
    }

    if (url) {
      fetchPdf()
    } else {
      setLoading(false)
      setError('No document URL provided.')
    }

    return () => {
      isMounted = false
    }
  }, [url])

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, prev + 0.25))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.25))
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-xl border border-slate-200/50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Loading document preview...</p>
        <p className="text-xs text-slate-400 mt-1">Rendering high quality pages</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-rose-50/50 rounded-xl border border-rose-200/60 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <p className="text-sm font-bold text-rose-800">{error}</p>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider"
        >
          Open PDF in New Tab
        </a>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-150 rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner">
      {/* Control Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-lg">
            Pages: {pdf?.numPages || 0}
          </span>
          {title && (
            <span className="text-xs font-bold text-slate-400 hidden sm:inline-block uppercase tracking-wider truncate max-w-xs">
              | {title}
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 hover:bg-slate-100 disabled:opacity-40 text-slate-600 disabled:hover:bg-transparent rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4.5 h-4.5" />
          </button>
          <span className="text-xs font-extrabold text-slate-700 min-w-[3.5rem] text-center bg-slate-50 border border-slate-150 py-1 px-2.5 rounded-lg select-none">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 2.5}
            className="p-1.5 hover:bg-slate-100 disabled:opacity-40 text-slate-600 disabled:hover:bg-transparent rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Pages Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6 bg-slate-100/50 flex flex-col items-center gap-8 scroll-smooth"
      >
        {Array.from({ length: pdf?.numPages || 0 }).map((_, index) => (
          <PDFPage key={index + 1} pdf={pdf} pageNum={index + 1} scale={scale} />
        ))}
      </div>
    </div>
  )
}

interface PDFPageProps {
  pdf: any
  pageNum: number
  scale: number
}

function PDFPage({ pdf, pageNum, scale }: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rendering, setRendering] = useState(false)
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)

  // Standard HD multiplier to ensure crystal-clear vector rendering regardless of screen DPI
  const HD_MULTIPLIER = 2.0

  // Single effect to load dimensions and render the page context
  useEffect(() => {
    if (!pdf) return

    let isPageMounted = true
    let renderTask: any = null

    const renderPage = async () => {
      try {
        setRendering(true)
        const page = await pdf.getPage(pageNum)
        if (!isPageMounted) return

        // 1. Calculate logical dimensions for the card aspect ratio
        const logicalViewport = page.getViewport({ scale })
        setDimensions({ width: logicalViewport.width, height: logicalViewport.height })

        // 2. Calculate high-resolution viewport for razor-sharp vector rasterization
        const highResViewport = page.getViewport({ scale: scale * HD_MULTIPLIER })

        const canvas = canvasRef.current
        if (!canvas) return
        
        // 3. Set the canvas physical pixels to match the high-resolution viewport
        canvas.width = highResViewport.width
        canvas.height = highResViewport.height

        const context = canvas.getContext('2d')
        if (!context) return

        const renderContext = {
          canvasContext: context,
          viewport: highResViewport,
        }

        renderTask = page.render(renderContext)
        await renderTask.promise
        
        if (isPageMounted) {
          setRendering(false)
        }
      } catch (err: any) {
        const isCancelled = err?.name === 'RenderingCancelledException' || 
                            err?.message?.includes('cancelled') ||
                            err?.message?.includes('Rendering cancelled')

        if (!isCancelled) {
          console.error(`Error rendering page ${pageNum}:`, err)
        }
      }
    }

    renderPage()

    return () => {
      isPageMounted = false
      if (renderTask) {
        try {
          renderTask.cancel()
        } catch (cancelErr) {
          // Silent catch
        }
      }
    }
  }, [pdf, pageNum, scale])

  const aspectRatio = dimensions ? `${dimensions.width} / ${dimensions.height}` : '1.414 / 1'
  const canvasWidth = dimensions ? dimensions.width * HD_MULTIPLIER : undefined
  const canvasHeight = dimensions ? dimensions.height * HD_MULTIPLIER : undefined

  return (
    <div 
      className="relative bg-white rounded-xl shadow-lg border border-slate-200/85 transition-shadow hover:shadow-xl overflow-hidden shrink-0"
      style={{
        width: dimensions ? `${dimensions.width}px` : '100%',
        maxWidth: '100%',
        aspectRatio: aspectRatio,
      }}
    >
      <canvas 
        ref={canvasRef} 
        width={canvasWidth} 
        height={canvasHeight} 
        className="block w-full h-full rounded-xl" 
        style={{
          aspectRatio: aspectRatio,
        }}
      />
      {(rendering || !dimensions) && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}
      <div className="absolute bottom-4 right-4 px-3 py-1 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase tracking-wider select-none shadow-sm z-10">
        Page {pageNum} of {pdf?.numPages || 0}
      </div>
    </div>
  )
}
