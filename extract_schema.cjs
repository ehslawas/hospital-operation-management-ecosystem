const fs = require('fs');
const filePath = 'C:\\Users\\60113\\.gemini\\antigravity\\brain\\f155755c-ecdb-4189-a1d6-b37bb112995c\\.system_generated\\steps\\918\\output.txt';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const table = data.tables.find(t => t.name.includes('pharmacy_purchase_order_items'));
console.log(JSON.stringify(table, null, 2));
