import fs from 'fs';
import path from 'path';

const filePath = 'src/pages/pharmacy/procurement/GoodsReceivingForm.tsx';
const content = fs.readFileSync(filePath, 'utf8');

try {
  const stack = [];
  const map = { '{': '}', '[': ']', '(': ')' };
  const revMap = { '}': '{', ']': '[', ')': '(' };
  
  const lines = content.split('\n');
  let currentLine = 1;
  let currentCol = 1;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '\n') {
      currentLine++;
      currentCol = 1;
    } else {
      currentCol++;
    }

    // Skip comments and strings to be more accurate (optional but helpful)
    // For now let's just do a raw count as most JSX errors are in the structure
    
    if (map[char]) {
      stack.push({ char, line: currentLine, col: currentCol });
    } else if (revMap[char]) {
      const last = stack.pop();
      if (!last || last.char !== revMap[char]) {
        console.error(`Mismatched ${char} at line ${currentLine}, col ${currentCol}`);
        if (last) console.error(`Expected closing for ${last.char} from line ${last.line}, col ${last.col}`);
        process.exit(1);
      }
    }
  }
  
  if (stack.length > 0) {
    const last = stack.pop();
    console.error(`Unclosed ${last.char} from line ${last.line}, col ${last.col}`);
    process.exit(1);
  }
  
  console.log('Brackets match perfectly!');
} catch (err) {
  console.error(err);
  process.exit(1);
}
