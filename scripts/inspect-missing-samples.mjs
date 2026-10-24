import fs from "node:fs";

const missing = JSON.parse(fs.readFileSync("scripts/missing-translations.json", "utf8"));
console.log("Count:", missing.length);
for (let i = 0; i < Math.min(25, missing.length); i++) {
  console.log(`${i + 1}. [PT]: ${missing[i].pt}\n   [ES]: ${missing[i].es}`);
}
