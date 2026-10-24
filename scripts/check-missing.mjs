import fs from "node:fs";

const en = JSON.parse(fs.readFileSync("lib/i18n/traducoes/en.json", "utf8"));
const dicFile = fs.readFileSync("lib/i18n/dicionario.ts", "utf8");
const regex = /"([^"\\]*(?:\\.[^"\\]*)*)":\s*\{\s*es:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
let match;
const missing = [];
while ((match = regex.exec(dicFile)) !== null) {
  const pt = match[1].replace(/\\"/g, '"');
  const es = match[2].replace(/\\"/g, '"');
  if (!en[pt]) {
    missing.push({ pt, es });
  }
}

fs.writeFileSync("scripts/missing-translations.json", JSON.stringify(missing, null, 2), "utf8");
console.log("Exported missing items count:", missing.length);
