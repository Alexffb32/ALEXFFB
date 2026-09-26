# Loja — como funciona e como se mantém

A loja (`/loja/`) é estática. Tudo o que muda — produtos, preços, packs,
avaliações — está num ficheiro só: `assets/shop-catalog.js`. Depois de
mexer lá, corre-se:

```bash
node scripts/build-product-pages.js   # uma página por produto em /loja/<slug>/
node scripts/build-sitemap.js         # sitemap a partir das páginas reais
```

e faz-se push para `main` (a Vercel publica sozinha).

---

## Preços e packs

| Produto | Preço | Riscado | Porquê este riscado |
|---|---|---|---|
| T-shirt | 17,99 € | 35,98 € (-50%) | preço de tabela depois do lançamento |
| Hoodie | 27,99 € | 55,98 € (-50%) | idem |
| Combo Hoodie + T-shirt | 36,99 € | 73,98 € (-50%) | idem; poupa 8,99 € face às duas peças em separado |
| Pack 4 T-shirts | 54,99 € | 71,96 € (-24%) | **não é preço de tabela**: é o que as 4 t-shirts custam compradas uma a uma, calculado a partir do preço da t-shirt |

**Aviso legal que continua a valer:** o riscado de -50% só é legal
(Decreto-Lei 109-G/2021) se 35,98 € / 55,98 € / 73,98 € forem mesmo os
preços praticados depois do lançamento. Se não forem, tira-se o
`fullPrice` desses formatos e o riscado desaparece de todo o lado. O do
Pack não tem este problema — compara com um preço que está à venda na
própria loja, hoje.

## Garantias (a faixa por baixo do menu)

Cada frase da faixa tem de ser verdade e está escrita nos Termos:

| Na faixa | Nos Termos |
|---|---|
| Portes grátis para Portugal Continental | 4.4 |
| Troca de tamanho grátis | 4.6 — 14 dias após a entrega, peça sem uso nem lavagens, portes de ida e volta por conta da loja, sujeito a stock |
| 100% algodão | **confirmar com o fornecedor** — se não for, tira-se da faixa |
| Assinatura à mão de oferta | editor de assinatura na página de cada design |

Os mesmos dados (portes grátis, 14 dias) estão no JSON-LD das páginas de
produto (`shippingDetails` / `hasMerchantReturnPolicy`, em
`scripts/build-product-pages.js`). Se os Termos mudarem, muda lá também.

## Avaliações

A loja **nunca** mostra avaliações inventadas: é proibido (Diretiva
Omnibus, DL 109-G/2021) e o Google penaliza. Enquanto `REVIEWS` estiver
vazio, não aparecem estrelas em lado nenhum — nem na grelha, nem na
página, nem nos dados para o Google.

### O circuito

1. **Depois de entregar**, manda esta mensagem no WhatsApp (troca o
   `<slug>` pelo da peça, ex. `o-mundo-real`, ou `colecao-completa` no
   pack):

   > Olá! A tua encomenda já chegou? Se tiveres um minuto, conta-me o que
   > achaste — ajuda muito quem ainda está a decidir:
   > https://alexffb.com/loja/avaliar/?p=<slug>
   > Obrigado 🙏

2. O cliente preenche o formulário em `/loja/avaliar/`. Chega-te um email
   ("Nova avaliação (5/5) — o-mundo-real") com a avaliação e **uma linha
   pronta a colar**.

3. Confirma na conversa de WhatsApp que a pessoa te comprou mesmo essa
   peça. Se não comprou, ignora o email.

4. Cola a linha dentro de `REVIEWS` em `assets/shop-catalog.js`:

   ```js
   var REVIEWS = [
     { product: "o-mundo-real", name: "Rita", city: "Lisboa", rating: 5, date: "2026-10-12", text: "..." },
   ];
   ```

5. Corre `node scripts/build-product-pages.js` e faz push. A partir daí
   aparecem as estrelas no cartão da grelha, a nota junto ao título, a
   secção "Avaliações" na página da peça e o `aggregateRating` para o
   Google.

**Publica as más também.** Esconder as negativas é tão enganador como
inventar as positivas, e a página promete que "cada uma é confirmada
contra uma encomenda real" — não que só aparecem as boas.

Só o primeiro nome vai para a loja (é o que o formulário promete a quem
escreve). O email traz o nome completo só para poderes confirmar a
encomenda.

### Requisitos

`/api/review` precisa de `RESEND_API_KEY` e `CONTACT_NOTIFY_EMAIL` (as
mesmas das encomendas). Sem elas, o formulário diz ao cliente que não
conseguiu enviar, em vez de agradecer por uma avaliação que se perdeu.
