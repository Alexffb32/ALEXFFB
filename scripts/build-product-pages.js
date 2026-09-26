#!/usr/bin/env node
/* Gera uma página estática por produto (cada design e cada pack) em
 * /loja/<slug>/.
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

function priceRange(slug) {
  const prices = catalog.formatsFor(slug).map((k) => catalog.FORMATS[k].price);
  return { low: Math.min.apply(null, prices), high: Math.max.apply(null, prices), count: prices.length };
}

/* Portes e trocas, tal como estão nos Termos (4.4 e 4.6). O Google usa
   isto para mostrar "Envio grátis" e a política de devolução no resultado;
   se os Termos mudarem, muda aqui também. */
const SHIPPING = {
  "@type": "OfferShippingDetails",
  shippingRate: { "@type": "MonetaryAmount", value: "0.00", currency: "EUR" },
  shippingDestination: { "@type": "DefinedRegion", addressCountry: "PT" },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
    transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 4, unitCode: "DAY" },
  },
};

const RETURNS = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "PT",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 14,
  returnMethod: "https://schema.org/ReturnByMail",
  // Na livre resolução (Termos 4.5) os portes de devolução são do cliente;
  // a troca de tamanho (4.6) é grátis, mas é troca, não devolução.
  returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
};

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
  const { low, high, count } = priceRange(design.slug);
  const seller = { "@type": "Person", name: "Alexandre Bento", url: SITE };

  // Um pack tem um preço só; um design tem vários formatos.
  const offers =
    count === 1
      ? {
          "@type": "Offer",
          url: url,
          priceCurrency: "EUR",
          price: low.toFixed(2),
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
          shippingDetails: SHIPPING,
          hasMerchantReturnPolicy: RETURNS,
          seller: seller,
        }
      : {
          "@type": "AggregateOffer",
          url: url,
          priceCurrency: "EUR",
          lowPrice: low.toFixed(2),
          highPrice: high.toFixed(2),
          offerCount: count,
          availability: "https://schema.org/InStock",
          shippingDetails: SHIPPING,
          hasMerchantReturnPolicy: RETURNS,
          seller: seller,
        };

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
    offers: offers,
  };

  /* Avaliações só entram quando existem mesmo (catalog.REVIEWS). Nunca
     inventadas: além de ilegal, dá penalização manual no Google. */
  const reviews = catalog.reviewsFor(design.slug);
  const summary = catalog.ratingSummary(reviews);
  if (summary) {
    product.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: summary.average.toFixed(1),
      reviewCount: summary.count,
      bestRating: "5",
      worstRating: "1",
    };
    product.review = reviews.slice(0, 10).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      datePublished: r.date,
      reviewBody: r.text,
      reviewRating: { "@type": "Rating", ratingValue: String(r.rating), bestRating: "5", worstRating: "1" },
    }));
  }

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

  const products = catalog.allProducts();
  products.forEach((design) => {
    if (!design.seoTitle || !design.seoDescription) {
      throw new Error("produto sem seoTitle/seoDescription: " + design.slug);
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

  console.log("\n" + products.length + " páginas de produto geradas a partir de loja/produto/index.html");
}

main();
