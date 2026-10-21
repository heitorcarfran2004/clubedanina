// Inscrições e envio de notificações (Web Push) dos apps de membros. Projeto dxybmayffxvepmwbyezc.
//
// FORMATO ANTIGO (clubedajuh / Miçanga, NÃO MUDAR):
//   POST {email, itens, inscricao:{endpoint, keys:{p256dh, auth}}}  -> grava/atualiza em membros_push (app 'micanga-br')
//   O envio da Miçanga é feito pela função push-enviar (filtra por item). Esta parte foi
//   reconstruída em 21/10/2026 a partir da chamada do app.html, depois de um deploy por cima.
//
// AÇÕES NOVAS (app das carteiras, clubedanina.vercel.app):
//   {acao:"inscrever", email, app, sub, itens?} -> {ok}       (só e-mail com compra paga)
//   {acao:"remover", endpoint}                 -> {ok}
//   {acao:"teste", email, app}                 -> {enviados}  (só os aparelhos desse e-mail)
//   {acao:"enviar", app, email?, title, body, url?, tag?} + Authorization: Bearer <service_role>
//                                              -> {enviados, removidos}; email vazio = todos do app
//
// Chave VAPID: a MESMA do clubedajuh (segredo VAPID_JWK, JWK com d/x/y). Trocar o par derruba
// todas as inscrições existentes.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(Deno.env.get("SUPABASE_URL")!, SERVICE);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
};
const resp = (o: unknown, status = 200) => Response.json(o, { status, headers: CORS });
const okEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

let vapidPronto = false;
function prepararVapid() {
  if (vapidPronto) return true;
  try {
    const jwk = JSON.parse(Deno.env.get("VAPID_JWK") || "{}");
    const b = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - s.length % 4) % 4)), (c) => c.charCodeAt(0));
    const pub = new Uint8Array([4, ...b(jwk.x), ...b(jwk.y)]);
    const pubB64 = btoa(String.fromCharCode(...pub)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    webpush.setVapidDetails("mailto:suporteht.digital@gmail.com", pubB64, jwk.d);
    vapidPronto = true;
  } catch (_) { vapidPronto = false; }
  return vapidPronto;
}

async function enviarPara(linhas: any[], payload: Record<string, unknown>) {
  if (!prepararVapid()) return { enviados: 0, removidos: 0, erro: "vapid" };
  let enviados = 0, removidos = 0;
  const corpo = JSON.stringify(payload);
  await Promise.all(linhas.map(async (l) => {
    try {
      await webpush.sendNotification({ endpoint: l.endpoint, keys: { p256dh: l.p256dh, auth: l.auth } }, corpo, { TTL: 86400 });
      enviados++;
      await db.from("membros_push").update({ falhas: 0, ultimo_envio: new Date().toISOString() }).eq("endpoint", l.endpoint);
    } catch (e: any) {
      // 404/410 = inscrição morta (app desinstalado, permissão tirada): apaga
      if (e?.statusCode === 404 || e?.statusCode === 410) { await db.from("membros_push").delete().eq("endpoint", l.endpoint); removidos++; }
      else await db.from("membros_push").update({ falhas: (l.falhas || 0) + 1 }).eq("endpoint", l.endpoint);
    }
  }));
  return { enviados, removidos };
}

async function gravar(email: string, app: string, s: any, itens: unknown) {
  const linha: Record<string, unknown> = {
    endpoint: s.endpoint, email: email || null, p256dh: s.keys.p256dh, auth: s.keys.auth,
    app, falhas: 0, atualizado_em: new Date().toISOString(),
  };
  if (Array.isArray(itens)) linha.itens = itens.map(String).slice(0, 50);
  return await db.from("membros_push").upsert(linha, { onConflict: "endpoint" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  let c: any = {};
  try { c = await req.json(); } catch { /* vazio */ }

  // ── formato antigo do clubedajuh ──
  if (!c.acao && c.inscricao) {
    const s = c.inscricao;
    if (!s?.endpoint || !s?.keys?.p256dh || !s?.keys?.auth) return resp({ erro: "inscricao invalida" }, 400);
    const email = String(c.email || "").trim().toLowerCase();
    const { error } = await gravar(email, String(c.app || "micanga-br"), s, c.itens);
    return error ? resp({ erro: "falha" }, 500) : resp({ ok: true });
  }

  const app = String(c.app || "carteiras").slice(0, 40);

  if (c.acao === "remover") {
    if (c.endpoint) await db.from("membros_push").delete().eq("endpoint", String(c.endpoint));
    return resp({ ok: true });
  }

  if (c.acao === "enviar") {
    const tok = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (tok !== SERVICE) return resp({ erro: "token" }, 401);
    let q = db.from("membros_push").select("endpoint, p256dh, auth, falhas").eq("app", app);
    const email = String(c.email || "").trim().toLowerCase();
    if (email) q = q.eq("email", email);
    const { data } = await q.limit(5000);
    return resp(await enviarPara(data || [], { title: c.title || "Crochê com Amor", body: c.body || "", url: c.url || "/#inicio", tag: c.tag || "novidade" }));
  }

  const email = String(c.email || "").trim().toLowerCase();
  if (!okEmail(email)) return resp({ erro: "email invalido" }, 400);
  // só quem tem compra registrada se inscreve (mesma regra do login)
  const { data: compras } = await db.from("membros_compras").select("item").eq("email", email).eq("status", "paid");
  if (!compras || !compras.length) return resp({ erro: "sem compra" }, 403);

  if (c.acao === "inscrever") {
    const s = c.sub || {};
    if (!s.endpoint || !s.keys?.p256dh || !s.keys?.auth) return resp({ erro: "inscricao invalida" }, 400);
    const { error } = await gravar(email, app, s, [...new Set(compras.map((x: any) => x.item))]);
    return error ? resp({ erro: "falha" }, 500) : resp({ ok: true });
  }

  if (c.acao === "teste") {
    const { data } = await db.from("membros_push").select("endpoint, p256dh, auth, falhas").eq("app", app).eq("email", email).limit(10);
    return resp(await enviarPara(data || [], { title: "Avisos ativados ✓", body: "É assim que vão chegar as aulas novas e as respostas do suporte.", url: "/#inicio", tag: "teste" }));
  }
  return resp({ erro: "acao" }, 400);
});
