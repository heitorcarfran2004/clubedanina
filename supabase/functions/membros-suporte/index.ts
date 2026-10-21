// Suporte do app de membros (crochecomamor): grava e lista os chamados de uma cliente.
//   POST {acao:"listar", email, app?}                         -> {chamados:[...]}
//   POST {acao:"enviar", email, app?, assunto, mensagem, produto} -> {ok:true, protocolo} | {ok:false, erro}
// Tabela membros_suporte (RLS sem policy: só esta função lê e grava).
// Para responder: preencher resposta, status = 'respondido' e respondido = now() no painel.
import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
};
const resp = (o: unknown, status = 200) => Response.json(o, { status, headers: CORS });
const LIMITE_DIA = 6;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  let c: any = {};
  try { c = await req.json(); } catch { /* vazio */ }
  const email = String(c.email || "").trim().toLowerCase();
  const app = String(c.app || "carteiras").slice(0, 40);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return resp({ erro: "email invalido" }, 400);

  // só quem tem compra registrada fala com o suporte (o login do app usa a mesma regra)
  const { data: compras } = await db.from("membros_compras").select("item").eq("email", email).eq("status", "paid").limit(1);
  if (!compras || !compras.length) return resp({ erro: "sem compra" }, 403);

  if (c.acao === "enviar") {
    const mensagem = String(c.mensagem || "").trim().slice(0, 3000);
    if (mensagem.length < 10) return resp({ ok: false, erro: "curta" });
    const desde = new Date(Date.now() - 24 * 3600e3).toISOString();
    const { count } = await db.from("membros_suporte").select("id", { count: "exact", head: true }).eq("email", email).gte("criado", desde);
    if ((count || 0) >= LIMITE_DIA) return resp({ ok: false, erro: "limite" });
    const protocolo = "CC" + Math.floor(100000 + Math.random() * 900000);
    const { error } = await db.from("membros_suporte").insert({
      protocolo, app, email, mensagem,
      assunto: String(c.assunto || "outro").slice(0, 40), produto: String(c.produto || "").slice(0, 120),
    });
    return error ? resp({ ok: false, erro: "falha" }, 500) : resp({ ok: true, protocolo });
  }

  const { data, error } = await db.from("membros_suporte")
    .select("protocolo, assunto, produto, mensagem, status, resposta, criado, respondido")
    .eq("email", email).eq("app", app).order("criado", { ascending: false }).limit(30);
  if (error) return resp({ erro: "falha" }, 500);
  return resp({ chamados: data || [] });
});
