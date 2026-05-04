import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public/limova");

const assets = {
  "agents/tom.avif": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/68382f9c6f346a9a6f975418_Tom.avif",
  "agents/john.avif": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/68382f7df4149e0aadc8721b_John.avif",
  "agents/lou.avif": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/68382fcaadc73ef7ec92695a_Lou.avif",
  "agents/charly.avif": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/68382fdc799673a757342347_Charly.avif",
  "agents/elio.avif": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/68382fece1aa4ebead7d0929_Elio.avif",
  "agents/manue.avif": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/68382db5e0de6397d3904bd2_Manue.avif",
  "agents/julia.avif": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/68382ffc1ae255eb8a580797_Julia.avif",
  "agents/rony.avif": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/6838300e8af7be9efd27fd7c_Ronny.avif",
  "hero/circle-1.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/68345695b48a50a20b979f93_hero_circle_1.avif",
  "hero/circle-2.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/683456967cd1444682c52e33_hero_circle_2.avif",
  "hero/bg-side-left.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/6834602df85a766d054b340f_hero_bg_side_left.avif",
  "hero/bg-side-right.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/6834602dba8769ca3f7fa091_hero_bg_side_right.avif",
  "agent-visuals/01.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/68323d71b18a41c31f20a560_agent_visual_01.avif",
  "agent-visuals/02.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/68323d7137cebb7393ce1523_agent_visual_02.avif",
  "agent-visuals/03.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/68323d7177455fd18eae0577_agent_visual_03.avif",
  "agent-visuals/04.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/68323d711d22d62844a88866_agent_visual_04.avif",
  "agent-visuals/05.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/68323d71636a5989332331b5_agent_visual_05.avif",
  "agent-visuals/06.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/68323d71fe90bfcea8620b3a_agent_visual_06.avif",
  "agent-visuals/multiple.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/68323de5c6e3217f1807e6dc_agent_visual_multiple.avif",
  "charly/heading.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/683318abe8daa44c9b610a6f_charly_heading%20(1).avif",
  "charly/iphone.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/683332e076c3b033ca1796c8_iphone%20(1).avif",
  "charly/chat-bg.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/6833366d8ae6ec31a5320fa3_Chat%20Background%20(1).avif",
  "press/bpifrance.svg": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/68323be0d17da67770376d68_Logo_Bpifrance.svg",
  "press/bfm.svg": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/68475874b8d681334fb01fe9_bfm.svg",
  "press/bfm-business.svg": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/6903d3d7ae9cd20d976c08c5_Logo_BFM_Business.svg",
  "press/canal-news.svg": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/6903d3e3aab30392da138300_Canal_News_logo.svg",
  "press/le-figaro.svg": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/6903d40ac646d6bd27097b83_Le_Figaro_logo.svg",
  "press/lci.svg": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/6903d4186d2a539b11d11d7d_LCI_-_Logo_(Aou%CC%82t_2017).svg",
  "press/w9.svg": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/6903d426be71073bc04c6c04_W9-Logo.svg",
  "press/tf1.svg": "https://cdn.prod.website-files.com/68323bce3c689193488a549b/690e6dc6c783b6f54c1ee3d9_TF1_logo_2006.svg",
  "flags/fr.svg": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/6862fea4355b957b95d168f2_Flag_of_France.svg",
  "flags/uk.svg": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/6862fea47f7fc2c72f2c0b10_Flag_of_the_United_Kingdom_(3-5).svg",
  "favicon.png": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/6831e015aab234df5ac0490e_Flavicon.png",
  "webclip.png": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/6831e019f462250e703798ff_Webclip.png",
  "thumb.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/68392bb788297678eaf43a5a_thumb.avif",
  "certif.avif": "https://cdn.prod.website-files.com/6831d8ad2505f0a9d75030e4/683783a58f53953a5d41b501_certif.avif",
};

await fs.mkdir(outDir, { recursive: true });

async function download(rel, url) {
  const dest = path.join(outDir, rel);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(dest, buf);
  return [rel, buf.byteLength];
}

const entries = Object.entries(assets);
const results = [];
const concurrency = 6;
let i = 0;

await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (i < entries.length) {
      const idx = i++;
      const [rel, url] = entries[idx];
      try {
        const r = await download(rel, url);
        results.push(r);
        console.log("OK", r[0], `(${r[1]} bytes)`);
      } catch (e) {
        console.error("FAIL", rel, e.message);
        results.push([rel, 0, e.message]);
      }
    }
  })
);

console.log(`\nDownloaded: ${results.filter((r) => r[1] > 0).length}/${entries.length}`);
