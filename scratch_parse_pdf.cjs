const PDFParser = require('pdf2json');
const fs = require('fs');

const pdfPath = process.argv[2];
const pdfParser = new PDFParser(null, 1);

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    let allText = '';
    if (pdfData.Pages) {
        pdfData.Pages.forEach((page, pageIdx) => {
            allText += `\n=== PAGE ${pageIdx + 1} ===\n`;
            if (page.Texts) {
                page.Texts.forEach(textItem => {
                    if (textItem.R) {
                        textItem.R.forEach(r => {
                            if (r.T) {
                                try {
                                    allText += decodeURIComponent(r.T) + ' ';
                                } catch(e) {
                                    allText += r.T + ' ';
                                }
                            }
                        });
                    }
                });
                allText += '\n';
            }
        });
    }
    const outFile = pdfPath.replace('.pdf', '_text.txt');
    fs.writeFileSync(outFile, allText);
    console.log('Saved to:', outFile);
    console.log('Total chars:', allText.length);
    process.stdout.write(allText.substring(0, 8000));
});

pdfParser.loadPDF(pdfPath);
