// ============================================================
// quizTracker.ts
// Cole este arquivo no repo do quiz (quiz-coluna-reset),
// ex: src/lib/quizTracker.ts
//
// NAO precisa do @supabase/supabase-js no quiz.
// Usa fetch puro na API REST do Supabase (PostgREST).
//
// Envs no projeto do quiz (Vercel) com prefixo VITE_:
//   VITE_SUPABASE_URL      = https://ptzblagrqvnmbvgnffnz.supabase.co
//   VITE_SUPABASE_ANON_KEY = (anon key do projeto coluna-reset)
//
// A anon key pode ficar exposta no bundle: a RLS bloqueia leitura.
// O quiz so consegue INSERIR, nunca ler resposta de ninguem.
//
// IMPORTANTE: grave PERGUNTA e RESPOSTA em texto legivel,
// nunca o indice da opcao, senao o espelho vira numero sem sentido.
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

// Cria a sessao 1x (no inicio do quiz). Idempotente por sessionStorage.
export async function startQuizSession(): Promise<string> {
  let id = sessionStorage.getItem(SS);
  if (id) return id;

  id = crypto.randomUUID();
  sessionStorage.setItem(SS, id);

  await fetch(`${URL}/rest/v1/quiz_sessions`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ session_id: id, ...getUtm() }),
  }).catch(() => {});

  return id;
}

// Chamar NO MOMENTO da transicao de etapa (nao no mount).
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

// Chamar quando o usuario chega na tela final / resultado.
export async function completeQuizSession(): Promise<void> {
  const id = sessionStorage.getItem(SS);
  if (!id) return;
  await fetch(`${URL}/rest/v1/quiz_sessions?session_id=eq.${id}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ completed_at: new Date().toISOString() }),
  }).catch(() => {});
}
