// @ts-nocheck
import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Sparkles, FileImage, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/Modal'
import { cn, calculateFileHash } from '@/lib/utils'
import { analyzeCatalogDocument, type DocumentExtractionResult } from '@/services/aiService'
import { getNonDrugCategories, createOrGetNonDrugCategory, getDrugCategories, createOrGetDrugCategory } from '@/services/pharmacy/inventoryService'
import { checkFileDuplicate, recordFileUpload, updateUploadRecord } from '@/services/pharmacy/uploadService'
import { useAuthStore } from '@/stores/authStore'
import type { NonDrugCategory, DrugCategory } from '@/types/pharmacy'

// Declare XLSX on window for CDN import
declare global {
  interface Window {
    XLSX: any
  }
}

export interface ColumnMapping {
  excelColumn: string
  targetField: string
  confidence: number
}

export interface ExcelImportProps {
  isOpen: boolean
  onClose: () => void
  onImport: (
    data: any[],
    mappings: ColumnMapping[],
    onProgress?: (info: { processed: number; total: number; success: number; failed: number }) => void
  ) => Promise<{ success: number; errors: string[] }>
  targetFields: Array<{ key: string; label: string; required?: boolean; type?: 'string' | 'number' | 'select' }>
  title?: string
  description?: string
  catalogType?: 'drug' | 'non_drug' // For Vision AI document analysis
}

