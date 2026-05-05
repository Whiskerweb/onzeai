import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { coaches } from "@/app/_data/coaches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Authenticated picks ingestion endpoint.
// Caller must include header `x-picks-secret: <PICKS_INGEST_SECRET>`.
// On success the row is inserted into `public.picks`; the Supabase Database
// Webhook then triggers the bot's /broadcast endpoint to fan out to subscribers.

const validCoachIds = new Set(coaches.map((c) => c.id));

const Body = z.object({
  coach_id: z.string().refine((v) => validCoachIds.has(v as never), "coach_id invalide"),
  pick_text: z.string().min(3),
  cote: z.union([z.number(), z.string()]).optional().nullable(),
  fixture_id: z.string().optional().nullable(),
  reasoning: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const expected = process.env.PICKS_INGEST_SECRET;
  const got = req.headers.get("x-picks-secret");
  if (!expected || got !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: z.infer<typeof Body>;
  try {
    payload = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof z.ZodError ? e.issues[0]?.message : "Body invalide" },
      { status: 400 },
    );
  }

  const cote =
    typeof payload.cote === "string"
      ? Number(payload.cote.replace(",", "."))
      : payload.cote ?? null;
  if (cote !== null && (typeof cote !== "number" || Number.isNaN(cote))) {
    return NextResponse.json({ error: "cote doit être un nombre" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("picks")
    .insert({
      coach_id: payload.coach_id,
      pick_text: payload.pick_text,
      cote,
      fixture_id: payload.fixture_id ?? null,
      reasoning: payload.reasoning ?? null,
    })
    .select("id, coach_id, pick_text, cote, fixture_id, created_at")
    .single();

  if (error) {
    console.error("[picks] insert error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pick: data });
}
