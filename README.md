# Crochê com Amor — app de membros das Carteiras em Crochê

Entrega do produto **30 Modelos de Carteiras em Crochê** (61 páginas: capa + 30 modelos × 2).
Cópia da interface do **Clube dos Chapéus** (clubedoschapeus.vercel.app), com o conteúdo e a
marca das carteiras.

    node servidor.cjs     # http://localhost:4200

## Como é montado

O `index.html` **não se edita à mão**: ele é gerado a partir da referência.

    node scripts/cart-app-montar.cjs     # referencia/chapeus.html -> index.html
    bash scripts/cart-app.sh             # páginas webp, capas e PDFs
    bash scripts/cart-app-icones.sh      # ícones do app e capas provisórias dos bônus

`referencia/chapeus.html` é o HTML publicado do app dos chapéus, baixado em 20/10/2026.
O montador faz trocas com asserção: se a referência mudar e algum trecho sumir, ele para
com "não achei" em vez de gerar um app quebrado.

## O que mudou em relação ao dos chapéus

- **marca** Crochê com Amor; paleta vinho `#7A1F3D` / rosa-claro `#F1D3DA` / off-white
  `#FAF6F2` (a mesma da apostila, V6) no lugar do roxo
- **conteúdo**: só o produto principal. Os 5 bônus aparecem com cadeado e **"Em breve"**,
  sem link de compra; a aba **Aulas** mostra um aviso de produção. Não há vitrine de
  outros produtos (o dos chapéus vende 9 extras lá dentro)
- **sem backend**: o app dos chapéus tem servidor próprio (`/api/login`, `/me`, `/perfil`,
  `/suporte`, `/push`). Aqui um *shim* no topo do script responde a `/api/*` no próprio
  navegador e o acesso vem da Edge Function `membros-acesso`, a mesma do clubedajuh.
  Perfil e página lida ficam no `localStorage`; chamados de suporte e push ficam
  desligados (devolvem lista vazia)

## ⚠ A liberação ainda não funciona

O `membros-acesso` lê a tabela `membros_compras`, que é alimentada pelo **webhook da
Wiapy**. As carteiras vendem na **Vega** (`checkout/v5/...`), então **nenhuma compra de
carteira chega nessa tabela** e nenhum e-mail entra hoje.

Faltam duas coisas, nesta ordem:

1. Uma Edge Function que receba o webhook da Vega e grave em `membros_compras` com
   `item: "carteiras"` (espelho de `supabase/functions/wiapy-webhook` do clubedajuh).
2. O link do app cadastrado como entrega no checkout da Vega.

Enquanto isso, para liberar geral existe uma chave no topo do script gerado:

    var ACEITA_QUALQUER_COMPRA = false;   // true = qualquer compra registrada entra

Ela está em `scripts/cart-app-montar.cjs` (seção 6) — mude lá e rode o montador de novo.

## Conteúdo

| slug | material | páginas | PDF |
|---|---|---|---|
| principal | 30 Modelos de Carteiras em Crochê | 61 | 2 partes (18,3 + 17,6 MB) |
| b1–b5 | bônus | — | em produção |

As páginas saem de `~/Downloads/Carteiras/Entregável/` (Capa.png + `Modelos/Modelo NN -
pagina K.png`) em webp de 1055 px. O índice calcula a página do modelo *N* como `2N`.

## Publicar

Repo próprio na Vercel, como os outros apps. Sugestão de nome: `crochecomamor`.
Os PDFs somam 36 MB — ficam no repo, como no ateliedamari.
