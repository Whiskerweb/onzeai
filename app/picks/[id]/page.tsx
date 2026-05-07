import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { coaches, type CoachId } from "@/app/_data/coaches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

type PublicPick = {
  pick_id: string;
  coach_id: string;
  pick_text: string;
  cote: number | null;
  pick_reasoning: string | null;
  fixture_id: string | null;
  created_at: string;
  analysis_card: string | null;
  market: string | null;
  side: string | null;
  line: number | null;
  recommended_price: number | null;
  edge_pct: number | null;
  kickoff: string | null;
  fixture_status: string | null;
  league_code: string | null;
  league_name: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  sport_id: string | null;
  sport_name: string | null;
};

async function loadPick(id: string): Promise<PublicPick | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("public_picks")
    .select("*")
    .eq("pick_id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicPick;
}

function formatKickoff(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const pick = await loadPick(id);
  if (!pick) return { title: "Pick introuvable · Onze.ai" };
  const coach = coaches.find((c) => c.id === (pick.coach_id as CoachId));
  return {
    title: `${pick.pick_text} · ${coach?.name ?? "Onze"}`,
    description: pick.pick_reasoning ?? "Analyse Onze.ai",
  };
}

export default async function PickPage({ params }: { params: Params }) {
  const { id } = await params;
  const pick = await loadPick(id);
  if (!pick) notFound();

  const coach = coaches.find((c) => c.id === (pick.coach_id as CoachId));
  const fixtureLabel =
    pick.home_team_name && pick.away_team_name
      ? `${pick.home_team_name} — ${pick.away_team_name}`
      : "Match";

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-300 transition"
        >
          ← Onze.ai
        </Link>

        <div className="mt-6 flex items-center gap-3">
          {coach && (
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: coach.color }}
            >
              {coach.number}
            </span>
          )}
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              {coach?.name ?? pick.coach_id} · {pick.league_name ?? pick.sport_name ?? "Foot"}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-neutral-100">
              {fixtureLabel}
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              {formatKickoff(pick.kickoff)}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <p className="text-xs uppercase tracking-wider text-neutral-500">
            Pronostic
          </p>
          <p className="mt-2 text-xl font-semibold text-neutral-100">
            {pick.pick_text}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            {pick.recommended_price !== null && (
              <Stat label="Cote prise" value={pick.recommended_price.toFixed(2)} />
            )}
            {pick.edge_pct !== null && (
              <Stat label="Edge" value={`+${pick.edge_pct.toFixed(1)}%`} />
            )}
            {pick.market && (
              <Stat label="Marché" value={formatMarket(pick.market, pick.side, pick.line)} />
            )}
          </div>
        </div>
      </header>

      {pick.analysis_card ? (
        <article className="prose prose-invert prose-neutral max-w-none prose-headings:font-semibold prose-h2:mt-0 prose-h3:mt-8 prose-table:text-sm prose-th:text-neutral-300 prose-td:text-neutral-400">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {pick.analysis_card}
          </ReactMarkdown>
        </article>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-6 text-sm text-neutral-400">
          {pick.pick_reasoning ?? "Analyse complète indisponible pour ce pick."}
        </div>
      )}

      <footer className="mt-12 border-t border-neutral-800 pt-6 text-xs text-neutral-500">
        <p>
          Pari sportif = risque. Analyse indicative, pas un conseil financier.
          Joue responsable. — {coach?.name ?? "Onze.ai"}
        </p>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 font-mono text-base text-neutral-100">{value}</p>
    </div>
  );
}

function formatMarket(market: string, side: string | null, line: number | null): string {
  const m = market.toUpperCase();
  if (line !== null && line !== undefined) {
    const signed = line > 0 ? `+${line}` : `${line}`;
    return `${m} ${side ?? ""} ${signed}`.trim();
  }
  return `${m} ${side ?? ""}`.trim();
}
