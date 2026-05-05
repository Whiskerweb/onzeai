import Link from "next/link";
import { Wizard } from "./_components/Wizard";
import { coaches, type CoachId } from "../_data/coaches";
import { fixtures, type Fixture } from "../_data/fixtures";
import { isPlanId, type PlanId } from "@/lib/plan-config";

export const metadata = {
  title: "Démarrer ton essai · Onze.ai",
  description:
    "Choisis ton plan et tes coachs IA. Sept jours d'essai. Tes paris sur Telegram dès ce soir.",
};

type SP = Promise<{
  plan?: string;
  coaches?: string;
  free?: string;
}>;

export default async function StartPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;

  const initialPlan: PlanId = isPlanId(sp.plan) ? sp.plan : "squad";

  const validCoachIds = new Set<CoachId>(coaches.map((c) => c.id));
  const initialCoachIds: CoachId[] = (sp.coaches ?? "")
    .split(",")
    .map((s) => s.trim() as CoachId)
    .filter((id): id is CoachId => validCoachIds.has(id));

  let freeFixture: Fixture | null = null;
  if (sp.free) {
    freeFixture = fixtures.find((f) => f.id === sp.free) ?? null;
    if (freeFixture && !initialCoachIds.includes(freeFixture.coachId as CoachId)) {
      initialCoachIds.unshift(freeFixture.coachId as CoachId);
    }
  }

  return (
    <main className="min-h-screen bg-onze-bg text-zinc-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-dot-pattern opacity-25" />

      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-onze-pitch text-white shadow-onze-btn">
            ◆
          </span>
          Onze.ai
        </Link>
        <Link
          href="/#tarifs"
          className="text-xs font-semibold uppercase tracking-widest text-zinc-400 hover:text-white"
        >
          ← Retour aux tarifs
        </Link>
      </header>

      <Wizard
        initialPlan={initialPlan}
        initialCoachIds={initialCoachIds}
        freeFixture={freeFixture}
      />
    </main>
  );
}
