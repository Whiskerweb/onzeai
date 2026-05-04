import puppeteer from "puppeteer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const port = process.env.PORT ?? "3001";
const out = path.join(root, "docs/design-references/clone-desktop.png");

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:${port}/`, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 1500));
  const fullPath = out.replace(".png", ".jpg");
  await page.screenshot({
    path: fullPath,
    fullPage: true,
    type: "jpeg",
    quality: 80,
    captureBeyondViewport: true,
  });
  console.log("saved", fullPath);
  const viewportPath = out.replace(".png", "-viewport.jpg");
  await page.screenshot({ path: viewportPath, type: "jpeg", quality: 80 });
  console.log("saved", viewportPath);
} finally {
  await browser.close();
}
