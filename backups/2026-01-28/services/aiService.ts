// AI Service for Hospital Information Generation
// Uses OpenRouter AI API for intelligent hospital information extraction

export interface HospitalAISuggestion {
  hospitalCode: string
  hospitalName: string
  state: string
  address?: string
  phone?: string
  email?: string
}

export interface GenerateHospitalInfoParams {
  hospitalName?: string
  description?: string
  location?: string
}

// OpenRouter API Configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
// Use environment variable only - NEVER hardcode API keys
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
// Using a model with better knowledge - you can change this to a model with web search if available
// Note: Free models have strict rate limits. Consider using a paid model or your own API key for better performance
const OPENROUTER_MODEL = 'google/gemini-2.0-flash-exp:free' // Better knowledge model

// IMPORTANT: Free AI models cannot search Google or access real-time web data
// They can only use their training data, which may be outdated or incomplete
// 
// To get REAL hospital information, you have two options:
// 1. Use a paid AI model with web search capabilities (e.g., Perplexity, Claude with web access)
// 2. Integrate a separate web search API (Serper, Tavily, Google Custom Search) + AI extraction
//
// The current implementation uses pattern matching from user input.
// For real-time Google search, integrate webSearchService.ts

// Option to disable API and use pattern matching only
// Set to true to skip API calls entirely (recommended for free tier to avoid rate limits)
const USE_PATTERN_MATCHING_ONLY = false // Set to true to disable API, false to use API (may hit rate limits)

// Option to use web search before AI (requires webSearchService integration)
// Set to true to search Google first, then extract with AI
// Requires VITE_SERPER_API_KEY or VITE_TAVILY_API_KEY in .env file
const USE_WEB_SEARCH = true // Enable web search for real hospital information

// Rate limit tracking
let rateLimitUntil: number | null = null
const RATE_LIMIT_COOLDOWN = 60 * 1000 // 1 minute cooldown after rate limit

// Check if API is available
const isAPIAvailable = () => {
  // Check if we're in rate limit cooldown
  if (rateLimitUntil && Date.now() < rateLimitUntil) {
    return false
  }
  // API key must be provided via environment variable
  return !!OPENROUTER_API_KEY && OPENROUTER_API_KEY.startsWith('sk-or-v1-')
}

/**
 * Generate hospital information using OpenRouter AI API
 */
