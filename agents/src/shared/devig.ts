// Devigging utilities — strip the bookmaker margin from quoted prices to recover
// implied "fair" probabilities. The agents use these BEFORE calling the LLM so
// the analysis is anchored on no-vig math rather than gross book prices.
//
// References: Joseph Buchdahl, "Squares & Sharps" ; Pinnacle Betting Resources.

/** Decimal odds → naive implied probability (with vig). */
export function impliedProb(odds: number): number {
  if (odds <= 1) return 0;
  return 1 / odds;
}

/** Multiplicative devig — fast and accurate enough on ~50/50 markets. */
export function devigMultiplicative(prices: number[]): number[] {
  const probs = prices.map(impliedProb);
  const total = probs.reduce((a, b) => a + b, 0);
  if (total <= 0) return probs;
  return probs.map((p) => p / total);
}

/** Power method — better calibration on lopsided 1X2 / heavy fav markets.
 *  Solve  Σ p_i^k = 1  for k in (0,1].  Newton iteration. */
export function devigPower(prices: number[], maxIter = 50): number[] {
  const probs = prices.map(impliedProb);
  const sum = probs.reduce((a, b) => a + b, 0);
  if (sum <= 1) return probs; // déjà "no-vig" ou margin négative — rare, on retourne tel quel
  // initial guess
  let k = Math.log(probs.length) / Math.log(probs.length * sum / probs.length);
  if (!isFinite(k) || k <= 0) k = 1;
  for (let i = 0; i < maxIter; i++) {
    const f = probs.reduce((acc, p) => acc + Math.pow(p, k), 0) - 1;
    const fPrime = probs.reduce((acc, p) => acc + Math.pow(p, k) * Math.log(p || 1e-9), 0);
    if (Math.abs(fPrime) < 1e-12) break;
    const next = k - f / fPrime;
    if (!isFinite(next) || next <= 0) break;
    if (Math.abs(next - k) < 1e-9) {
      k = next;
      break;
    }
    k = next;
  }
  return probs.map((p) => Math.pow(p, k));
}

/** Edge in percentage points: (p_model − p_fair) × 100. Positive = +EV. */
export function edgePct(pModel: number, pFair: number): number {
  return (pModel - pFair) * 100;
}

/** Expected Value, decimal odds + true probability. */
export function expectedValue(odds: number, pTrue: number, stake = 1): number {
  const win = (odds - 1) * stake * pTrue;
  const lose = stake * (1 - pTrue);
  return win - lose;
}
