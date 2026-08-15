import jsPDF from 'jspdf'

let cachedLogoBase64: string | null = null

export async function getHospitalLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64) return cachedLogoBase64
  try {
    const res = await fetch('/512px-Jata_MalaysiaV2.svg.png')
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        cachedLogoBase64 = reader.result as string
        resolve(cachedLogoBase64)
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to load Jata Malaysia logo:', error)
    return null
  }
}

export interface DrawHeaderOptions {
  startY?: number
  margin?: number
  logoBase64?: string | null
}

/**
 * Draws the official Hospital Lawas header on a jsPDF instance matching Photo 2 specification.
 * 
 * Layout:
 * - Left: Official Jata Negara Malaysian Crest logo
 * - Left-aligned text block: HOSPITAL LAWAS + address
 * - Right-aligned contact block: Telefon, Faks, Email
 * - Bottom: Subtle horizontal divider line
 * 
 * Returns the Y coordinate below the divider line ready for subsequent content.
 */
export async function drawHospitalHeader(
  doc: jsPDF,
  options: DrawHeaderOptions = {}
): Promise<number> {
  const margin = options.margin ?? 15
  const startY = options.startY ?? 12
  const pageWidth = doc.internal.pageSize.getWidth()

  // Load logo if not supplied
  const logoData = options.logoBase64 !== undefined 
    ? options.logoBase64 
    : await getHospitalLogoBase64()

  // 1. Draw Crest Logo on left
  const logoWidth = 20
  const logoHeight = 16
  const logoY = startY + 1

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, logoY, logoWidth, logoHeight)
    } catch (e) {
      console.warn('Could not add header logo to PDF:', e)
    }
  }

  // 2. Hospital & Address Block (Immediately next to logo)
  const textX = margin + (logoData ? logoWidth + 5 : 0)
  let addressY = startY + 4

  // HOSPITAL LAWAS
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(30, 41, 59) // Dark slate / dark gray #1e293b
  doc.text('HOSPITAL LAWAS', textX, addressY)

  addressY += 4.5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(71, 85, 105) // Slate 600

  // Address lines matching photo 2 layout
  doc.text('Jalan Hospital,', textX, addressY)
  addressY += 4
  doc.text('98850 Lawas,', textX, addressY)
  addressY += 4
  doc.text('Sarawak,', textX, addressY)
  addressY += 4
  doc.text('Malaysia.', textX, addressY)

  // 3. Contact Details Block (Right side)
  const contactX = pageWidth - margin - 52
  let contactY = startY + 10

  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)

  // Telefon: 085-283781
  doc.setFont('helvetica', 'bold')
  doc.text('Telefon:', contactX, contactY)
  doc.setFont('helvetica', 'normal')
  doc.text('085-283781', contactX + 14, contactY)

  // Faks: 085-285993
  contactY += 4.2
  doc.setFont('helvetica', 'bold')
  doc.text('Faks:', contactX, contactY)
  doc.setFont('helvetica', 'normal')
  doc.text('085-285993', contactX + 14, contactY)

  // Email: hosp_lawas@moh.gov.my
  contactY += 4.2
  doc.setFont('helvetica', 'bold')
  doc.text('Email:', contactX, contactY)
  doc.setFont('helvetica', 'normal')
  doc.text('hosp_lawas@moh.gov.my', contactX + 14, contactY)

  // 4. Horizontal Divider Line
  const dividerY = Math.max(addressY, contactY) + 5
  doc.setDrawColor(203, 213, 225) // Light slate gray border (#cbd5e1)
  doc.setLineWidth(0.5)
  doc.line(margin, dividerY, pageWidth - margin, dividerY)

  return dividerY + 6 // Return Y position after header
}
