const fs = require('fs');

const filePath = process.argv[2];
if (!filePath) {
    console.error("❌ Please provide the path to your CSV file.");
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

let sql = '';
let count = 0;

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const firstComma = line.indexOf(',');
    if (firstComma === -1) continue;

    let key = line.slice(0, firstComma).trim();
    let val = line.slice(firstComma + 1).trim();

    if (key.startsWith('"') && key.endsWith('"')) {
        key = key.slice(1, -1);
    }
    if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
    }

    if (key && val) {
        const safeKey = key.replace(/'/g, "''");
        const safeVal = val.replace(/'/g, "''");
        sql += `INSERT INTO kv_store (key, value) VALUES ('${safeKey}', '${safeVal}') ON CONFLICT(key) DO UPDATE SET value='${safeVal}';\n`;
        count++;
    }
}

fs.writeFileSync('import.sql', sql);
console.log(`✅ Converted ${count} demon records into import.sql!`);
