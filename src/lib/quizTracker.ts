// ============================================================
// quizTracker.ts
// src/lib/quizTracker.ts no repo do quiz (quiz-coluna-reset)
//
// NAO precisa do @supabase/supabase-js no quiz.
// Usa fetch puro na API REST do Supabase (PostgREST).
//
// Envs no projeto do quiz (Vercel) com prefixo VITE_:
//   VITE_SUPABASE_URL      = https://ptzblagrqvnmbvgnffnz.supabase.co
//   VITE_SUPABASE_ANON_KEY = (anon key do projeto coluna-reset)
// ============================================================

const URL = import.meta.env.VITE_SUPABASE_URL as string;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const SS = "cr_quiz_session";

function headers() {
  return {
    "Content-Type": "application/json",
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    Prefer: "return=minimal",
  };
}

function getUtm() {
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source"),
    utm_medium: p.get("utm_medium"),
    utm_campaign: p.get("utm_campaign"),
  };
}

export async function startQuizSession(): Promise<string> {
  let id = sessionStorage.getItem(SS);
  if (id) return id;
  id = crypto.randomUUID();
  sessionStorage.setItem(SS, id);

  let ip: string | null = null;
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const j = await r.json();
    ip = j.ip ?? null;
  } catch {}

  await fetch(`${URL}/rest/v1/quiz_sessions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ session_id: id, ip, ...getUtm() }),
  }).catch(() => {});

  return id;
}

export async function trackAnswer(
  step: number,
  pergunta: string,
  resposta: string
): Promise<void> {
  const id = sessionStorage.getItem(SS) ?? (await startQuizSession());
  await fetch(`${URL}/rest/v1/quiz_answers`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ session_id: id, step, pergunta, resposta }),
  }).catch(() => {});
}

export async function completeQuizSession(): Promise<void> {
  const id = sessionStorage.getItem(SS);
  if (!id) return;
  await fetch(`${URL}/rest/v1/quiz_sessions?session_id=eq.${id}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ completed_at: new Date().toISOString() }),
  }).catch(() => {});
}
