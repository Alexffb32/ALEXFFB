#!/usr/bin/env node
/* Gera uma página estática por design em /loja/<slug>/.
 *
 * Porquê: até aqui todos os produtos viviam em /loja/produto/?d=<slug> —
 * uma página só, com um título só, marcada como `noindex`. Do ponto de
 * vista do Google isso é zero páginas de produto. Com um ficheiro por
 * design, cada um tem URL limpo, título, descrição, imagem social e dados
 * estruturados próprios, que é o que permite aparecer nos resultados.
 *
 * O corpo vem todo de loja/produto/index.html (o molde) e os textos vêm
 * de assets/shop-catalog.js (o catálogo). Não há conteúdo duplicado à mão
 * em lado nenhum: mexe-se num sítio e volta-se a correr
 *
 *     node scripts/build-product-pages.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const TEMPLATE = path.join(ROOT, "loja", "produto", "index.html");
const SITE = "https://alexffb.com";
const OG_IMAGE = SITE + "/assets/og-alexffb.jpg";
/* Fim da campanha de lançamento — o mesmo instante que a loja mostra no
   contador. Entra no schema como validade do preço. */
const PRICE_VALID_UNTIL = "2026-10-05";

// O catálogo é um IIFE de browser; corre-se com um `window` de mentira.
global.window = { location: { protocol: "https:", origin: SITE } };
require(path.join(ROOT, "assets", "shop-catalog.js"));
const catalog = global.window.ShopCatalog;

function esc(v) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* O JSON-LD vai dentro de <script>, por isso o que não pode aparecer é a
   sequência que fecha a tag; escapar a barra resolve sem alterar o JSON. */
function jsonld(obj) {
  return JSON.stringify(obj, null, 2).replace(/<\//g, "<\\/");
}

function priceRange() {
  const prices = Object.keys(catalog.FORMATS).map((k) => catalog.FORMATS[k].price);
  return { low: Math.min.apply(null, prices), high: Math.max.apply(null, prices) };
}

const COLLECTION = "Anti University Social Club";

/* O nome de um dos designs É o nome da coleção, e colar o sufixo dava
   "Anti University Social Club | Anti University Social Club". Quando o
   título já diz a coleção, assina-se com o nome próprio. */
function pageTitle(design) {
  return design.seoTitle.indexOf(COLLECTION) !== -1
    ? design.seoTitle + " — Alexandre Bento"
    : design.seoTitle + " | " + COLLECTION;
}

function buildHead(design, url) {
  const title = pageTitle(design);
  const description = design.seoDescription;
  const image = SITE + design.image;
  const { low, high } = priceRange();

  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: design.name,
    description: description,
    image: [image, OG_IMAGE],
    sku: design.slug,
    brand: { "@type": "Brand", name: "Anti University Social Club" },
    category: "Vestuário",
    material: "Algodão",
    offers: {
      "@type": "AggregateOffer",
      url: url,
      priceCurrency: "EUR",
      lowPrice: low.toFixed(2),
      highPrice: high.toFixed(2),
      offerCount: Object.keys(catalog.FORMATS).length,
      availability: "https://schema.org/InStock",
      priceValidUntil: PRICE_VALID_UNTIL,
      seller: { "@type": "Person", name: "Alexandre Bento", url: SITE },
    },
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "Loja", item: SITE + "/loja/" },
      { "@type": "ListItem", position: 3, name: design.name, item: url },
    ],
  };

  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${esc(url)}">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/assets/icons/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
<meta property="og:type" content="product">
<meta property="og:site_name" content="Alexandre Bento">
<meta property="og:locale" content="pt_PT">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<link rel="preload" href="/assets/fonts/inter-display-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/framerusercontent.com/assets/skMcTQFxHJBWhGrOAKtqLE3ho.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts.gstatic.com/s/instrumentserif/v5/jizHRFtNs2ka5fXjeivQ4LroWlx-6zATjnTNgNq55w.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts.css">
<link rel="stylesheet" href="/assets/shop.css">
<script type="application/ld+json">
${jsonld(product)}
</script>
<script type="application/ld+json">
${jsonld(breadcrumbs)}
</script>`;
}

function main() {
  const template = fs.readFileSync(TEMPLATE, "utf8");
  const bodyMatch = template.match(/<body[^>]*>[\s\S]*<\/body>/i);
  if (!bodyMatch) throw new Error("molde sem <body>");
  const body = bodyMatch[0];

  catalog.DESIGNS.forEach((design) => {
    if (!design.seoTitle || !design.seoDescription) {
      throw new Error("design sem seoTitle/seoDescription: " + design.slug);
    }
    const url = SITE + catalog.productPath(design.slug);
    const html =
      "<!DOCTYPE html>\n" +
      `<html lang="pt-PT" data-design="${esc(design.slug)}">\n` +
      "<head>\n" +
      buildHead(design, url) +
      "\n</head>\n" +
      body +
      "\n</html>\n";

    const dir = path.join(ROOT, "loja", design.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), html);
    console.log("escrito  loja/" + design.slug + "/index.html  (" + Math.round(html.length / 1024) + " KB)");
  });

  console.log("\n" + catalog.DESIGNS.length + " páginas de produto geradas a partir de loja/produto/index.html");
}

main();
