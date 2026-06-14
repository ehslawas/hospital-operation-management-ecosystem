const fs = require('fs');
const path = require('path');
try {
    const filePath = path.join(process.cwd(), 'public', '512px-Jata_MalaysiaV2.svg.png');
    if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const base64 = fileBuffer.toString('base64');
        const chunks = base64.match(/.{1,76}/g).join('\n');
        fs.writeFileSync('logo.txt', chunks);
        console.log('Logo written to logo.txt');
    } else {
        console.log('File not found at:', filePath);
    }
} catch (error) {
    console.error('Error reading file:', error);
}
