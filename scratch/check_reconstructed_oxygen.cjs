const fs = require('fs');

const path = "scratch/reconstructed_oxygen.tsx";
if (fs.existsSync(path)) {
  const content = fs.readFileSync(path, 'utf8');
  console.log("Length:", content.length);
  console.log("Lines:", content.split('\n').length);
  console.log("Starts with:", JSON.stringify(content.substring(0, 100)));
  console.log("Ends with:", JSON.stringify(content.substring(content.length - 100)));
} else {
  console.log("Does not exist");
}
