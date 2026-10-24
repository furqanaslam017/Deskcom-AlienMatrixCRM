import fs from "node:fs";

async function translateText(text, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=" + encodeURIComponent(text);
      const res = await fetch(url);
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data[0]?.map((item) => item[0]).join("") || text;
    } catch (err) {
      if (attempt === retries) {
        return text;
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return text;
}

async function main() {
  const enCatalogPath = "lib/i18n/traducoes/en.json";
  const enCatalog = JSON.parse(fs.readFileSync(enCatalogPath, "utf8"));
  const missing = JSON.parse(fs.readFileSync("scripts/missing-translations.json", "utf8"));

  console.log(`Starting translation of ${missing.length} missing keys...`);

  const batchSize = 5;
  let translatedCount = 0;

  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (item) => {
        if (!enCatalog[item.pt]) {
          const translated = await translateText(item.pt);
          enCatalog[item.pt] = translated;
          translatedCount++;
        }
      })
    );
    if ((i + batchSize) % 50 === 0 || i + batchSize >= missing.length) {
      console.log(`Progress: ${Math.min(i + batchSize, missing.length)} / ${missing.length} keys processed...`);
      fs.writeFileSync(enCatalogPath, JSON.stringify(enCatalog, null, 2), "utf8");
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  fs.writeFileSync(enCatalogPath, JSON.stringify(enCatalog, null, 2), "utf8");
  console.log(`✅ Translation complete! Total keys now in en.json: ${Object.keys(enCatalog).length}`);
}

main().catch(console.error);
