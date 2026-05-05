import OpenAI from "openai";
import { getConfig } from "./config.js";

let cached: OpenAI | null = null;
function client(): OpenAI {
  if (cached) return cached;
  cached = new OpenAI({ apiKey: getConfig().OPENAI_API_KEY });
  return cached;
}

// Le modèle text-embedding-3-small produit des vecteurs 1536d (matche public.news_items.embedding).
// $0.02/1M tokens. Pour notre volume (~quelques centaines de news/jour), c'est négligeable.
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const cfg = getConfig();
  const resp = await client().embeddings.create({
    model: cfg.EMBED_MODEL,
    input: texts,
  });
  return resp.data.map((d) => d.embedding);
}
