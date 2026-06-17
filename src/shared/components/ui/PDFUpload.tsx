import React, { useCallback, useState, useRef, useEffect } from 'react'
import { PDFDocument } from 'pdf-lib'
import { cn, formatFileSize } from '@/lib/utils'
import { Upload, X, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from './button'
import { PDFViewer } from '../shared/PDFViewer'

export interface PDFUploadProps {
  label?: string
  value?: File | null
  onChange: (file: File | null) => void
  error?: string
  helperText?: string
  previewUrl?: string | null
  className?: string
  extractFirstPageOnly?: boolean // For account documents - extract only first page
  maxSize?: number
}

export const PDFUpload: React.FC<PDFUploadProps> = ({
  label,
  value,
  onChange,
  error: externalError,
  helperText,
  previewUrl: externalPreviewUrl,
  className,
  extractFirstPageOnly = false,
  maxSize = 50 * 1024 * 1024, // 50MB default
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [internalError, setInternalError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(externalPreviewUrl || null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFile, setProcessedFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const error = externalError || internalError

  // Update preview when external preview URL changes
  useEffect(() => {
    if (externalPreviewUrl) {
      setPreviewUrl(externalPreviewUrl)
    }
  }, [externalPreviewUrl])

  // Create preview URL for PDF
  useEffect(() => {
    if (value && !previewUrl) {
      const url = URL.createObjectURL(value)
      setPreviewUrl(url)
    }

    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [value, previewUrl])

  const extractFirstPage = async (file: File): Promise<File> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)
      
      // Get page count
      const pages = pdfDoc.getPages()
      setPageCount(pages.length)

      // If only one page or extractFirstPageOnly is false, return original
      if (!extractFirstPageOnly || pages.length <= 1) {
        return file
      }

      // Create new PDF with only first page
      const newPdfDoc = await PDFDocument.create()
      const [firstPage] = await newPdfDoc.copyPages(pdfDoc, [0])
      newPdfDoc.addPage(firstPage)

      // Convert to blob and create File
      const pdfBytes = await newPdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const newFile = new File([blob], file.name, { type: 'application/pdf' })

      return newFile
    } catch (error) {
      console.error('Error extracting PDF page:', error)
      throw new Error('Failed to process PDF. Please ensure it is a valid PDF file.')
    }
  }

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setInternalError('Only PDF files are allowed')
        return
      }

      // Validate file size
      if (file.size > maxSize) {
        setInternalError(`File size must be less than ${formatFileSize(maxSize)}`)
        return
      }

      setInternalError(null)
      setIsProcessing(true)

      try {
        let finalFile = file

        // Extract first page if needed
        if (extractFirstPageOnly) {
          finalFile = await extractFirstPage(file)
        } else {
          // Still get page count for display
          try {
            const arrayBuffer = await file.arrayBuffer()
            const pdfDoc = await PDFDocument.load(arrayBuffer)
            const pages = pdfDoc.getPages()
            setPageCount(pages.length)
          } catch (e) {
            console.warn('Could not get page count:', e)
          }
        }

        setProcessedFile(finalFile)
        
        // Create preview URL
        const url = URL.createObjectURL(finalFile)
        setPreviewUrl(url)

        onChange(finalFile)
      } catch (error) {
        console.error('Error processing PDF:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to process PDF file'
        setInternalError(errorMessage)
        onChange(null)
      } finally {
        setIsProcessing(false)
      }
    },
    [maxSize, extractFirstPageOnly, onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const file = e.dataTransfer.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleRemove = useCallback(() => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setInternalError(null)
    setProcessedFile(null)
    setPageCount(null)
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [previewUrl, onChange])

  const displayFile = processedFile || value

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {extractFirstPageOnly && (
            <span className="ml-2 text-xs text-amber-600 font-normal">
              (First page only will be extracted)
            </span>
          )}
        </label>
      )}

      {isProcessing ? (
        <div className="border-2 border-dashed border-teal-300 rounded-xl p-8 bg-teal-50 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-700">
            {extractFirstPageOnly ? 'Extracting first page...' : 'Processing PDF...'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Please wait</p>
        </div>
      ) : previewUrl || displayFile ? (
        <div className="space-y-3">
          {/* Preview */}
          <div className="relative group border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 h-[28rem] flex flex-col">
            {previewUrl && <PDFViewer url={previewUrl} />}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-8 h-8 bg-error-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-error-600 transition-colors opacity-0 group-hover:opacity-100 z-20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* File Info */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {displayFile?.name}
                  </p>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span>{formatFileSize(displayFile?.size || 0)}</span>
                  {pageCount !== null && (
                    <span>
                      {extractFirstPageOnly && pageCount > 1
                        ? `1 page (extracted from ${pageCount} pages)`
                        : `${pageCount} page${pageCount !== 1 ? 's' : ''}`}
                    </span>
                  )}
                  {extractFirstPageOnly && pageCount !== null && pageCount > 1 && (
                    <span className="text-amber-600 font-medium">First page extracted</span>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Success Message */}
          {displayFile && !error && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>
                {extractFirstPageOnly && pageCount !== null && pageCount > 1
                  ? 'First page extracted successfully. Ready to upload.'
                  : 'PDF ready to upload.'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all',
            'hover:border-teal-400 hover:bg-teal-50/50',
            dragActive
              ? 'border-teal-500 bg-teal-50'
              : error
              ? 'border-error-300 bg-error-50'
              : 'border-gray-300 bg-gray-50'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={handleChange}
            className="sr-only"
          />

          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                dragActive ? 'bg-teal-100' : 'bg-gray-100'
              )}
            >
              <Upload
                className={cn(
                  'w-8 h-8',
                  dragActive ? 'text-teal-600' : 'text-gray-400'
                )}
              />
            </div>

            <p className="text-base font-semibold text-gray-700 mb-1">
              {dragActive ? 'Drop PDF file here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-gray-500">
              PDF files up to {formatFileSize(maxSize)}
            </p>
            {extractFirstPageOnly && (
              <p className="mt-2 text-xs text-amber-600 font-medium">
                ⚠️ Only the first page will be extracted and saved
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg p-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {helperText && !error && !displayFile && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
}

export default PDFUpload

