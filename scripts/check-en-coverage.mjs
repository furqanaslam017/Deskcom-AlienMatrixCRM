import fs from "node:fs";

const en = JSON.parse(fs.readFileSync("lib/i18n/traducoes/en.json", "utf8"));
const dicFile = fs.readFileSync("lib/i18n/dicionario.ts", "utf8");
const regex = /"([^"\\]*(?:\\.[^"\\]*)*)":\s*\{\s*es:/g;
let match;
let total = 0;
let inEn = 0;
const missing = [];
while ((match = regex.exec(dicFile)) !== null) {
  total++;
  const key = match[1].replace(/\\"/g, '"');
  if (en[key]) {
    inEn++;
  } else {
    missing.push(key);
  }
}
console.log("Total dic keys:", total, "Found in en.json:", inEn, "Percentage:", (inEn / total * 100).toFixed(1) + "%");
console.log("Sample missing keys (first 10):", missing.slice(0, 10));
