import pLimit from "p-limit";

// Per-host concurrency + retry/backoff. Chaque source data wraper passe par
// fetchJson()/fetchText() pour respecter les rate limits sans s'auto-DDoS.

const HOST_LIMITS = new Map<string, ReturnType<typeof pLimit>>();
function limiterFor(url: string, perHostConcurrency = 2): ReturnType<typeof pLimit> {
  const host = new URL(url).host;
  let l = HOST_LIMITS.get(host);
  if (!l) {
    l = pLimit(perHostConcurrency);
    HOST_LIMITS.set(host, l);
  }
  return l;
}

export type FetchOpts = RequestInit & {
  timeoutMs?: number;
  retries?: number;
  backoffMs?: number;
  perHostConcurrency?: number;
};

export async function fetchWithRetry(url: string, opts: FetchOpts = {}): Promise<Response> {
  const { timeoutMs = 15_000, retries = 3, backoffMs = 800, perHostConcurrency = 2, ...rest } = opts;
  const limit = limiterFor(url, perHostConcurrency);

  return limit(async () => {
    let lastErr: unknown = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const resp = await fetch(url, { ...rest, signal: ctrl.signal });
        clearTimeout(t);
        if (resp.status >= 500 || resp.status === 429) {
          if (attempt < retries) {
            await sleep(backoffMs * Math.pow(2, attempt));
            continue;
          }
        }
        return resp;
      } catch (e) {
        clearTimeout(t);
        lastErr = e;
        if (attempt < retries) {
          await sleep(backoffMs * Math.pow(2, attempt));
          continue;
        }
        throw e;
      }
    }
    throw lastErr ?? new Error("fetchWithRetry: exhausted retries");
  });
}

export async function fetchJson<T>(url: string, opts: FetchOpts = {}): Promise<T> {
  const r = await fetchWithRetry(url, opts);
  if (!r.ok) throw new Error(`fetch ${url} → HTTP ${r.status}`);
  return (await r.json()) as T;
}

export async function fetchText(url: string, opts: FetchOpts = {}): Promise<string> {
  const r = await fetchWithRetry(url, opts);
  if (!r.ok) throw new Error(`fetch ${url} → HTTP ${r.status}`);
  return r.text();
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}
