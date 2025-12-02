#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cjsDir = path.join(__dirname, '..', 'dist', 'cjs');

if (!fs.existsSync(cjsDir)) {
    process.exit(0);
}

for (const entry of fs.readdirSync(cjsDir)) {
    if (!entry.endsWith('.js')) continue;
    const filePath = path.join(cjsDir, entry);
    const content = fs.readFileSync(filePath, 'utf8');
    const hasDefaultExport = content.includes('exports.default');
    if (!hasDefaultExport || content.includes('module.exports = exports.default')) continue;
    fs.writeFileSync(filePath, `${content}\nmodule.exports = exports.default;\n`, 'utf8');
}
