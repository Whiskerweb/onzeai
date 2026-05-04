import puppeteer from "puppeteer";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const inputPath = path.join(root, "public/onze/coaches/dembefric-raw.jpg");
const outputPath = path.join(root, "public/onze/coaches/dembefric.png");

const buf = await fs.readFile(inputPath);
const dataUri = `data:image/jpeg;base64,${buf.toString("base64")}`;

const browser = await puppeteer.launch({ headless: "new" });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 1024 });
  await page.setContent(`
    <!doctype html>
    <html><body style="margin:0;background:transparent">
      <canvas id="c"></canvas>
    </body></html>
  `);

  const dataUrlOut = await page.evaluate(async (dataUri) => {
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

    function rgbToHsv(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      let h = 0;
      if (delta > 0) {
        if (max === r) h = 60 * (((g - b) / delta) % 6);
        else if (max === g) h = 60 * ((b - r) / delta + 2);
        else h = 60 * ((r - g) / delta + 4);
      }
      if (h < 0) h += 360;
      const s = max === 0 ? 0 : delta / max;
      const v = max;
      return [h, s, v];
    }

    // Pass 1 — hard mask + soft falloff using HSV
    // Pure chroma green is around hue 100-150, high sat, mid-high value.
    // We keep a wider window to absorb JPEG edge noise.
    const HUE_MIN = 70;
    const HUE_MAX = 175;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const [h, s, v] = rgbToHsv(r, g, b);

      const inHue = h >= HUE_MIN && h <= HUE_MAX;

      if (inHue && s > 0.30 && v > 0.20) {
        // strong green → fully transparent
        d[i + 3] = 0;
      } else if (inHue && s > 0.18 && v > 0.15) {
        // edge zone → soft alpha based on saturation
        const t = Math.min(1, (s - 0.18) / 0.22);
        d[i + 3] = Math.round(d[i + 3] * (1 - t));
      }

      // Despill — even pixels we keep often have green leakage
      if (d[i + 3] > 0 && g > r && g > b) {
        // Cap green channel to a midpoint of red/blue to neutralize spill
        const cap = Math.max(r, b);
        if (g - cap > 8) {
          d[i + 1] = cap + Math.round((g - cap) * 0.25);
        }
      }
    }

    // Pass 2 — flood fill from corners to remove isolated green pixels
    // that the HSV check missed (very desaturated edges).
    const visited = new Uint8Array(W * H);
    const stack = [];
    function pushIfBgLike(x, y) {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const idx = y * W + x;
      if (visited[idx]) return;
      const di = idx * 4;
      // Already transparent
      if (d[di + 3] === 0) {
        visited[idx] = 1;
        stack.push([x, y]);
        return;
      }
      const r = d[di], g = d[di + 1], b = d[di + 2];
      const [h, s, v] = rgbToHsv(r, g, b);
      // Loose green test — used only when reachable from corner
      if (h >= 60 && h <= 180 && s > 0.10 && v > 0.15) {
        d[di + 3] = 0;
        visited[idx] = 1;
        stack.push([x, y]);
      }
    }
    pushIfBgLike(0, 0);
    pushIfBgLike(W - 1, 0);
    pushIfBgLike(0, H - 1);
    pushIfBgLike(W - 1, H - 1);

    while (stack.length) {
      const [x, y] = stack.pop();
      pushIfBgLike(x + 1, y);
      pushIfBgLike(x - 1, y);
      pushIfBgLike(x, y + 1);
      pushIfBgLike(x, y - 1);
    }

    // Pass 3 — alpha-aware edge soften: average alpha at edges to feather
    const alphaCopy = new Uint8ClampedArray(W * H);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) alphaCopy[p] = d[i + 3];

    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const p = y * W + x;
        const a = alphaCopy[p];
        if (a > 0 && a < 255) {
          const avg =
            (alphaCopy[p - 1] +
              alphaCopy[p + 1] +
              alphaCopy[p - W] +
              alphaCopy[p + W] +
              a * 2) / 6;
          d[p * 4 + 3] = Math.round(avg);
        }
      }
    }

    ctx.putImageData(id, 0, 0);
    return canvas.toDataURL("image/png");
  }, dataUri);

  const base64 = dataUrlOut.replace(/^data:image\/png;base64,/, "");
  await fs.writeFile(outputPath, Buffer.from(base64, "base64"));
  console.log("saved", outputPath, "(", (await fs.stat(outputPath)).size, "bytes )");
} finally {
  await browser.close();
}
