const fs = require('fs');

const content = fs.readFileSync('src/pages/pharmacy/oxygen/OxygenDashboardPage.tsx', 'utf8');
const lines = content.split('\n');

// Analyze lines from 1548 to 2060
const block = lines.slice(1547, 2060);

const stack = [];
for (let i = 0; i < block.length; i++) {
  const line = block[i];
  const absoluteLine = 1548 + i;
  
  // Find all JSX tags on this line
  // We can use a regex to match opening tags <Name ...> and closing tags </Name>
  // Note: we should skip self-closing tags like <img ... />, <Database ... />, etc.
  const regex = /<\/?([a-zA-Z0-9]+)(?:\s+[^>]*?)?(\/?)>/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    const isClose = match[0].startsWith('</');
    const isSelfClose = match[2] === '/';
    const tagName = match[1];
    
    // Ignore native lowercase tags like img, input, hr, br, etc. that might be self-closing
    if (['img', 'input', 'hr', 'br', 'link', 'meta'].includes(tagName.toLowerCase())) {
      continue;
    }
    
    if (isSelfClose) {
      continue;
    }
    
    if (isClose) {
      if (stack.length > 0) {
        const top = stack.pop();
        if (top.name !== tagName) {
          console.log(`Line ${absoluteLine}: Mismatched closing tag </${tagName}>. Expected </${top.name}> (opened on line ${top.line})`);
        }
      } else {
        console.log(`Line ${absoluteLine}: Unexpected closing tag </${tagName}>`);
      }
    } else {
      stack.push({ name: tagName, line: absoluteLine });
    }
  }
}

console.log("Remaining unclosed tags in stack:");
stack.forEach(item => {
  console.log(`  <${item.name}> opened on line ${item.line}`);
});
