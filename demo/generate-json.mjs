import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COUNT = parseInt(process.env.COUNT || '200000', 10);
const OUTPUT = path.join(__dirname, 'public', 'data.json');

const records = [];
for (let i = 0; i < COUNT; i++) {
  records.push({
    id: i,
    creditScore: Math.floor(Math.random() * 851),
    claimsHistory: Math.floor(Math.random() * 20),
    vehicleValue: Math.floor(Math.random() * 100000) + 5000,
    riskFlags: Math.floor(Math.random() * 10),
  });
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(records));
console.log(`Generated ${COUNT.toLocaleString()} records → ${OUTPUT}`);
