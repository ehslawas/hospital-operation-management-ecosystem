import fs from 'fs';

const content = fs.readFileSync('c:\\Users\\60113\\Downloads\\My Home\\hospital-operation-management-ecosystem\\src\\pages\\pharmacy\\financial\\APPLAllocationPage.tsx', 'utf8');

const importRegex = /import\s+\{([^}]+)\}\s+from\s+'lucide-react'/;
const match = content.match(importRegex);
const importedIcons = match ? match[1].split(',').map(s => s.trim()).filter(s => s) : [];

const componentRegex = /<([A-Z][a-zA-Z0-9]*)/g;
const usedComponents = new Set<string>();
let m;
while ((m = componentRegex.exec(content)) !== null) {
    usedComponents.add(m[1]);
}

const lucideIcons = [
    'Search', 'Filter', 'ChevronDown', 'Download', 'Plus', 'MoreVertical', 
    'Calendar', 'DollarSign', 'Package', 'TrendingUp', 'ChevronRight',
    'Clock', 'CheckCircle2', 'AlertCircle', 'XCircle', 'Info', 'TrendingDown',
    'BarChart2', 'PieChart', 'X', 'FileText', 'AlertTriangle', 'Wallet', 'RefreshCw'
];

console.log('Imported Icons:', importedIcons);
console.log('Used Components:', Array.from(usedComponents));

const missingIcons = Array.from(usedComponents).filter(c => {
    // If it's a known lucide icon but not in importedIcons
    return lucideIcons.includes(c) && !importedIcons.includes(c);
});

console.log('Missing Icons:', missingIcons);