export async function generateHospitalInfo(
  params: GenerateHospitalInfoParams
): Promise<HospitalAISuggestion> {
  const { hospitalName, description, location } = params

  // Optional: Use web search to get real information first
  // This requires integrating a web search API (see webSearchService.ts)
  let webSearchData: { address?: string; phone?: string; email?: string; searchResults?: string } | null = null

  if (USE_WEB_SEARCH && hospitalName) {
    try {
      const { searchHospitalInfo } = await import('./webSearchService')
      const searchResult = await searchHospitalInfo(hospitalName)
      if (searchResult.searchResults.length > 0) {
        webSearchData = {
          address: searchResult.address,
          phone: searchResult.phone,
          email: searchResult.email,
          searchResults: searchResult.searchResults.map(r => `${r.title}: ${r.snippet}`).join('\n'),
        }
        console.info('Web search found information:', {
          phone: webSearchData.phone,
          email: webSearchData.email,
          address: webSearchData.address
        })
      }
    } catch (error) {
      console.warn('Web search not available, continuing with AI only:', error)
    }
  }

  // Build the prompt
  let prompt = ''
  if (description) {
    const webSearchContext = webSearchData
      ? `\n\nREAL INFORMATION FROM WEB SEARCH:\n${webSearchData.searchResults}\n\nUse this real information for phone, email, and address fields.`
      : ''

    prompt = `You are a Malaysian hospital information expert. Extract and structure hospital information from the provided text.${webSearchContext}

CRITICAL INSTRUCTIONS:
- You MUST search your knowledge base for REAL information about this hospital
- Do NOT invent, guess, or make up phone numbers, addresses, or emails
- If you don't know the real information, leave the field as empty string ""
- Use your training data and knowledge to find actual contact details
- For Malaysian government hospitals, they typically use @moh.gov.my email domain
- Phone numbers follow Malaysian format: area code (2-3 digits) + 7-8 digit number
- Addresses should include complete street address, postal code, city, and state

Return ONLY a valid JSON object. Follow these rules:

1. hospitalCode: Generate a 3-4 letter uppercase code. Use "H" prefix + key letters from the location/name (e.g., "Hospital Kuala Lumpur" = "HKL", "Hospital Lawas" = "HLW"). NEVER use just location letters without "H" prefix.

2. hospitalName: Extract the exact full hospital name from the text.

3. state: Use the FULL state name in English (e.g., "Sarawak", "Selangor", "Kuala Lumpur", "Johor", "Penang", "Perak", "Kedah", "Kelantan", "Terengganu", "Pahang", "Negeri Sembilan", "Melaka", "Sabah", "Labuan"). Lawas is in "Sarawak". Do NOT use state codes like SAR, KUL, etc.

4. address: Use your knowledge to find the REAL complete address of this hospital. Include street name, postal code, city/town, and state. If you cannot find it, extract from the text or leave as empty string "".

5. phone: Use your knowledge to find the REAL phone number of this hospital. Format: XX-XXXX XXXX or XX-XXX XXXX. If you cannot find the real number, leave as empty string "". Do NOT generate fake numbers.

6. email: Use your knowledge to find the REAL official email address of this hospital. If you cannot find it, generate from hospital name: lowercase, remove "Hospital" word, replace spaces with dots, add @moh.gov.my (e.g., "Hospital Lawas" = "lawas@moh.gov.my").

SEARCH your knowledge for real information about: ${description}

Return ONLY valid JSON, no other text:
{
  "hospitalCode": "string",
  "hospitalName": "string",
  "state": "string (full name, not code)",
  "address": "string",
  "phone": "string",
  "email": "string"
}`
  } else if (hospitalName) {
    const webSearchContext = webSearchData
      ? `\n\nREAL INFORMATION FROM WEB SEARCH:\n${webSearchData.searchResults}\n\nUse this real information for phone, email, and address fields.`
      : ''

    prompt = `You are a Malaysian hospital information expert. Generate hospital information for: "${hospitalName}"${webSearchContext}

IMPORTANT RULES:
- Extract ONLY information that is explicitly mentioned or can be inferred from the hospital name/location
- If information is NOT available, use empty string "" for that field
- Do NOT invent or make up phone numbers, addresses, or emails
- For phone: Only include if you have specific knowledge, otherwise ""
- For email: Generate from hospital name pattern (lowercase, dots between words, @moh.gov.my) OR ""
- For address: Only if location context provides it, otherwise ""
- For state: Determine from location clues (Lawas = Sarawak), use FULL name not code

${location ? `Location context: ${location}` : ''}

Return a JSON object with this exact structure:

1. hospitalCode: Generate a 3-4 letter uppercase code. Use "H" prefix + key letters from the name (e.g., "Hospital Kuala Lumpur" = "HKL", "Hospital Lawas" = "HLW"). For "Hospital Lawas", use "HLW" (H + Lawas).

2. hospitalName: "${hospitalName}"

3. state: Determine the FULL state name in English where this hospital is located. Use full names like "Sarawak", "Selangor", "Kuala Lumpur", "Johor", etc. Lawas is in "Sarawak". Do NOT use state codes.

4. address: Search for and provide the REAL complete address of this hospital. Include street name, postal code, city/town, and state. If you cannot find it, leave as "".

5. phone: Search for and provide the REAL phone number of this hospital. Format: XX-XXXX XXXX or XX-XXX XXXX. If you cannot find the real number, leave as "". Do NOT generate fake numbers.

6. email: Search for and provide the REAL official email address of this hospital. If you cannot find it, generate from hospital name: lowercase, remove "Hospital", replace spaces with dots, add @moh.gov.my. Example: "Hospital Lawas" = "lawas@moh.gov.my".

${location ? `Location context: ${location}` : ''}

SEARCH for real information about "${hospitalName}"

Return ONLY valid JSON, no other text:
{
  "hospitalCode": "string",
  "hospitalName": "string",
  "state": "string (full name, not code)",
  "address": "string",
  "phone": "string",
  "email": "string"
}`
  }

  if (!prompt) {
    // Fallback to pattern matching if no input
    return fallbackGenerate(params)
  }

  // Check if we should skip API entirely
  if (USE_PATTERN_MATCHING_ONLY) {
    console.info('API disabled, using intelligent pattern matching')
    return fallbackGenerate(params)
  }

  // Check if API is available, otherwise use fallback
  if (!isAPIAvailable()) {
    if (rateLimitUntil && Date.now() < rateLimitUntil) {
      const remainingSeconds = Math.ceil((rateLimitUntil - Date.now()) / 1000)
      console.info(`OpenRouter API in cooldown (${remainingSeconds}s remaining), using intelligent pattern matching`)
    } else {
      console.info('OpenRouter API not available, using intelligent pattern matching')
    }
    return fallbackGenerate(params)
  }

  try {
    // Call OpenRouter API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'HOME Hospital Management System',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Lower temperature for more accurate, factual responses
        max_tokens: 1000, // More tokens for complete information
        response_format: { type: 'json_object' }, // Request JSON response format
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        // Set rate limit cooldown
        const retryAfter = response.headers.get('Retry-After')
        const cooldownSeconds = retryAfter ? parseInt(retryAfter, 10) * 1000 : RATE_LIMIT_COOLDOWN
        rateLimitUntil = Date.now() + cooldownSeconds

        const message = retryAfter
          ? `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`
          : 'Rate limit exceeded. Please wait a moment before trying again.'
        throw new Error(`RATE_LIMIT_EXCEEDED: ${message}`)
      }
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`API request failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    // Parse JSON from AI response
    // AI might return JSON wrapped in markdown code blocks
    let jsonText = aiResponse.trim()

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    }

    // Try to extract JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    const parsed = JSON.parse(jsonText) as Partial<HospitalAISuggestion>

    // Clean and validate hospital code - ensure it starts with H if it's a hospital
    let hospitalCode = parsed.hospitalCode || ''
    if (hospitalCode && !hospitalCode.startsWith('H') && (hospitalName || '').toLowerCase().includes('hospital')) {
      // Fix codes that don't start with H
      hospitalCode = 'H' + hospitalCode.replace(/^H/i, '').toUpperCase()
    }
    hospitalCode = hospitalCode.toUpperCase().trim()

    // Validate and convert state to full name
    const stateCodeToName: Record<string, string> = {
      'KUL': 'Kuala Lumpur',
      'SEL': 'Selangor',
      'JOH': 'Johor',
      'PEN': 'Penang',
      'PER': 'Perak',
      'KED': 'Kedah',
      'KDH': 'Kedah',
      'KEL': 'Kelantan',
      'TER': 'Terengganu',
      'PAH': 'Pahang',
      'NEG': 'Negeri Sembilan',
      'MEL': 'Melaka',
      'SAR': 'Sarawak',
      'SAB': 'Sabah',
      'LAB': 'Labuan',
    }

    let state = parsed.state || ''

    // If it's a code, convert to full name
    if (state && stateCodeToName[state.toUpperCase()]) {
      state = stateCodeToName[state.toUpperCase()]
    } else if (state) {
      // Capitalize properly if it's already a name
      state = state
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    } else {
      // Extract from location/description and convert to full name
      const extractedCode = extractState(location || description || '')
      state = stateCodeToName[extractedCode] || ''
    }

    // Clean phone - remove if it looks generated/fake
    let phone = parsed.phone || ''
    if (phone && phone.length < 8) {
      phone = '' // Too short, probably invalid
    }

    // Convert extracted state code to full name if needed
    let finalState = state
    if (!finalState) {
      const extractedCode = extractState(location || description || '')
      const stateCodeToName: Record<string, string> = {
        'KUL': 'Kuala Lumpur',
        'SEL': 'Selangor',
        'JOH': 'Johor',
        'PEN': 'Penang',
        'PER': 'Perak',
        'KED': 'Kedah',
        'KEL': 'Kelantan',
        'TER': 'Terengganu',
        'PAH': 'Pahang',
        'NEG': 'Negeri Sembilan',
        'MEL': 'Melaka',
        'SAR': 'Sarawak',
        'SAB': 'Sabah',
        'LAB': 'Labuan',
      }
      finalState = stateCodeToName[extractedCode] || ''
    }

    // Validate and return
    const result = {
      hospitalCode: hospitalCode || generateHospitalCode(hospitalName || ''),
      hospitalName: parsed.hospitalName || hospitalName || 'New Hospital',
      state: finalState,
      address: (parsed.address || extractAddress(location || description || '') || '').trim() || undefined,
      phone: phone.trim() || undefined,
      email: (parsed.email || generateEmail(parsed.hospitalName || hospitalName || '')).trim() || undefined,
    }

    // Log for debugging
    console.log('AI Response:', aiResponse)
    console.log('Parsed Result:', result)

    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Check if it's a rate limit error
    if (errorMessage.includes('RATE_LIMIT_EXCEEDED') || errorMessage.includes('429')) {
      // Rate limit cooldown is already set above
      console.info('OpenRouter API rate limit exceeded, using intelligent pattern matching')
    } else {
      // Only log non-rate-limit errors as warnings
      console.warn('AI API call failed, using intelligent pattern matching:', error)
    }

    // Fallback to pattern matching if API fails
    return fallbackGenerate(params)
  }
}

/**
 * Fallback function using pattern matching (original implementation)
 */
function fallbackGenerate(params: GenerateHospitalInfoParams): HospitalAISuggestion {
  const { hospitalName, description, location } = params

  // Extract hospital name
  let name = hospitalName || ''
  if (description && !name) {
    const nameMatch = description.match(/(?:Hospital|Klinik|Clinic)\s+([A-Z][A-Za-z\s]+)/i)
    if (nameMatch) {
      name = nameMatch[1].trim()
    } else {
      name = description.split(/[,\n]/)[0].trim()
    }
  }

  // Generate hospital code from name
  const code = generateHospitalCode(name)

  // Extract state from location or description
  const state = extractState(location || description || '')

  // Generate email from name
  const email = generateEmail(name)

  // Extract phone from text, don't generate fake numbers
  const phone = generatePhone(state, location || description || '')

  // Generate address from location/description
  const address = extractAddress(location || description || '')

  // Convert state code to full name
  const stateCodeToName: Record<string, string> = {
    'KUL': 'Kuala Lumpur',
    'SEL': 'Selangor',
    'JOH': 'Johor',
    'PEN': 'Penang',
    'PER': 'Perak',
    'KED': 'Kedah',
    'KEL': 'Kelantan',
    'TER': 'Terengganu',
    'PAH': 'Pahang',
    'NEG': 'Negeri Sembilan',
    'MEL': 'Melaka',
    'SAR': 'Sarawak',
    'SAB': 'Sabah',
    'LAB': 'Labuan',
  }

  const stateCode = state || ''
  const stateName = stateCodeToName[stateCode] || stateCode || ''

  return {
    hospitalCode: code,
    hospitalName: name || 'New Hospital',
    state: stateName,
    address: address || undefined,
    phone: phone || undefined,
    email: email || undefined,
  }
}

/**
 * Generate hospital code from name
 * Malaysian hospital codes typically follow patterns like:
 * - HKL (Hospital Kuala Lumpur)
 * - HUSM (Hospital Universiti Sains Malaysia)
 * - HPP (Hospital Putrajaya)
 */
function generateHospitalCode(name: string): string {
  if (!name) return ''

  // Check if it's a hospital (should start with H)
  const isHospital = name.toLowerCase().includes('hospital')

  // Remove common words
  const cleanName = name
    .replace(/\b(Hospital|Klinik|Clinic|Kesihatan|Health)\b/gi, '')
    .trim()

  // Extract key words
  const words = cleanName.split(/\s+/).filter((w) => w.length > 2)

  if (words.length === 0) return ''

  let code = ''

  // Strategy 1: Use H prefix + first letters of key words (max 3-4 chars total)
  if (isHospital) {
    if (words.length >= 1) {
      // For single word locations, use H + first 2-3 letters
      const firstWord = words[0]
      if (firstWord.length >= 3) {
        code = 'H' + firstWord.substring(0, Math.min(3, firstWord.length)).toUpperCase()
      } else {
        code = 'H' + firstWord.toUpperCase()
      }
    } else if (words.length >= 2) {
      // For multiple words, use H + first letter of each (max 3 letters after H)
      code = 'H' + words
        .slice(0, 3)
        .map((w) => w[0].toUpperCase())
        .join('')
        .substring(0, 3) // Max 4 chars total (H + 3)
    }
  } else {
    // For clinics, use first letters
    if (words.length >= 2) {
      code = words
        .slice(0, 4)
        .map((w) => w[0].toUpperCase())
        .join('')
    } else {
      code = words[0].substring(0, 4).toUpperCase()
    }
  }

  // Ensure minimum length
  if (code.length < 2) {
    code = words[0].substring(0, 3).toUpperCase()
  }

  return code
}

/**
 * Extract Malaysian state from text
 */
function extractState(text: string): string {
  if (!text) return ''

  const states: Record<string, string[]> = {
    KUL: ['kuala lumpur', 'kl', 'wilayah persekutuan'],
    SEL: ['selangor', 'shah alam', 'petaling jaya', 'pj'],
    JOH: ['johor', 'johor bahru', 'jb'],
    PEN: ['pulau pinang', 'penang', 'georgetown'],
    PER: ['perak', 'ipoh', 'taiping'],
    KED: ['kedah', 'alor setar', 'sungai petani'],
    KEL: ['kelantan', 'kota bharu'],
    TER: ['terengganu', 'kuala terengganu'],
    PAH: ['pahang', 'kuantan', 'temerloh'],
    NEG: ['negeri sembilan', 'seremban'],
    MEL: ['melaka', 'malacca'],
    SAR: ['sarawak', 'kuching', 'miri', 'sibu', 'lawas', 'limbang', 'bintulu'],
    SAB: ['sabah', 'kota kinabalu', 'kk'],
    LAB: ['labuan'],
  }

  const lowerText = text.toLowerCase()

  for (const [code, keywords] of Object.entries(states)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return code
    }
  }

  return ''
}

/**
 * Generate email from hospital name
 */
function generateEmail(name: string): string {
  if (!name) return ''

  // Clean name and create email-friendly format
  const emailName = name
    .toLowerCase()
    .replace(/\b(hospital|klinik|clinic)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '.')
    .substring(0, 30)

  return `${emailName}@moh.gov.my`
}

/**
 * Extract phone number from text, or generate placeholder
 */
function generatePhone(_state: string, _text?: string): string {
  // If no phone found in text, don't generate placeholder
  return ''
}

/**
 * Extract address from text
 */
function extractAddress(text: string): string {
  if (!text) return ''

  // Look for address patterns
  const addressPatterns = [
    /(\d+[,\s]+[A-Za-z\s]+(?:Jalan|Street|Road|Lorong|Taman|Kampung)[A-Za-z0-9\s,]+)/i,
    /([A-Za-z\s]+(?:Jalan|Street|Road|Lorong)[A-Za-z0-9\s,]+)/i,
    /(\d{4,5}[,\s]+[A-Za-z\s]+)/i, // Postal code pattern
  ]

  for (const pattern of addressPatterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1].trim()
    }
  }

  // If no pattern found, return first sentence that looks like an address
  const sentences = text.split(/[.\n]/)
  for (const sentence of sentences) {
    if (sentence.length > 20 && sentence.length < 200) {
      return sentence.trim()
    }
  }

  return ''
}

/**
 * Parse hospital information from free-form text using AI
 */
export async function parseHospitalFromText(text: string): Promise<HospitalAISuggestion> {
  return generateHospitalInfo({
    description: text,
  })
}

// =====================================================
// VISION AI DOCUMENT ANALYSIS FOR CATALOG IMPORTS
// =====================================================

export interface ExtractedCatalogItem {
  item_code?: string
  drug_code?: string
  item_name?: string
  drug_name?: string
  generic_name?: string
  brand_name?: string
  sku?: string
  pku?: string
  category?: string
  supplier?: string
  procurement_vote?: 'appl' | 'cc' | 'dp' | 'lp'
  price?: number
  status?: 'active' | 'inactive' | 'discontinued'
  unit_of_measure?: string
  dosage_form?: string
  strength?: string
  min_stock_level?: number
  max_stock_level?: number
  reorder_level?: number
  lead_time_days?: number
  storage_conditions?: string
  is_controlled?: boolean
  requires_prescription?: boolean
  packaging_description?: string
  notes?: string
  confidence?: number
}

export interface DocumentExtractionResult {
  items: ExtractedCatalogItem[]
  total_items: number
  confidence: number
  errors?: string[]
}

/**
 * Convert image file to base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove data URL prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Extract text from PDF using pdf.js from CDN (client-side)
 * Falls back to vision-only analysis if pdf.js is not available
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Check if pdf.js is already loaded
    let pdfjsLib: any = null

    if (typeof window !== 'undefined') {
      // Prefer the version imported at the top of pdfExtractor
      const { pdfjsLib: importedLib } = await import('../utils/pdfExtractor');
      pdfjsLib = importedLib;
    }

    // Loaded via imports in pdfExtractor.ts

    if (!pdfjsLib) {
      throw new Error('PDF.js library not available')
    }

    // Set worker source
    if (pdfjsLib.GlobalWorkerOptions) {
      // Use static path from public folder
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n\n'
    }

    return fullText
  } catch (error) {
    console.warn('PDF text extraction not available, using vision-only analysis:', error)
    // Return empty string - vision AI will handle the PDF directly
    return ''
  }
}

/**
 * Analyze document using Vision AI to extract catalog items
 */
export async function analyzeCatalogDocument(
  file: File,
  catalogType: 'drug' | 'non_drug' | 'contract'
): Promise<DocumentExtractionResult> {
  try {
    const fileType = file.type
    const fileName = file.name.toLowerCase()
    let imageBase64: string | null = null
    let extractedText: string | null = null

    // Handle different file types
    if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
      // Image file - convert to base64 for vision API
      imageBase64 = await fileToBase64(file)
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // PDF file - extract text first, then use vision if needed
      try {
        extractedText = await extractTextFromPDF(file)
        // Also get base64 for vision analysis of PDF pages
        imageBase64 = await fileToBase64(file)
      } catch (error) {
        console.warn('PDF text extraction failed, using vision only:', error)
        imageBase64 = await fileToBase64(file)
      }
    } else {
      throw new Error(`Unsupported file type: ${fileType}. Please upload an image (JPG, PNG) or PDF file.`)
    }

    // Use Vision AI to analyze the document
    const visionModel = 'google/gemini-2.0-flash-exp:free' // Vision-capable model

    // Build prompt based on catalog type
    const catalogTypeLabel = catalogType === 'drug' ? 'drug' : catalogType === 'contract' ? 'contract' : 'non-drug'

    const prompt = `You are an expert at extracting pharmaceutical catalog information from documents.

CRITICAL: Analyze this ${catalogTypeLabel} catalog document and extract ONLY actual product/item data from DATA ROWS, NOT from table headers or column labels.

IMPORTANT RULES:
1. IGNORE table headers completely - do NOT extract column names like "ITEM CODE", "NON-DRUG NAME", "SKU", "PKU", "CATEGORY", "SUPPLIER", "PROCUREMENT VOTE", "STATUS", "PRICE", "ACTIONS" as data
2. IGNORE labels like "APPL", "CC", "DP", "LP" if they appear in the ITEM CODE column - these are procurement vote labels, not item codes
3. IGNORE generic words like "each", "Pack of", "Contract" if they appear as item names - these are not product names
4. ONLY extract actual product/item rows that contain real catalog data
5. Each item MUST have a valid ${catalogType === 'drug' ? 'drug_code' : 'item_code'} that looks like a product code (e.g., "COTTON-500", "SYR5ML", "PARA-500", not "APPL", "LP", "Contract")
6. Each item MUST have a valid ${catalogType === 'drug' ? 'drug_name' : 'item_name'} that is a real product name (e.g., "Cotton Wool 500g", "Syringe 5ml", not "Pack of 100 Pieces", "each", "Pack of 1 set")

For each VALID item row, extract the following information:
${catalogType === 'drug' ? `
- drug_code (Item Code) - REQUIRED - Must be a product identifier, NOT a label like "APPL", "LP", "Contract"
- drug_name (Drug Name) - REQUIRED - Must be a real product name, NOT generic text like "each", "Pack of X"
- generic_name (Generic Name)
- brand_name (Brand Name)
- dosage_form (e.g., tablet, capsule, injection, syrup)
- strength (e.g., 500mg, 10ml)
- unit_of_measure (e.g., tablet, bottle, box)
- sku (Stock Keeping Unit)
- pku (Packing Unit)
- category (Category name - exact name from document)
- supplier (Supplier name - exact name from document)
- procurement_vote (APPL, CC, DP, or LP - from the procurement vote column, NOT from item code)
- price (Price in RM - numeric value only)
- packaging_description (e.g., Box of 100, 500mg/tablet)
- notes (Any additional remarks or catatan)
- status (active, inactive, or discontinued)
- min_stock_level
- max_stock_level
- reorder_level
- lead_time_days
- storage_conditions
- is_controlled (true/false)
- requires_prescription (true/false)
` : `
- item_code (Item Code) - REQUIRED - Must be a product identifier like "COTTON-500", "SYR5ML", NOT labels like "APPL", "LP", "Contract"
- item_name (Non-Drug Name) - REQUIRED - Must be a real product name like "Cotton Wool 500g", "Syringe 5ml", NOT generic text like "each", "Pack of X"
- sku (Stock Keeping Unit)
- pku (Packing Unit)
- category (Category name - exact name from document)
- supplier (Supplier name - exact name from document)
- procurement_vote (APPL, CC, DP, or LP - from the procurement vote column, NOT from item code)
- price (Price in RM - numeric value only)
- packaging_description (e.g., Pack of 10, roll, set)
- notes (Any additional remarks or catatan)
- status (active, inactive, or discontinued)
- unit_of_measure (e.g., unit, box, pack)
- min_stock_level
- max_stock_level
- reorder_level
`}

VALIDATION RULES:
- item_code/drug_code: Must NOT be "APPL", "CC", "DP", "LP", "Contract", or any column header text
- item_name/drug_name: Must NOT be "each", "Pack of", "Contract", or any generic descriptive text
- If an item_code looks like a label or header, SKIP that row entirely
- If an item_name is just a unit description or generic text, SKIP that row entirely
- Only include rows where BOTH item_code and item_name are valid product identifiers/names

EXTRACTION PROCESS:
1. Identify the table structure in the document
2. Locate the DATA ROWS (not header row)
3. For each data row:
   a. Check if item_code is valid (not a label/header)
   b. Check if item_name is valid (not generic text)
   c. If both are valid, extract all available fields
   d. If either is invalid, SKIP the entire row
4. Provide confidence score (0-1) for each extracted item

Return ONLY a valid JSON object with this exact structure:
{
  "items": [
    {
      "${catalogType === 'drug' ? 'drug_code' : 'item_code'}": "COTTON-500",
      "${catalogType === 'drug' ? 'drug_name' : 'item_name'}": "Cotton Wool 500g",
      ...other fields...
      "confidence": 0.95
    }
  ],
  "total_items": number,
  "confidence": 0.90
}

IMPORTANT: 
- Return ONLY the JSON object, no other text or markdown formatting
- DO NOT include rows where item_code is "APPL", "LP", "Contract", or any header text
- DO NOT include rows where item_name is "each", "Pack of X", or generic descriptive text
- Only extract rows with valid product codes and product names`

    // Prepare messages for vision API
    const messages: any[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ]

    // Add image if available
    if (imageBase64) {
      // Determine image format from base64 or file type
      const imageFormat = fileType.includes('png') ? 'image/png' :
        fileType.includes('jpg') || fileType.includes('jpeg') ? 'image/jpeg' :
          fileType.includes('gif') ? 'image/gif' :
            fileType.includes('webp') ? 'image/webp' :
              'image/jpeg' // default

      messages[0].content.push({
        type: 'image_url',
        image_url: {
          url: `data:${imageFormat};base64,${imageBase64}`,
        },
      })
    }

    // If we have extracted text from PDF, include it in the prompt
    if (extractedText && extractedText.length > 0) {
      messages[0].content[0].text += `\n\nEXTRACTED TEXT FROM PDF:\n${extractedText.substring(0, 5000)}\n\nUse this text to help extract the information.`
    }

    // Call OpenRouter Vision API
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'HOME Hospital Management System',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: visionModel,
        messages,
        temperature: 0.1, // Low temperature for accurate extraction
        max_tokens: 4000, // More tokens for multiple items
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const cooldownSeconds = retryAfter ? parseInt(retryAfter, 10) * 1000 : RATE_LIMIT_COOLDOWN
        rateLimitUntil = Date.now() + cooldownSeconds
        throw new Error(`Rate limit exceeded. Please wait ${retryAfter || 'a moment'} before trying again.`)
      }
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`Vision API request failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from Vision AI')
    }

    // Parse JSON from AI response
    let jsonText = aiResponse.trim()

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    }

    // Try to extract JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    const parsed = JSON.parse(jsonText) as {
      items?: ExtractedCatalogItem[]
      total_items?: number
      confidence?: number
    }

    // Validate and normalize extracted items
    const items: ExtractedCatalogItem[] = (parsed.items || []).map((item) => {
      const normalized: ExtractedCatalogItem = { ...item }

      // Normalize procurement_vote
      if (normalized.procurement_vote) {
        const vote = String(normalized.procurement_vote).toLowerCase()
        if (['appl', 'cc', 'dp', 'lp'].includes(vote)) {
          normalized.procurement_vote = vote as any
        } else {
          delete normalized.procurement_vote
        }
      }

      // Normalize status
      if (normalized.status) {
        const status = String(normalized.status).toLowerCase()
        if (['active', 'inactive', 'discontinued'].includes(status)) {
          normalized.status = status as any
        } else {
          normalized.status = 'active' // default
        }
      }

      // Ensure price is a number
      if (normalized.price && typeof normalized.price === 'string') {
        normalized.price = parseFloat(String(normalized.price).replace(/[^\d.-]/g, '')) || undefined
      }

      // Ensure numeric fields are numbers
      if (normalized.min_stock_level && typeof normalized.min_stock_level === 'string') {
        normalized.min_stock_level = parseInt(normalized.min_stock_level) || 0
      }
      if (normalized.max_stock_level && typeof normalized.max_stock_level === 'string') {
        normalized.max_stock_level = parseInt(normalized.max_stock_level) || undefined
      }
      if (normalized.reorder_level && typeof normalized.reorder_level === 'string') {
        normalized.reorder_level = parseInt(normalized.reorder_level) || undefined
      }
      if (normalized.lead_time_days && typeof normalized.lead_time_days === 'string') {
        normalized.lead_time_days = parseInt(normalized.lead_time_days) || undefined
      }

      return normalized
    })

    // Filter out invalid items with strict validation
    const invalidItemCodes = ['APPL', 'CC', 'DP', 'LP', 'Contract', 'ITEM CODE', 'ITEM_CODE', 'item code', 'item_code']
    const invalidItemNames = ['each', 'Pack of', 'Contract', 'NON-DRUG NAME', 'NON_DRUG_NAME', 'non-drug name', 'non_drug_name']

    const validItems = items.filter((item) => {
      // Check required fields exist
      const hasRequiredFields = catalogType === 'drug'
        ? (item.drug_code && item.drug_name)
        : (item.item_code && item.item_name)

      if (!hasRequiredFields) {
        return false
      }

      // Get the code and name for validation
      const code = catalogType === 'drug' ? item.drug_code : item.item_code
      const name = catalogType === 'drug' ? item.drug_name : item.item_name

      if (!code || !name) {
        return false
      }

      // Validate item code - must NOT be a label or header
      const codeStr = String(code).trim()
      if (invalidItemCodes.some(invalid => codeStr.toUpperCase() === invalid.toUpperCase())) {
        return false
      }

      // Validate item name - must NOT be generic text or header
      const nameStr = String(name).trim()
      if (invalidItemNames.some(invalid => nameStr.toLowerCase().includes(invalid.toLowerCase()))) {
        // Check if it's exactly the invalid name or starts with it
        if (nameStr.toLowerCase() === 'each' ||
          nameStr.toLowerCase().startsWith('pack of') ||
          nameStr.toLowerCase() === 'contract') {
          return false
        }
      }

      // Additional validation: item code should look like a product code
      // Should contain alphanumeric characters, hyphens, or underscores
      // Should NOT be just a single word that's a common label
      if (codeStr.length < 2) {
        return false
      }

      // Item name should be more than just a unit or generic description
      if (nameStr.length < 3) {
        return false
      }

      // Reject if name is just a number or single character
      if (/^\d+$/.test(nameStr) || nameStr.length <= 2) {
        return false
      }

      return true
    })

    // Log filtered items for debugging
    const filteredCount = items.length - validItems.length
    if (filteredCount > 0) {
      const filteredItems = items.filter(item => {
        const code = catalogType === 'drug' ? item.drug_code : item.item_code
        const name = catalogType === 'drug' ? item.drug_name : item.item_name
        const codeStr = code ? String(code).trim() : ''
        const nameStr = name ? String(name).trim() : ''

        const invalidCodes = ['APPL', 'CC', 'DP', 'LP', 'Contract', 'ITEM CODE', 'ITEM_CODE']
        const invalidNames = ['each', 'Pack of', 'Contract']

        return !code || !name ||
          invalidCodes.some(inv => codeStr.toUpperCase() === inv.toUpperCase()) ||
          invalidNames.some(inv => nameStr.toLowerCase().includes(inv.toLowerCase()))
      })

      console.warn(`Filtered out ${filteredCount} invalid items:`, filteredItems.map(item => ({
        code: catalogType === 'drug' ? item.drug_code : item.item_code,
        name: catalogType === 'drug' ? item.drug_name : item.item_name
      })))
    }

    return {
      items: validItems,
      total_items: validItems.length,
      confidence: parsed.confidence || 0.8,
      errors: filteredCount > 0
        ? [`Filtered out ${filteredCount} invalid item(s) (headers, labels, or missing required fields). Only valid product data was imported.`]
        : undefined,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error analyzing catalog document:', error)

    return {
      items: [],
      total_items: 0,
      confidence: 0,
      errors: [errorMessage],
    }
  }
}