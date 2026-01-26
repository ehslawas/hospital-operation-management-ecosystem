import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * Generates PDF from a rendered HTML element
 * @param element The HTML element containing the document (usually ReminderLetterTemplate)
 * @param _lpoNumber Unused parameter kept for API compatibility
 */
export async function generateLpoPdf(element: HTMLElement, _lpoNumber: string): Promise<Blob> {
    try {
        const canvas = await html2canvas(element, {
            scale: 3, // High scale for crisp text
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff',
            allowTaint: true,
            imageTimeout: 15000,
            onclone: (clonedDoc) => {
                const el = clonedDoc.getElementById(element.id)
                if (el) {
                    el.style.transform = 'none'
                    el.style.margin = '0'
                    // Apply Standard Printing Margins (approx 20mm sides, 15mm top/bottom)
                    // This ensures the content looks "large" and uses the A4 page correctly
                    el.style.padding = '57px 75px'
                    el.style.width = '794px' // Standard A4 width at 96 DPI
                    el.style.backgroundColor = 'white'
                }
            }
        })

        const imgData = canvas.toDataURL('image/jpeg', 1.0)
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        })

        const pdfWidth = 210
        const imgWidth = pdfWidth
        const imgHeight = (canvas.height * pdfWidth) / canvas.width

        // Position at 0,0 since margins are internal to the canvas capture
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST')

        return pdf.output('blob')
    } catch (error) {
        console.error('Error generating PDF:', error)
        throw error
    }
}
