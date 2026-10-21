# Crochê com Amor — app de membros das Carteiras em Crochê

Entrega do produto **30 Modelos de Carteiras em Crochê** (61 páginas: capa + 30 modelos × 2),
com as videoaulas e os bônus do Kit Completo. Interface copiada do **Clube dos Chapéus**
(clubedoschapeus.vercel.app), com a marca e o conteúdo das carteiras.

    node servidor.cjs     # http://localhost:4200

**Login de teste (só funciona em localhost/127.0.0.1):**
`basico@crochecomamor.com` (Kit Básico) e `completo@crochecomamor.com` (Kit Completo).

## Como é montado

O `index.html` **não se edita à mão**: ele é gerado a partir da referência.

    node scripts/cart-app-montar.cjs     # referencia/chapeus.html + area-antiga.json -> index.html
    bash scripts/cart-app.sh             # páginas webp e PDFs da apostila
    node apps/carteiras-membros/capas-bonus.cjs   # capas dos bônus 2 a 4

(os dois `scripts/` ficam no repo de trabalho "Visual St - Claude", não neste)

- `referencia/chapeus.html`: o HTML publicado do app dos chapéus (20/10/2026). O montador faz
  trocas com asserção: se a referência mudar e algum trecho sumir, ele para com "não achei".
- `referencia/area-antiga.json`: os módulos da área antiga das carteiras
  (carteirasinline.vercel.app, repo heitorcarfran2004/Carteiras-em-linha).

## Acesso (quem vê o quê)

O login chama a Edge Function `membros-acesso` (Supabase `dxybmayffxvepmwbyezc`), que lê
`membros_compras`. Essa tabela é alimentada pelo webhook da Wiapy (`wiapy-webhook`, regra em
`apps/micanga-membros/supabase/functions/wiapy-webhook/mapa.ts`):

| compra | itens gravados | o que abre no app |
|---|---|---|
| checkout `6ad7276d…` "Guia: Carteiras em Crochê", qualquer oferta | `carteiras` | apostila, PDF e videoaulas |
| ofertas do Completo (NwrzHig0R1M, _DPTwLpSDIeU, jjT2H7gPd6yo) | + `carteiras-bonus` | os 4 bônus |
| bumps Bolsas / Kit Cozinha | `carteiras-bump-bolsas` / `-cozinha` | ainda nada (só registro) |

O webhook real não traz a oferta: sem o código, R$ 10 à vista = Básico e o resto é Completo.
`ACEITA_QUALQUER_COMPRA` (no montador) fica `false`.

## Conteúdo

| no app | origem |
|---|---|
| 30 Modelos de Carteiras em Crochê (61 págs, PDF em 2 partes) | apostila, `~/Downloads/Carteiras/Entregável/` |
| Aulas: Carteiras (24) e Bolsas de Ombro (15) | área antiga, embeds da Wistia |
| Bônus 1 · Curso Nécessaires em Crochê (6 aulas, só Completo) | área antiga, Wistia |
| Bônus 2 · Guia de Acabamento Profissional | **não existe ainda: "Em breve"** |
| Bônus 3 · Lista Completa de Materiais e Onde Comprar | área antiga (texto) |
| Bônus 4 · Mini Guia: Como Vender Suas Peças | área antiga (texto) |

## Suporte

Os chamados vão para a tabela `membros_suporte` pela Edge Function `membros-suporte`
(código em `supabase/functions/membros-suporte`). Para responder: no painel do Supabase,
preencher `resposta`, `status = 'respondido'` e `respondido = now()`; a cliente vê no app.

## Publicar

Repo próprio na Vercel, projeto `clubedanina` → https://clubedanina.vercel.app.
Os PDFs somam 36 MB e ficam no repo. `.vercelignore` tira referência, funções e scripts do ar.
