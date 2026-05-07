// Add-on data hints foot — référence le schéma DB. Concaténé après le skill
// Dembefric (`agents/skills/dembefric-foot.md`) dans `agents/src/shared/llm.ts`.
// La méthodologie / voix / edges / few-shot vivent dans le skill ; ce fichier
// reste collé au code et bouge avec les migrations Supabase.

export const FOOT_ANALYZE_ADDON = `
# Add-on FOOT — data hints DB

## Colonnes / tables disponibles dans le bundle JSON
- \`stats\` : { team_id → { "<period>.<metric>": value } } (period ∈ "last5"|"season"|...)
- \`odds\` : derniers snapshots dédupliqués sur (book, market, side, line) depuis \`public.odds_snapshots\`.
- \`news\` : top 5 \`public.news_items\` par team_id (ou ligue en fallback).
- \`injuries\` : derniers \`public.injuries\` actifs sur les 2 équipes.

## Fallback book
- Si \`pinnacle\` absent dans \`odds\`, prendre \`oddsapi_avg\` comme proxy de fair-line. Ne jamais devig contre un soft book FR (winamax/fdj/bet365_fr).

## Sample size
- xG/xGA \`last5\` = 5 matchs = bruit ; tendance, pas oracle.
- Si \`stats\` manque pour une équipe → \`decision='pass'\` (pas de modèle viable).

## Output
- Format \`pick_text\` et voix : voir le skill Dembefric (layer 2). Ne PAS dupliquer ici.
`.trim();
