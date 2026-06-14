const fs = require('fs');

const baseFilePath = "c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\scratch\\02ab1e6_utf8.tsx";
const content = fs.readFileSync(baseFilePath, 'utf8');
const lines = content.split('\n');

console.log("Lines in base file:", lines.length);
console.log("Includes Step 37 string:", content.includes("LOWER SECTION: Live Cylinder QR Registry Card"));
