import { getSupabase } from "./supabase.js";
import type { SportId } from "./config.js";
import { logger } from "./logger.js";

// Helpers pour public.agent_runs : démarrer/finir/erreurer un run, et un
// wrapper withRun() qui s'occupe du try/finally + métriques.

export type RunKind = "ingest" | "analyze";

export type RunMetrics = Record<string, number | string>;

export async function startRun(sport: SportId, kind: RunKind): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("agent_runs")
    .insert({ sport_id: sport, kind, status: "running" })
    .select("id")
    .single();
  if (error || !data) throw new Error(`startRun failed: ${error?.message}`);
  return data.id as string;
}

export async function finishRun(runId: string, metrics: RunMetrics): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("agent_runs")
    .update({ status: "success", finished_at: new Date().toISOString(), metrics })
    .eq("id", runId);
  if (error) logger.error({ runId, error }, "finishRun:error");
}

export async function errorRun(runId: string, err: unknown, metrics: RunMetrics = {}): Promise<void> {
  const sb = getSupabase();
  const message = err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
  await sb
    .from("agent_runs")
    .update({
      status: "error",
      finished_at: new Date().toISOString(),
      error: message.slice(0, 4000),
      metrics,
    })
    .eq("id", runId);
}

export async function withRun<T>(
  sport: SportId,
  kind: RunKind,
  fn: (runId: string, metrics: RunMetrics) => Promise<T>,
): Promise<T> {
  const runId = await startRun(sport, kind);
  const metrics: RunMetrics = {};
  try {
    const result = await fn(runId, metrics);
    await finishRun(runId, metrics);
    return result;
  } catch (e) {
    await errorRun(runId, e, metrics);
    throw e;
  }
}
