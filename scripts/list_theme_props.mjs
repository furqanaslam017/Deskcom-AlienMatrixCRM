import fs from "node:fs";

const css = fs.readFileSync("app/globals.css", "utf8");

function getProps(selector) {
  const lines = css.split("\n");
  const idx = lines.findIndex((l) => l.trim() === selector + " {");
  const props = [];
  for (let i = idx + 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l === "}") break;
    if (l.startsWith("--")) props.push(l.split(":")[0].trim());
  }
  return props;
}

const darkProps = getProps("[data-theme=\"dark\"]");
console.log("data-theme=dark props count:", darkProps.length);
console.log(darkProps);
