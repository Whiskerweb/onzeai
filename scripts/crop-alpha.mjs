import puppeteer from "puppeteer";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const targets = [
  "public/onze/coaches/dembefric.png",
  "public/onze/coaches/belligagne.png",
  "public/onze/coaches/vlachance.png",
];

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><html><body style="margin:0"><canvas id="c"></canvas></body></html>`);

  for (const rel of targets) {
    const abs = path.join(root, rel);
    const buf = await fs.readFile(abs);
    const dataUri = `data:image/png;base64,${buf.toString("base64")}`;

    const out = await page.evaluate(async (dataUri) => {
      const img = new Image();
      img.src = dataUri;
      await new Promise((r) => (img.onload = r));
      const canvas = document.getElementById("c");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = id.data;
      const W = canvas.width;
      const H = canvas.height;

      let minX = W, minY = H, maxX = -1, maxY = -1;
      const ALPHA_T = 12;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (d[(y * W + x) * 4 + 3] > ALPHA_T) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) return null;

      // Add small padding
      const pad = 8;
      minX = Math.max(0, minX - pad);
      minY = Math.max(0, minY - pad);
      maxX = Math.min(W - 1, maxX + pad);
      maxY = Math.min(H - 1, maxY + pad);

      const cw = maxX - minX + 1;
      const ch = maxY - minY + 1;

      const out = document.createElement("canvas");
      out.width = cw;
      out.height = ch;
      const octx = out.getContext("2d");
      octx.drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
      return { dataUrl: out.toDataURL("image/png"), w: cw, h: ch };
    }, dataUri);

    if (!out) {
      console.log("skipped", rel, "(empty alpha)");
      continue;
    }
    const base64 = out.dataUrl.replace(/^data:image\/png;base64,/, "");
    await fs.writeFile(abs, Buffer.from(base64, "base64"));
    console.log("cropped", rel, `→ ${out.w}×${out.h}`);
  }
} finally {
  await browser.close();
}
