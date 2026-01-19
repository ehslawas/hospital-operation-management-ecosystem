const fs = require('fs');
const path = require('path');
try {
    const filePath = path.join(process.cwd(), 'public', '512px-Jata_MalaysiaV2.svg.png');
    if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        console.log(fileBuffer.toString('base64'));
    } else {
        console.log('File not found at:', filePath);
    }
} catch (error) {
    console.error('Error reading file:', error);
}
