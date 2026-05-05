// FBref.com scrape — stub pour la phase 2 (enrichissement stats foot).
// On peut viser des endpoints CSV (`?fmt=csv` n'existe plus, donc on scrape les <table>).
//
// Phase 1 : Understat couvre déjà l'xG. FBref viendra enrichir avec les stats de
// last5 par équipe (PPDA, set-piece xG, deep completions). À implémenter dans
// task #12 ou ultérieurement.

export async function notImplemented(): Promise<never> {
  throw new Error("agents/sources/fbref.ts: pas encore implémenté (phase 2)");
}
