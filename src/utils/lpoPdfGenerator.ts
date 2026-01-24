import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * Generates PDF from a rendered HTML element
 * @param element The HTML element containing the document (usually PurchaseOrderTemplate)
 * @param lpoNumber The LPO/PO number for filename
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateLpoPdf(element: HTMLElement, lpoNumber: string): Promise<Blob> {
    try {
        const canvas = await html2canvas(element, {
            scale: 2, // Higher scale for better quality
            logging: false,
            useCORS: true,
            backgroundColor: '#ffffff'
        })

        const imgData = canvas.toDataURL('image/jpeg', 1.0)

        // A4 dimensions in mm
        const pdfWidth = 210
        // const pdfHeight = 297

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        })

        const imgWidth = pdfWidth
        const imgHeight = (canvas.height * pdfWidth) / canvas.width

        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight)

        return pdf.output('blob')
    } catch (error) {
        console.error('Error generating PDF:', error)
        throw error
    }
}
