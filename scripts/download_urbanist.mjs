import fs from "node:fs";
import path from "node:path";

async function main() {
  const cssUrl = "https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700&display=swap";
  const res = await fetch(cssUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });

  const css = await res.text();
  console.log("Fetched CSS. Parsing font urls...");

  // Match font-weight, style, and src: url(...)
  const blocks = css.split("@font-face");
  const fonts = [];

  for (const block of blocks) {
    if (!block.includes("font-family: 'Urbanist'")) continue;
    // Latin subset
    if (!block.includes("/* latin */")) continue;

    const weightMatch = block.match(/font-weight:\s*(\d+)/);
    const urlMatch = block.match(/src:\s*url\((https:\/\/[^)]+\.woff2)\)/);

    if (weightMatch && urlMatch) {
      fonts.push({ weight: weightMatch[1], url: urlMatch[1] });
    }
  }

  console.log("Found fonts:", fonts);

  const outDir = path.resolve("app/fonts");
  for (const f of fonts) {
    const filename = `urbanist-${f.weight}-latin.woff2`;
    const target = path.join(outDir, filename);
    const fontRes = await fetch(f.url);
    const buffer = await fontRes.arrayBuffer();
    fs.writeFileSync(target, Buffer.from(buffer));
    console.log(`Saved ${filename} (${buffer.byteLength} bytes)`);
  }

  console.log("All Urbanist fonts downloaded successfully!");
}

main().catch(console.error);
