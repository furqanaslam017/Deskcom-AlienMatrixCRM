import json
import time
import urllib.parse
import urllib.request
import sys

def translate_text(text):
    try:
        q = urllib.parse.quote(text)
        url = f"https://api.mymemory.translated.net/get?q={q}&langpair=pt|en"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            res = data.get("responseData", {}).get("translatedText")
            if res and not res.startswith("MYMEMORY WARNING"):
                return res
    except Exception as e:
        pass
    return None

def main():
    en_path = "lib/i18n/traducoes/en.json"
    with open(en_path, "r", encoding="utf-8") as f:
        en_catalog = json.load(f)

    with open("scripts/missing-translations.json", "r", encoding="utf-8") as f:
        missing = json.load(f)

    print(f"Total missing in queue: {len(missing)}")
    translated_count = 0

    for i, item in enumerate(missing):
        pt = item["pt"]
        if pt in en_catalog and en_catalog[pt] != pt:
            continue

        translated = translate_text(pt)
        if not translated:
            # Fallback heuristic
            translated = item.get("es", pt)

        en_catalog[pt] = translated
        translated_count += 1

        if (i + 1) % 25 == 0 or (i + 1) == len(missing):
            print(f"Progress: {i + 1} / {len(missing)} (Newly translated: {translated_count})")
            with open(en_path, "w", encoding="utf-8") as f:
                json.dump(en_catalog, f, indent=2, ensure_ascii=False)

        time.sleep(0.08)

    with open(en_path, "w", encoding="utf-8") as f:
        json.dump(en_catalog, f, indent=2, ensure_ascii=False)

    print(f"Done! en.json now has {len(en_catalog)} total translation keys.")

if __name__ == "__main__":
    main()
