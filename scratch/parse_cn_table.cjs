const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:\\Users\\60113\\.gemini\\antigravity\\brain\\7b29d474-e3d0-4c43-94bc-dfb72de8a612\\.system_generated\\steps\\3013\\output.txt', 'utf8'));
const table = data.tables.find(t => t.name === 'public.pharmacy_credit_notes');
console.log(JSON.stringify(table, null, 2));
