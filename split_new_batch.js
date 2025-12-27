import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptContent = fs.readFileSync(path.join(__dirname, 'review_script_new_batch.txt'), 'utf8');
const lines = scriptContent.split('\n').filter(line => line.trim());

const outputDir = path.join(__dirname, 'review_batch_parts');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const linesPerFile = 10;
for (let i = 0; i < lines.length; i += linesPerFile) {
    const chunk = lines.slice(i, i + linesPerFile);
    const fileNum = Math.floor(i / linesPerFile) + 1;
    const fileName = `review_batch_part_${fileNum.toString().padStart(2, '0')}.txt`;
    fs.writeFileSync(path.join(outputDir, fileName), chunk.join('\n'));
}

console.log(`Split ${lines.length} lines into ${Math.ceil(lines.length / linesPerFile)} files in 'review_batch_parts' folder.`);
