// Pushes a single pick to Supabase. The Database Webhook on `public.picks INSERT`
// then triggers the bot's /broadcast endpoint, which fans the message out to every
// active subscriber of the matching coach.
//
// Usage:
//   npx tsx --env-file=.env.local scripts/push-pick.ts \
//     --coach foot \
//     --pick "PSG vainqueur + plus de 2.5 buts" \
//     --cote 2.85 \
//     --fixture "psg-om-2026-05-12" \
//     --reasoning "Mbappé titulaire selon la conf, OM sans Aubameyang."
//
// Or pipe a JSON object on stdin:
//   echo '{"coach_id":"foot","pick_text":"...","cote":2.85}' \
//     | npx tsx --env-file=.env.local scripts/push-pick.ts --stdin
//
// Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";

const COACH_IDS = ["foot", "basket", "tennis", "ufc"] as const;
type CoachId = (typeof COACH_IDS)[number];

type PickInput = {
  coach_id: CoachId;
  pick_text: string;
  cote?: number | null;
  fixture_id?: string | null;
  reasoning?: string | null;
};

function parseArgs(argv: string[]): PickInput | "stdin" {
  const args = new Map<string, string>();
  let useStdin = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--stdin") {
      useStdin = true;
      continue;
    }
    if (a?.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1];
      if (val && !val.startsWith("--")) {
        args.set(key, val);
        i++;
      } else {
        args.set(key, "true");
      }
    }
  }
  if (useStdin) return "stdin";

  const coach = (args.get("coach") ?? "").trim() as CoachId;
  const pick_text = args.get("pick") ?? "";
  if (!COACH_IDS.includes(coach)) {
    throw new Error(`--coach must be one of ${COACH_IDS.join(", ")} (got "${coach}")`);
  }
  if (!pick_text) {
    throw new Error("--pick is required");
  }
  const coteRaw = args.get("cote");
  const cote = coteRaw ? Number(coteRaw.replace(",", ".")) : null;
  if (coteRaw && (cote === null || Number.isNaN(cote))) {
    throw new Error(`--cote must be a number (got "${coteRaw}")`);
  }
  return {
    coach_id: coach,
    pick_text,
    cote,
    fixture_id: args.get("fixture") ?? null,
    reasoning: args.get("reasoning") ?? null,
  };
}

async function readStdin(): Promise<PickInput> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) throw new Error("stdin is empty");
  const parsed = JSON.parse(raw) as Partial<PickInput>;
  if (!parsed.coach_id || !COACH_IDS.includes(parsed.coach_id as CoachId)) {
    throw new Error(`coach_id must be one of ${COACH_IDS.join(", ")}`);
  }
  if (!parsed.pick_text) throw new Error("pick_text is required");
  return {
    coach_id: parsed.coach_id as CoachId,
    pick_text: parsed.pick_text,
    cote: parsed.cote ?? null,
    fixture_id: parsed.fixture_id ?? null,
    reasoning: parsed.reasoning ?? null,
  };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env. " +
        "Run with --env-file=.env.local or export them.",
    );
  }

  const parsed = parseArgs(process.argv.slice(2));
  const pick: PickInput = parsed === "stdin" ? await readStdin() : parsed;

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("picks")
    .insert(pick)
    .select("id, coach_id, pick_text, cote, fixture_id, created_at")
    .single();

  if (error) {
    console.error("[push-pick] insert failed:", error);
    process.exit(1);
  }

  console.log("[push-pick] OK");
  console.log(JSON.stringify(data, null, 2));
  console.log(
    "\nThe Supabase Database Webhook will now POST to the bot's /broadcast " +
      "endpoint, which fans this out to every active subscriber of " +
      `${pick.coach_id}.`,
  );
}

main().catch((e) => {
  console.error("[push-pick] error:", e instanceof Error ? e.message : e);
  process.exit(1);
});
