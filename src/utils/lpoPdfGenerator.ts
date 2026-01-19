import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { LPOWithRelations } from '@/types/pharmacy/procurementNew'
// import { LpoDocumentTemplate } from '@/components/procurement/LpoDocumentTemplate' 
// We can't import React component to use in non-React utility easily without rendering it to DOM.
// So we'll assume the component is rendered in the UI and passed as an HTMLElement ref.

/**
 * Generates LPO PDF from a rendered HTML element
 * @param element The HTML element containing the LPO document (usually LpoDocumentTemplate)
 * @param lpoNumber The LPO number for filename
 */
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
        const pdfHeight = 297

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