export const ExcelImport: React.FC<ExcelImportProps> = ({
  isOpen,
  onClose,
  onImport,
  targetFields,
  title = 'Import from Excel',
  description = 'Upload an Excel file to import data. Our AI will automatically map columns.',
  catalogType,
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [excelData, setExcelData] = useState<any[]>([])
  const [excelColumns, setExcelColumns] = useState<string[]>([])
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null)
  const [importProgress, setImportProgress] = useState<{
    processed: number
    total: number
    success: number
    failed: number
  } | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isAnalyzingVision, setIsAnalyzingVision] = useState(false)
  const [visionResult, setVisionResult] = useState<DocumentExtractionResult | null>(null)
  const [categories, setCategories] = useState<(NonDrugCategory | DrugCategory)[]>([])
  const [uploadRecordId, setUploadRecordId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuthStore()

  // Load categories when component mounts or catalogType changes
  useEffect(() => {
    if (catalogType && isOpen) {
      console.log('[CATEGORY] Loading categories for catalogType:', catalogType)
      const loadCategories = catalogType === 'non_drug' 
        ? getNonDrugCategories()
        : getDrugCategories()
      
      loadCategories.then(result => {
        if (result.data) {
          console.log('[CATEGORY] Categories loaded:', result.data.length, 'categories')
          setCategories(result.data)
        } else {
          console.warn('[CATEGORY] Failed to load categories:', result.error)
        }
      }).catch(error => {
        console.error('[CATEGORY] Error loading categories:', error)
      })
    } else {
      // Clear categories when not needed
      setCategories([])
    }
  }, [catalogType, isOpen])
  
  // Detect file type
  const getFileType = (file: File): 'excel' | 'image' | 'pdf' => {
    const fileName = file.name.toLowerCase()
    const fileType = file.type
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return 'pdf'
    }
    if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
      return 'image'
    }
    return 'excel'
  }

  // AI-assisted column mapping using pattern matching
  const mapColumns = useCallback((columns: string[], targetFields: ExcelImportProps['targetFields'], catalogType?: 'drug' | 'non_drug'): ColumnMapping[] => {
    const mappings: ColumnMapping[] = []
    
    // Create a mapping dictionary with various patterns
    const fieldPatterns: Record<string, string[]> = {}
    targetFields.forEach(field => {
      const patterns: string[] = []
      const key = field.key.toLowerCase()
      const label = field.label.toLowerCase()
      
      // Exact matches
      patterns.push(key, label)
      
      // Common variations - more aggressive patterns
      if (key.includes('code') || key.includes('drug_code') || key.includes('item_code')) {
        // Prioritize columns that look like product codes, not packaging descriptions
        patterns.push('drug/non-drug code', 'drug/non-drug', 'drug code', 'non-drug code', 'product code', 'code', 'item code', 'item_code', 'drug_code', 'id', 'identifier', 'item id', 'drug id', 'itemid', 'drugid')
        // Lower priority for generic "item code" which might be packaging
        patterns.push('item code') // Add at end for lower priority
      }
      if (key.includes('name') || key.includes('drug_name') || key.includes('item_name')) {
        // Prioritize "drug/non-drug name" patterns first (highest priority)
        patterns.push('drug/non-drug name', 'drug/non-drug', 'drug name', 'non-drug name', 'non drug name')
        // Then product name patterns
        patterns.push('product name', 'name', 'item name', 'item_name', 'drug_name', 'product_name', 'title')
        // Lower priority for generic descriptions
        patterns.push('description', 'desc', 'packaging description') // Add at end for lower priority
      }
      if (key.includes('sku')) {
        patterns.push('sku', 'stock keeping unit')
      }
      if (key.includes('pku')) {
        patterns.push('pku', 'packing unit')
      }
      if (key.includes('category')) {
        patterns.push('item category', 'item_category', 'category', 'cat', 'type', 'classification', 'item type', 'item_type')
      }
      if (key.includes('supplier')) {
        patterns.push('supplier', 'vendor', 'manufacturer', 'supplier name', 'vendor name')
      }
      if (key.includes('price')) {
        patterns.push('price', 'cost', 'unit price', 'unit cost', 'amount', 'rm', 'ringgit')
      }
      if (key.includes('status')) {
        patterns.push('status', 'state', 'active', 'inactive')
      }
      if (key.includes('procurement')) {
        patterns.push('procurement', 'vote', 'procurement vote', 'budget', 'appl', 'cc', 'dp', 'lp')
      }
      if (key.includes('stock') && key.includes('min')) {
        patterns.push('min stock', 'minimum stock', 'min stock level', 'min_stock', 'reorder point')
      }
      if (key.includes('stock') && key.includes('max')) {
        patterns.push('max stock', 'maximum stock', 'max stock level', 'max_stock', 'maximum')
      }
      if (key.includes('reorder')) {
        patterns.push('reorder', 'reorder level', 'reorder point', 'reorder_level')
      }
      if (key.includes('generic')) {
        patterns.push('generic', 'generic name', 'generic_name')
      }
      if (key.includes('brand')) {
        patterns.push('brand', 'brand name', 'brand_name', 'trade name')
      }
      if (key.includes('strength')) {
        patterns.push('strength', 'dosage', 'concentration')
      }
      if (key.includes('dosage')) {
        patterns.push('dosage form', 'dosage_form', 'form', 'format')
      }
      if (key.includes('unit') && key.includes('measure')) {
        patterns.push('unit', 'uom', 'unit of measure', 'unit_of_measure', 'measurement unit')
      }
      if (key.includes('lead') && key.includes('time')) {
        patterns.push('lead time', 'lead_time', 'delivery time', 'days')
      }
      if (key.includes('storage')) {
        patterns.push('storage', 'storage conditions', 'storage_conditions', 'condition')
      }
      if (key.includes('packaging') && key.includes('description')) {
        patterns.push('packaging description', 'packaging_description', 'packaging', 'package description', 'pack description')
      }
      
      fieldPatterns[field.key] = patterns
    })

    // Match columns to fields - find BEST match for each field (not first match)
    // Use a map to track best matches per field (allows replacement with better matches)
    const fieldMatches = new Map<string, { column: string; confidence: number }>()
    
    // First pass: Evaluate all columns against all fields, find best match for each field
    columns.forEach(column => {
      // Normalize column name: remove newlines, extra spaces, normalize slashes
      const normalizedColumn = column.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
      const colLower = normalizedColumn.toLowerCase()
      
      // DIRECT MATCHES FIRST: Handle "drug/non-drug code" and "drug/non-drug name" explicitly
      if (colLower.includes('drug/non-drug') && colLower.includes('code')) {
        // This is definitely the code column
        const codeField = catalogType === 'drug' ? 'drug_code' : 'item_code'
        if (targetFields.some(f => f.key === codeField)) {
          const existing = fieldMatches.get(codeField)
          if (!existing || existing.confidence < 0.99) {
            fieldMatches.set(codeField, { column, confidence: 0.99 })
            console.log(`[MAP] Direct match: "${column}" -> "${codeField}" (drug/non-drug code)`)
          }
        }
      }
      
      if (colLower.includes('drug/non-drug') && colLower.includes('name')) {
        // This is definitely the name column
        const nameField = catalogType === 'drug' ? 'drug_name' : 'item_name'
        if (targetFields.some(f => f.key === nameField)) {
          const existing = fieldMatches.get(nameField)
          if (!existing || existing.confidence < 0.99) {
            fieldMatches.set(nameField, { column, confidence: 0.99 })
            console.log(`[MAP] Direct match: "${column}" -> "${nameField}" (drug/non-drug name)`)
          }
        }
      }

      // Check each target field
      Object.entries(fieldPatterns).forEach(([fieldKey, patterns]) => {
        patterns.forEach((pattern, patternIndex) => {
          const patternLower = pattern.toLowerCase()
          const priority = 1 / (patternIndex + 1) // Earlier patterns have higher priority
          let matchConfidence = 0
          
          // Exact match - highest priority
          if (colLower === patternLower) {
            matchConfidence = 1.0 * priority
            console.log(`[MAP] Exact match: "${column}" -> "${fieldKey}" (confidence: ${matchConfidence})`)
          }
          // Contains match - check if column contains pattern or vice versa
          else if (colLower.includes(patternLower) || patternLower.includes(colLower)) {
            // Boost confidence for "drug/non-drug" patterns
            let confidence = Math.min(
              patternLower.length / colLower.length,
              colLower.length / patternLower.length,
              0.9
            )
            
            // Special handling: prioritize "drug/non-drug" patterns (both code and name)
            // Check for "drug/non-drug name" pattern
            if (patternLower === 'drug/non-drug name' && colLower.includes('drug/non-drug') && colLower.includes('name')) {
              confidence = 0.99 // Highest confidence for exact match
              console.log(`[MAP] Drug/non-drug name match: "${column}" -> "${fieldKey}" (confidence: ${confidence})`)
            }
            // Check for "drug/non-drug code" pattern
            else if (patternLower === 'drug/non-drug code' && colLower.includes('drug/non-drug') && colLower.includes('code')) {
              confidence = 0.99 // Highest confidence for exact match
              console.log(`[MAP] Drug/non-drug code match: "${column}" -> "${fieldKey}" (confidence: ${confidence})`)
            }
            // Contains match for "drug/non-drug" patterns
            else if (patternLower.includes('drug/non-drug') && colLower.includes('drug/non-drug')) {
              confidence = 0.95 // Very high confidence for drug/non-drug columns
              console.log(`[MAP] Drug/non-drug contains match: "${column}" -> "${fieldKey}" (confidence: ${confidence})`)
            }
            // Lower confidence for generic "item code" which might be packaging
            else if (patternLower === 'item code' && colLower === 'item code') {
              confidence = 0.3 // Lower confidence - might be packaging description
              console.log(`[MAP] Item code match (low confidence): "${column}" -> "${fieldKey}" (confidence: ${confidence})`)
            }
            // Lower confidence for "packaging description" to avoid mapping to name
            else if (colLower.includes('packaging description') || colLower.includes('packaging')) {
              confidence = 0.1 // Very low confidence - this is not a product name
            }
            else {
              console.log(`[MAP] Contains match: "${column}" (${colLower}) contains "${patternLower}" -> "${fieldKey}" (confidence: ${confidence})`)
            }
            
            matchConfidence = confidence * priority
          }
          // Fuzzy match (similarity)
          else {
            const similarity = calculateSimilarity(colLower, patternLower)
            if (similarity > 0.6) {
              matchConfidence = similarity * priority
              console.log(`[MAP] Fuzzy match: "${column}" -> "${fieldKey}" (similarity: ${similarity}, confidence: ${matchConfidence})`)
            }
          }
          
          // Update best match for this field if this is better
          if (matchConfidence > 0.4) {
            const existing = fieldMatches.get(fieldKey)
            if (!existing || existing.confidence < matchConfidence) {
              fieldMatches.set(fieldKey, { column, confidence: matchConfidence })
              console.log(`[MAP] Updated best match for "${fieldKey}": "${column}" (confidence: ${matchConfidence})`)
            }
          }
        })
      })
    })
    
    console.log('[MAP] Final field matches:', Array.from(fieldMatches.entries()).map(([field, match]) => ({ field, column: match.column, confidence: match.confidence })))
    
    // Convert map to mappings array (now each field has its best matching column)
    fieldMatches.forEach((match, fieldKey) => {
      mappings.push({
        excelColumn: match.column,
        targetField: fieldKey,
        confidence: match.confidence,
      })
    })

    return mappings
  }, [])

  // Simple string similarity calculation (Levenshtein-like)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    if (longer.length === 0) return 1.0
    
    const distance = levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = []
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    return matrix[str2.length][str1.length]
  }

  const handleFile = useCallback(async (selectedFile: File) => {
    const fileType = getFileType(selectedFile)
    
    // Validate file type
    if (fileType === 'excel' && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      setImportResult({
        success: 0,
        errors: ['Please upload an Excel file (.xlsx, .xls), CSV file, PDF, or image file'],
      })
      return
    }

    // Check for duplicate file
    try {
      if (!user?.hospital_id) {
        setImportResult({
          success: 0,
          errors: ['User not authenticated. Please log in again.'],
        })
        return
      }

      setIsProcessing(true)
      setImportResult(null)
      setVisionResult(null)

      // Calculate file hash
      const fileHash = await calculateFileHash(selectedFile)
      
      // Check if file has been uploaded before
      const duplicateCheck = await checkFileDuplicate(user.hospital_id, fileHash)
      
      if (duplicateCheck.error) {
        setImportResult({
          success: 0,
          errors: [`Error checking for duplicate: ${duplicateCheck.error}`],
        })
        setIsProcessing(false)
        return
      }

      if (duplicateCheck.data?.isDuplicate && duplicateCheck.data.existingFile) {
        const existing = duplicateCheck.data.existingFile
        setImportResult({
          success: 0,
          errors: [
            `This file has already been uploaded on ${new Date(existing.uploaded_at).toLocaleDateString()}. ` +
            `It imported ${existing.items_imported} item(s). Duplicate uploads are not allowed.`,
          ],
        })
        setIsProcessing(false)
        setFile(null)
        return
      }

      // Record file upload
      const uploadRecord = await recordFileUpload(
        user.hospital_id,
        selectedFile,
        fileHash,
        catalogType || 'non_drug',
        user.id
      )

      if (uploadRecord.error) {
        setImportResult({
          success: 0,
          errors: [`Failed to record upload: ${uploadRecord.error}`],
        })
        setIsProcessing(false)
        return
      }

      if (uploadRecord.data) {
        setUploadRecordId(uploadRecord.data.id)
      }
    } catch (error) {
      console.error('Error in duplicate check:', error)
      setImportResult({
        success: 0,
        errors: [`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`],
      })
      setIsProcessing(false)
      return
    }

    setFile(selectedFile)

    // Handle Vision AI analysis for images/PDFs
    if ((fileType === 'image' || fileType === 'pdf') && catalogType) {
      setIsAnalyzingVision(true)
      try {
        console.log('Starting Vision AI analysis for:', selectedFile.name, 'catalogType:', catalogType)
        const result = await analyzeCatalogDocument(selectedFile, catalogType)
        console.log('Vision AI raw result:', result)
        
        // SECONDARY FILTER: Additional validation to ensure invalid items are filtered
        const invalidCodes = ['APPL', 'CC', 'DP', 'LP', 'CONTRACT', 'ITEM CODE', 'ITEM_CODE', 'NON-DRUG NAME', 'SKU', 'PKU', 'CATEGORY', 'SUPPLIER', 'PROCUREMENT VOTE', 'STATUS', 'PRICE', 'ACTIONS']
        const invalidNamePatterns = ['each', 'pack of', 'contract', 'non-drug name', 'item name', 'drug name']
        
        const filteredItems = result.items.filter((item) => {
          const code = catalogType === 'drug' ? item.drug_code : item.item_code
          const name = catalogType === 'drug' ? item.drug_name : item.item_name
          
          if (!code || !name) {
            console.log('Filtered out item (missing code/name):', item)
            return false
          }
          
          const codeStr = String(code).trim().toUpperCase()
          const nameStr = String(name).trim().toLowerCase()
          
          // Check if code is invalid
          if (invalidCodes.includes(codeStr)) {
            console.log('Filtered out item (invalid code):', code, name)
            return false
          }
          
          // Check if name is invalid (exact match or starts with invalid pattern)
          for (const pattern of invalidNamePatterns) {
            if (nameStr === pattern || nameStr.startsWith(pattern + ' ') || nameStr === pattern.toLowerCase()) {
              console.log('Filtered out item (invalid name):', code, name)
              return false
            }
          }
          
          // Code should be at least 3 characters and look like a product code
          if (codeStr.length < 3) {
            console.log('Filtered out item (code too short):', code, name)
            return false
          }
          
          // Name should be at least 5 characters and be a real product name
          if (nameStr.length < 5) {
            console.log('Filtered out item (name too short):', code, name)
            return false
          }
          
          return true
        })
        
        console.log('Filtered items count:', filteredItems.length, 'from original:', result.items.length)
        
        // Update result with filtered items
        const filteredResult = {
          ...result,
          items: filteredItems,
          total_items: filteredItems.length,
          errors: result.items.length !== filteredItems.length 
            ? [...(result.errors || []), `Filtered out ${result.items.length - filteredItems.length} invalid item(s)`]
            : result.errors
        }
        
        setVisionResult(filteredResult)
        
        if (filteredResult.items.length > 0) {
          // Transform vision-extracted items to match expected format
          const transformedData = filteredResult.items.map((item) => {
            const transformed: any = {}
            
            // Map all fields from extracted item
            Object.keys(item).forEach((key) => {
              if (key !== 'confidence') {
                transformed[key] = item[key as keyof typeof item]
              }
            })
            
            return transformed
          })
          
          console.log('Transformed data for import:', transformedData)
          setExcelData(transformedData)
          
          // Create automatic mappings based on extracted fields
          const extractedFields = new Set(Object.keys(transformedData[0] || {}))
          const autoMappings: ColumnMapping[] = targetFields
            .filter((field) => extractedFields.has(field.key))
            .map((field) => ({
              excelColumn: field.key, // In vision mode, we use the field key directly
              targetField: field.key,
              confidence: 0.95, // High confidence for AI-extracted data
            }))
          
          setMappings(autoMappings)
          
          // Check required fields
          const requiredFields = targetFields.filter(f => f.required)
          const mappedRequiredFields = requiredFields.filter(f => 
            autoMappings.some(m => m.targetField === f.key)
          )
          
          if (requiredFields.length === 0 || mappedRequiredFields.length >= requiredFields.length) {
            // All required fields are present, proceed with automatic import
            setIsProcessing(false)
            setIsImporting(true)
            
            try {
              console.log('Calling onImport with', transformedData.length, 'items:', transformedData)
              const importResult = await onImport(transformedData, autoMappings, setImportProgress)
              console.log('Import result:', importResult)
              setImportResult(importResult)
              
              if (importResult.errors.length === 0) {
                setTimeout(() => {
                  handleClose()
                }, 2000)
              }
            } catch (error) {
              console.error('Import error:', error)
              setImportResult({ 
                success: 0, 
                errors: ['Failed to import data: ' + (error instanceof Error ? error.message : 'Unknown error')] 
              })
            } finally {
              setIsImporting(false)
              setIsProcessing(false)
            }
          } else {
            // Missing required fields
            setIsProcessing(false)
            const missing = requiredFields
              .filter(f => !mappedRequiredFields.some(mf => mf.key === f.key))
              .map(f => f.label)
              .join(', ')
            setImportResult({ 
              success: 0, 
              errors: [`Cannot automatically import: Missing required fields: ${missing}`] 
            })
          }
        } else {
          setIsProcessing(false)
          console.log('No valid items after filtering. Original items:', result.items)
          setImportResult({ 
            success: 0, 
            errors: filteredResult.errors?.length 
              ? filteredResult.errors 
              : ['No valid items could be extracted from the document. All items were filtered out as invalid (headers, labels, or incomplete data).'] 
          })
        }
      } catch (error) {
        console.error('Vision AI analysis error:', error)
        setIsProcessing(false)
        setImportResult({ 
          success: 0, 
          errors: ['Failed to analyze document: ' + (error instanceof Error ? error.message : 'Unknown error')] 
        })
      } finally {
        setIsAnalyzingVision(false)
      }
      return
    }

    // Original Excel processing logic
    if (fileType !== 'excel') {
      setIsProcessing(false)
      return
    }

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          // Load xlsx from CDN to avoid Vite module resolution issues
          let XLSX: any
          if ((window as any).XLSX) {
            XLSX = (window as any).XLSX
          } else {
            // Load from CDN if not already loaded
            const script = document.createElement('script')
            script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
            script.async = true
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Timeout loading xlsx library from CDN'))
              }, 10000) // 10 second timeout
              
              script.onload = () => {
                clearTimeout(timeout)
                XLSX = (window as any).XLSX
                if (!XLSX) {
                  reject(new Error('XLSX library loaded but not available on window object'))
                } else {
                  resolve(XLSX)
                }
              }
              script.onerror = () => {
                clearTimeout(timeout)
                reject(new Error('Failed to load xlsx library from CDN. Please check your internet connection.'))
              }
              document.head.appendChild(script)
            })
          }
          
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

          if (jsonData.length === 0) {
            alert('The Excel file appears to be empty')
            setIsProcessing(false)
            return
          }

          // First row is headers
          const headers = (jsonData[0] as any[]).map(h => String(h).trim()).filter(h => h)
          const rows = jsonData
            .slice(1)
            .filter((row) => row != null && Array.isArray(row) && row.length > 0) // Filter out null/undefined/empty rows
            .map(row => {
              const obj: any = {}
              headers.forEach((header, index) => {
                obj[header] = row[index] ?? ''
              })
              return obj
            })
            .filter(row => row != null && typeof row === 'object' && Object.values(row).some(val => val !== '' && val != null))

          setExcelColumns(headers)
          setExcelData(rows)

          // Auto-map columns
          const autoMappings = mapColumns(headers, targetFields, catalogType)
          setMappings(autoMappings)

          console.log('Auto-mapped columns:', autoMappings)
          console.log('Excel headers:', headers)
          console.log('Target fields:', targetFields.map(f => ({ key: f.key, label: f.label, required: f.required })))
          
          // Check if category_id is mapped
          const categoryMapping = autoMappings.find(m => m.targetField === 'category_id')
          if (categoryMapping) {
            console.log('[CATEGORY] Category column mapped:', categoryMapping)
          } else {
            console.warn('[CATEGORY] Category column NOT mapped! Available headers:', headers)
            console.warn('[CATEGORY] Looking for patterns: category, cat, type, classification')
          }
          
          // Debug: Check if required fields are mapped
          const requiredFields = targetFields.filter(f => f.required)
          const mappedRequiredFields = requiredFields.filter(f => 
            autoMappings.some(m => m.targetField === f.key)
          )
          console.log('Required fields:', requiredFields.map(f => f.label))
          console.log('Mapped required fields:', mappedRequiredFields.map(f => f.label))
          console.log('Missing required fields:', requiredFields
            .filter(f => !mappedRequiredFields.some(mf => mf.key === f.key))
            .map(f => f.label))

          // Automatically proceed with import if mappings are found
          if (autoMappings.length > 0) {
            // Check required fields
            const requiredFields = targetFields.filter(f => f.required)
            const mappedRequiredFields = requiredFields.filter(f => 
              autoMappings.some(m => m.targetField === f.key)
            )

            console.log('Required fields:', requiredFields.map(f => f.label))
            console.log('Mapped required fields:', mappedRequiredFields.map(f => f.label))

            if (requiredFields.length === 0 || mappedRequiredFields.length >= requiredFields.length) {
              // All required fields are mapped (or no required fields), proceed with automatic import
              setIsProcessing(false)
              setIsImporting(true)
              
              // Ensure categories are loaded before processing
              const loadCategoriesIfNeeded = async () => {
                // Always reload categories to ensure we have the latest data
                if (catalogType) {
                  console.log('[CATEGORY] Loading categories for catalogType:', catalogType)
                  const result = catalogType === 'non_drug' 
                    ? await getNonDrugCategories()
                    : await getDrugCategories()
                  if (result.data && result.data.length > 0) {
                    console.log('[CATEGORY] Categories loaded:', result.data.length, 'categories')
                    setCategories(result.data)
                    return result.data
                  } else {
                    console.error('[CATEGORY] Failed to load categories or no categories found:', result.error)
                  }
                }
                // Return current categories if already loaded, or empty array
                return categories.length > 0 ? categories : []
              }
              
              try {
                const finalCategories = await loadCategoriesIfNeeded()
                console.log('[CATEGORY] Using categories:', finalCategories.length, 'categories')
                console.log('[CATEGORY] Available categories:', finalCategories.map(c => ({ id: c.id, name: c.category_name, code: c.category_code })))
                
                // Helper function to find or create category ID by name
                const findOrCreateCategoryIdByName = async (categoryName: string): Promise<string | undefined> => {
                  if (!categoryName || !categoryName.trim()) {
                    return undefined
                  }

                  const nameTrimmed = categoryName.trim()
                  const nameLower = nameTrimmed.toLowerCase()
                  
                  // First, try to find in existing categories
                  const catsToUse = finalCategories || categories
                  
                  if (catsToUse.length > 0) {
                    // Try exact match first
                    let category = catsToUse.find(c => 
                      c.category_name.toLowerCase() === nameLower ||
                      c.category_code.toLowerCase() === nameLower
                    )
                    
                    // Try partial match if exact match not found
                    if (!category) {
                      category = catsToUse.find(c => 
                        c.category_name.toLowerCase().includes(nameLower) ||
                        nameLower.includes(c.category_name.toLowerCase())
                      )
                    }
                    
                    if (category) {
                      console.log(`[CATEGORY] âœ“ Matched "${categoryName}" to existing category: ${category.category_name} (ID: ${category.id})`)
                      return category.id
                    }
                  }
                  
                  // If not found, create new category
                  console.log(`[CATEGORY] Creating new category: "${categoryName}"`)
                  const result = catalogType === 'non_drug'
                    ? await createOrGetNonDrugCategory(nameTrimmed, user?.hospital_id)
                    : await createOrGetDrugCategory(nameTrimmed, user?.hospital_id)
                  
                  if (result.data) {
                    // Add to local categories array for subsequent lookups
                    if (finalCategories) {
                      finalCategories.push(result.data)
                    } else {
                      setCategories([...categories, result.data])
                    }
                    console.log(`[CATEGORY] âœ“ Created category: ${result.data.category_name} (ID: ${result.data.id})`)
                    return result.data.id
                  } else {
                    console.warn(`[CATEGORY] Failed to create category: "${categoryName}"`, result.error)
                    return undefined
                  }
                }

                // Transform data based on mappings (with async category creation)
                const transformedDataPromises = rows
                  .filter((row) => row != null && typeof row === 'object') // Filter out null/undefined rows
                  .map(async (row, index) => {
                    const transformed: any = {}
                    for (const mapping of autoMappings) {
                      const value = row[mapping.excelColumn]
                      const targetField = targetFields.find(f => f.key === mapping.targetField)
                      
                      // Special handling for category_id: convert category name to ID or create new category
                      if (mapping.targetField === 'category_id' && catalogType) {
                        if (value) {
                          const categoryId = await findOrCreateCategoryIdByName(String(value))
                          transformed[mapping.targetField] = categoryId || ''
                          if (!categoryId && value) {
                            console.warn(`[CATEGORY] Row ${index + 2}: Could not create/find category ID for: "${value}"`)
                          }
                        } else {
                          // Empty category value - leave it empty
                          transformed[mapping.targetField] = ''
                        }
                      } else if (targetField?.type === 'number') {
                        transformed[mapping.targetField] = value ? parseFloat(String(value)) || 0 : 0
                      } else {
                        transformed[mapping.targetField] = value ? String(value).trim() : ''
                      }
                    }
                    return transformed
                  })
                
                const transformedDataArray = await Promise.all(transformedDataPromises)
                
                const transformedData = transformedDataArray.filter((transformed) => {
                    // Filter out objects that have no meaningful data (all empty strings)
                    // Note: We allow 0 as a valid value (e.g., price = 0)
                    const hasData = Object.values(transformed).some(val => 
                      val !== '' && val !== null && val !== undefined
                    )
                    
                    if (!hasData) return false
                    
                    // ADDITIONAL VALIDATION: Filter out invalid item codes and names
                    const invalidCodes = ['APPL', 'CC', 'DP', 'LP', 'CONTRACT', 'ITEM CODE', 'ITEM_CODE', 'NON-DRUG NAME', 'DRUG NAME', 'SKU', 'PKU', 'CATEGORY', 'SUPPLIER', 'PROCUREMENT VOTE', 'STATUS', 'PRICE', 'ACTIONS']
                    const invalidNamePatterns = ['each', 'pack of', 'contract', 'non-drug name', 'drug name', 'item name']
                    
                    // Get the code and name fields based on catalog type
                    const codeField = catalogType === 'drug' ? 'drug_code' : 'item_code'
                    const nameField = catalogType === 'drug' ? 'drug_name' : 'item_name'
                    
                    const code = transformed[codeField]
                    const name = transformed[nameField]
                    
                    // Filter out rows with missing required fields (code or name)
                    if (!code || !name || String(code).trim() === '' || String(name).trim() === '') {
                      return false // Skip rows with missing required fields
                    }
                    
                    const codeStr = String(code).trim().toUpperCase()
                    const nameStr = String(name).trim().toLowerCase()
                    
                    // Filter out invalid codes
                    if (invalidCodes.includes(codeStr)) {
                      console.log('Filtered out invalid code in Excel import:', code, name)
                      return false
                    }
                    
                    // Filter out invalid names
                    for (const pattern of invalidNamePatterns) {
                      if (nameStr === pattern || nameStr.startsWith(pattern + ' ') || nameStr === pattern) {
                        console.log('Filtered out invalid name in Excel import:', code, name)
                        return false
                      }
                    }
                    
                    // Code should be at least 3 characters
                    if (codeStr.length < 3) {
                      console.log('Filtered out code too short:', code, name)
                      return false
                    }
                    
                    // Name should be at least 5 characters
                    if (nameStr.length < 5) {
                      console.log('Filtered out name too short:', code, name)
                      return false
                    }
                    
                    return true
                  })

                console.log('Transformed data sample:', transformedData.slice(0, 2))
                console.log('Total transformed rows:', transformedData.length)
                
                try {
                  const result = await onImport(transformedData, autoMappings, setImportProgress)
                  console.log('Import result:', result)
                  setImportResult(result)
                  
                  // Update upload record with results
                  if (uploadRecordId && user?.hospital_id) {
                    await updateUploadRecord(
                      uploadRecordId,
                      user.hospital_id,
                      result.errors.length === 0 ? 'completed' : 'failed',
                      result.success,
                      result.errors.length,
                      result.errors.length > 0 ? { errors: result.errors } : undefined
                    )
                  }
                  
                  // Auto-close after successful import (with delay to show result)
                  if (result.errors.length === 0) {
                    setTimeout(() => {
                      // Reset state and close modal
                      setFile(null)
                      setExcelData([])
                      setExcelColumns([])
                      setMappings([])
                      setImportResult(null)
                      setUploadRecordId(null)
                      onClose()
                    }, 2000)
                  }
                } catch (importError) {
                  console.error('Import error:', importError)
                  const errorMsg = importError instanceof Error ? importError.message : 'Unknown error'
                  const errorResult = {
                    success: 0,
                    errors: [`Failed to import data: ${errorMsg}`],
                  }
                  setImportResult(errorResult)
                  
                  // Update upload record with error
                  if (uploadRecordId && user?.hospital_id) {
                    await updateUploadRecord(
                      uploadRecordId,
                      user.hospital_id,
                      'failed',
                      0,
                      1,
                      { error: errorMsg }
                    )
                  }
                }
              } catch (error) {
                console.error('Import error:', error)
                setImportResult({ success: 0, errors: ['Failed to import data: ' + (error instanceof Error ? error.message : 'Unknown error')] })
              } finally {
                setIsImporting(false)
                setIsProcessing(false)
              }
            } else {
              // Missing required fields - show error
              setIsProcessing(false)
              const missing = requiredFields
                .filter(f => !mappedRequiredFields.some(mf => mf.key === f.key))
                .map(f => f.label)
                .join(', ')
              setImportResult({ 
                success: 0, 
                errors: [`Cannot automatically import: Missing required fields: ${missing}. Please check your Excel file columns. Found columns: ${headers.join(', ')}`] 
              })
            }
          } else {
            // No mappings found - show error
            setIsProcessing(false)
            setImportResult({ 
              success: 0, 
              errors: [`Cannot automatically map columns. Please ensure your Excel file has recognizable column headers. Found columns: ${headers.join(', ')}. Expected fields: ${targetFields.map(f => f.label).join(', ')}`] 
            })
          }
        } catch (error) {
          console.error('Error parsing Excel:', error)
          setImportResult({ 
            success: 0, 
            errors: ['Error parsing Excel file. Please ensure it is a valid Excel file.'] 
          })
        } finally {
          setIsProcessing(false)
        }
      }
      reader.readAsBinaryString(selectedFile)
    } catch (error) {
      console.error('Error reading file:', error)
      alert('Error reading file')
      setIsProcessing(false)
    }
  }, [targetFields, mapColumns])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const droppedFile = e.dataTransfer.files?.[0]
      if (droppedFile) {
        handleFile(droppedFile)
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

  const handleMappingChange = (excelColumn: string, targetField: string) => {
    setMappings(prev => {
      const filtered = prev.filter(m => m.excelColumn !== excelColumn)
      return [...filtered, { excelColumn, targetField, confidence: 0.8 }]
    })
  }

  const handleImport = async () => {
    if (mappings.length === 0) {
      alert('Please map at least one column')
      return
    }

    // Check required fields
    const requiredFields = targetFields.filter(f => f.required)
    const mappedRequiredFields = requiredFields.filter(f => 
      mappings.some(m => m.targetField === f.key)
    )

    if (mappedRequiredFields.length < requiredFields.length) {
      const missing = requiredFields
        .filter(f => !mappedRequiredFields.includes(f))
        .map(f => f.label)
        .join(', ')
      alert(`Please map the following required fields: ${missing}`)
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      // Transform data based on mappings
      const transformedData = excelData
        .filter((row) => row != null && typeof row === 'object') // Filter out null/undefined rows
        .map(row => {
          const transformed: any = {}
          mappings.forEach(mapping => {
            const value = row[mapping.excelColumn]
            const targetField = targetFields.find(f => f.key === mapping.targetField)
            
            if (targetField?.type === 'number') {
              transformed[mapping.targetField] = value ? parseFloat(String(value)) || 0 : 0
            } else {
              transformed[mapping.targetField] = value ? String(value).trim() : ''
            }
          })
          return transformed
        })
        .filter((transformed) => {
          // Filter out objects that have no meaningful data (all empty strings)
          // Note: We allow 0 as a valid value (e.g., price = 0)
          return Object.values(transformed).some(val => 
            val !== '' && val !== null && val !== undefined
          )
        })

      const result = await onImport(transformedData, mappings, setImportProgress)
      setImportResult(result)
      
      // Update upload record with results
      if (uploadRecordId && user?.hospital_id) {
        await updateUploadRecord(
          uploadRecordId,
          user.hospital_id,
          result.errors.length === 0 ? 'completed' : 'failed',
          result.success,
          result.errors.length,
          result.errors.length > 0 ? { errors: result.errors } : undefined
        )
      }
    } catch (error) {
      console.error('Import error:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setImportResult({ success: 0, errors: [`Failed to import data: ${errorMsg}`] })
      
      // Update upload record with error
      if (uploadRecordId && user?.hospital_id) {
        await updateUploadRecord(
          uploadRecordId,
          user.hospital_id,
          'failed',
          0,
          1,
          { error: errorMsg }
        )
      }
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setExcelData([])
    setExcelColumns([])
    setMappings([])
    setImportResult(null)
    setVisionResult(null)
    setIsAnalyzingVision(false)
    setImportProgress(null)
    setUploadRecordId(null)
    onClose()
  }

  const getFieldLabel = (key: string) => {
    return targetFields.find(f => f.key === key)?.label || key
  }

  const getUnmappedColumns = () => {
    return excelColumns.filter(col => !mappings.some(m => m.excelColumn === col))
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="xl">
      <div className="space-y-6">
        {description && <p className="text-sm text-gray-600">{description}</p>}

        {/* File Upload Area */}
        {!file && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all',
              'hover:border-teal-400 hover:bg-teal-50/50',
              dragActive
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-300 bg-gray-50'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={catalogType ? ".xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png,.gif,.webp" : ".xlsx,.xls,.csv"}
              onChange={(e) => {
                const selectedFile = e.target.files?.[0]
                if (selectedFile) handleFile(selectedFile)
              }}
              className="sr-only"
            />

            <div className="flex flex-col items-center text-center">
              <div
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                  dragActive ? 'bg-teal-100' : 'bg-gray-100'
                )}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                ) : (
                  <Upload className={cn('w-8 h-8', dragActive ? 'text-teal-600' : 'text-gray-400')} />
                )}
              </div>

              <p className="text-base font-medium text-gray-700">
                {isProcessing || isImporting || isAnalyzingVision
                  ? isImporting
                    ? 'Importing data automatically...'
                    : isAnalyzingVision
                    ? 'AI is analyzing your document...'
                    : 'Processing file and mapping columns...'
                  : dragActive
                  ? `Drop ${catalogType ? 'document' : 'Excel'} file here`
                  : `Click to upload or drag and drop`}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {isProcessing || isImporting || isAnalyzingVision
                  ? isAnalyzingVision
                    ? 'Vision AI is extracting catalog information from your document'
                    : 'AI is automatically mapping and importing your data'
                  : catalogType
                  ? 'Excel files (.xlsx, .xls), CSV, PDF, or images (JPG, PNG) up to 10MB'
                  : 'Excel files (.xlsx, .xls) or CSV files up to 10MB'}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-teal-600">
                <Sparkles className="w-4 h-4" />
                <span>
                  {catalogType 
                    ? 'AI will automatically extract and import catalog items from any document'
                    : 'AI will automatically map and import columns'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Import Progress */}
        {(isProcessing || isImporting || isAnalyzingVision) && file && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg border border-teal-200">
              <div className="flex items-center gap-3">
                {isImporting || isAnalyzingVision ? (
                  <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-teal-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {isImporting 
                      ? 'Importing data...' 
                      : isAnalyzingVision
                      ? 'AI is analyzing your document...'
                      : 'Mapping columns automatically...'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {file.name} â€¢{' '}
                    {importProgress && importProgress.total > 0
                      ? `${importProgress.processed}/${importProgress.total} items processed (${Math.round(
                          (importProgress.processed / importProgress.total) * 100
                        )}%)`
                      : visionResult
                      ? `${visionResult.total_items} items extracted`
                      : excelData.length > 0
                      ? `${excelData.length} rows found`
                      : 'Processing...'}
                  </p>
                </div>
              </div>
            </div>

            {importProgress && importProgress.total > 0 && (
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-teal-500 transition-all"
                  style={{ width: `${Math.round((importProgress.processed / importProgress.total) * 100)}%` }}
                />
              </div>
            )}
            
            {/* Vision AI Results Preview */}
            {visionResult && visionResult.items.length > 0 && !isImporting && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <FileImage className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      âœ“ Successfully extracted {visionResult.total_items} valid item(s)
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Confidence: {Math.round(visionResult.confidence * 100)}%
                      {visionResult.errors && visionResult.errors.length > 0 && (
                        <span className="text-amber-600 ml-2">
                          âš ï¸ {visionResult.errors[0]}
                        </span>
                      )}
                    </p>
                    {visionResult.errors && visionResult.errors.length > 0 && (
                      <p className="text-xs text-amber-700 mt-2 bg-amber-50 p-2 rounded">
                        Note: Invalid items (table headers, labels, or incomplete data) were automatically filtered out.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* File Info and Column Mapping - Only show if not auto-importing and there's an error */}
        {file && excelColumns.length > 0 && !isProcessing && !isImporting && importResult && importResult.errors.length > 0 && (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getFileType(file) === 'pdf' ? (
                  <FileText className="w-5 h-5 text-teal-600" />
                ) : getFileType(file) === 'image' ? (
                  <FileImage className="w-5 h-5 text-teal-600" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {visionResult ? `${visionResult.total_items} items extracted` : excelData.length > 0 ? `${excelData.length} rows found` : 'No data found'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null)
                  setExcelData([])
                  setExcelColumns([])
                  setMappings([])
                  setImportResult(null)
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Column Mapping */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-semibold text-gray-900">Column Mapping</h3>
                <span className="text-xs text-gray-500">({mappings.length} mapped)</span>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                {excelColumns.map((excelCol) => {
                  const mapping = mappings.find(m => m.excelColumn === excelCol)
                  return (
                    <div key={excelCol} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">{excelCol}</p>
                        <p className="text-xs text-gray-500">Excel Column</p>
                      </div>
                      <div className="text-gray-400">â†’</div>
                      <div className="flex-1">
                        <select
                          value={mapping?.targetField || ''}
                          onChange={(e) => handleMappingChange(excelCol, e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="">-- Not mapped --</option>
                          {targetFields.map((field) => (
                            <option key={field.key} value={field.key}>
                              {field.label} {field.required && '*'}
                            </option>
                          ))}
                        </select>
                      </div>
                      {mapping && (
                        <div className="flex items-center gap-1">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              mapping.confidence > 0.8
                                ? 'bg-green-500'
                                : mapping.confidence > 0.6
                                ? 'bg-yellow-500'
                                : 'bg-orange-500'
                            )}
                          />
                          <span className="text-xs text-gray-500">
                            {Math.round(mapping.confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {getUnmappedColumns().length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    {getUnmappedColumns().length} column(s) not mapped and will be skipped
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Import Result - Always show when there's a result */}
        {importResult && (
          <div
            className={cn(
              'p-4 rounded-lg',
              importResult.errors.length === 0
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            )}
          >
            <div className="flex items-start gap-3">
              {importResult.errors.length === 0 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {importResult.errors.length === 0
                    ? `âœ“ Successfully imported ${importResult.success} item(s)`
                    : `Import failed: ${importResult.success} item(s) imported, ${importResult.errors.length} error(s)`}
                </p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-red-800 mb-1">Errors:</p>
                    <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
                      {importResult.errors.slice(0, 10).map((error, idx) => (
                        <li key={idx} className="break-words">{error}</li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li>... and {importResult.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isImporting || isProcessing}>
            {importResult ? 'Close' : 'Cancel'}
          </Button>
          {/* Only show manual import button if auto-import failed and user needs to intervene */}
          {file && excelColumns.length > 0 && !isProcessing && !isImporting && importResult && importResult.errors.length > 0 && mappings.length > 0 && (
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                `Retry Import ${excelData.length} Item(s)`
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ExcelImport

