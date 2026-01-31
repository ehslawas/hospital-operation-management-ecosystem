import React, { useCallback, useState, useRef } from 'react'
import { cn, formatFileSize, isValidImage } from '@/lib/utils'
import { validateFile } from '@/lib/validators'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { MAX_FILE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from '@/lib/constants'

export interface FileUploadProps {
  label?: string
  accept?: string
  maxSize?: number
  allowedTypes?: string[]
  value?: File | null
  onChange: (file: File | null) => void
  error?: string
  helperText?: string
  previewUrl?: string | null
  className?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = 'image/*',
  maxSize = MAX_FILE_SIZE_BYTES,
  allowedTypes = ALLOWED_IMAGE_TYPES,
  value,
  onChange,
  error: externalError,
  helperText,
  previewUrl: externalPreviewUrl,
  className,
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [internalError, setInternalError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(externalPreviewUrl || null)
  const inputRef = useRef<HTMLInputElement>(null)

  const error = externalError || internalError

  const handleFile = useCallback(
    (file: File) => {
      const validation = validateFile(file, { maxSize, allowedTypes })
      
      if (!validation.valid) {
        setInternalError(validation.error || 'Invalid file')
        return
      }

      setInternalError(null)
      
      // Create preview for images
      if (isValidImage(file)) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }
      
      onChange(file)
    },
    [maxSize, allowedTypes, onChange]
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
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [previewUrl, onChange])

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}

      {previewUrl || value ? (
        <div className="relative group">
          <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-error-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-error-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          {value && (
            <p className="mt-2 text-xs text-gray-500 truncate max-w-[128px]">
              {value.name} ({formatFileSize(value.size)})
            </p>
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
            'relative border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all',
            'hover:border-primary-400 hover:bg-primary-50/50',
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : error
              ? 'border-error-300 bg-error-50'
              : 'border-gray-300 bg-gray-50'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="sr-only"
          />
          
          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center mb-3',
                dragActive ? 'bg-primary-100' : 'bg-gray-100'
              )}
            >
              <Upload
                className={cn(
                  'w-6 h-6',
                  dragActive ? 'text-primary-600' : 'text-gray-400'
                )}
              />
            </div>
            
            <p className="text-sm font-medium text-gray-700">
              {dragActive ? 'Drop file here' : 'Click to upload or drag and drop'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG, WEBP up to {maxSize / (1024 * 1024)}MB
            </p>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-sm text-error-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
}

export default FileUpload

