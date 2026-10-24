import { chromium } from "@playwright/test";

async function test() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/login");
  await page.locator("#email").fill("admin@whitehouseforexacademy.com");
  await page.locator("#password").fill("Furqan@17**");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  console.log("Clicked Entrar, waiting for app URL...");
  await page.waitForURL("**/app/**", { timeout: 60000 });
  console.log("Successfully navigated to:", page.url());
  await browser.close();
}
test().catch(console.error);
