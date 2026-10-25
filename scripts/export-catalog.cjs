// Exporta el catálogo a JSON para generar imágenes. Requiere: npx tsc (ver README).
// Uso: npx tsc --outDir .tmp --module commonjs --target es2020 --skipLibCheck src/app/data/pc-components.ts && node scripts/export-catalog.cjs > catalog.json
const { pcComponents } = require('../.tmp/data/pc-components.js');
console.log(JSON.stringify(pcComponents));
