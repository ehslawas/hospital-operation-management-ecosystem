
const fs = require('fs');
const filePath = "C:\\Users\\60113\\.gemini\\antigravity\\brain\\505c4646-c5c4-4269-8c55-8dd30691fd53\\.system_generated\\steps\\566\\output.txt";
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const table = data.tables.find(t => t.name === 'public.pharmacy_purchase_orders');
console.log(JSON.stringify(table, null, 2));
