/* Catálogo da loja "Anti University Social Club". Fonte única de verdade
   para preços/produtos, partilhada pela grid, pela página de produto e
   pelo carrinho — para nunca haver dois sítios a inventar o mesmo preço.

   Imagens: 1 foto de costas por design (assets/products/), a mesma é
   usada seja qual for o formato escolhido (T-shirt/Hoodie/Combo) até
   haver fotos separadas por peça.

   Preços: cada formato tem `price` (o preço da campanha de lançamento) e
   `fullPrice` (o preço de tabela, exatamente o dobro — daí o -50%).
   ATENÇÃO LEGAL, a confirmar do lado do negócio: o Decreto-Lei
   109-G/2021 só permite anunciar uma redução de preço sobre um preço que
   tenha sido realmente praticado, e obriga a indicar o preço mais baixo
   dos 30 dias anteriores. Como esta coleção é nova, o `fullPrice` só é
   defensável se for mesmo o preço a que as peças passam a ser vendidas
   quando a campanha de lançamento terminar — não pode ser um valor de
   referência inventado só para mostrar o desconto.
   A poupança do Combo continua a ser uma comparação genuína entre dois
   preços atuais (combo vs. as duas peças em separado). */
(function (global) {
  "use strict";

  var DESIGNS = [
    {
      slug: "anti-university-social-club",
      name: "Anti University Social Club",
      short: "O símbolo da coleção.",
      description:
        "O logo principal da drop: um burro de arreios dentro de um símbolo de proibido. Para quem decidiu não esperar por autorização de ninguém.",
      image: "/assets/products/anti-university-social-club-back.webp",
    },
    {
      slug: "o-mundo-real",
      name: "O Mundo Real",
      short: "O mundo real não quer saber do teu 1º diploma.",
      description:
        "Um burro formado, touca e diploma na boca. O mundo real não vem com boletim de notas — vem com resultados.",
      image: "/assets/products/o-mundo-real-back.webp",
    },
    {
      slug: "gente-qualificada",
      name: "Gente Qualificada",
      short: "Vou precisar de gente qualificada.",
      description:
        "Uma mão com anel de coroa segura um peão de xadrez em forma de burro acorrentado. “Continuem a estudar... vou precisar de gente qualificada a trabalhar para mim.”",
      image: "/assets/products/gente-qualificada-back.webp",
    },
    {
      slug: "no-degree-required",
      name: "No Degree Required",
      short: "Nenhum diploma é necessário.",
      description:
        "Três homens de fato, montados em burros. Um deles aponta à câmara. No degree required.",
      image: "/assets/products/no-degree-required-back.jpg",
    },
  ];

  /* fullPrice é o preço de tabela da peça (o valor a que passa a ser
     vendida depois do lançamento) — a promoção de lançamento é sempre
     exatamente -50% sobre ele. Para o desconto poder ser anunciado assim,
     esse preço de tabela tem de ser mesmo o praticado depois desta
     campanha (ver nota legal no topo). */
  var FORMATS = {
    tshirt: { label: "T-shirt Oversized", price: 17.99, fullPrice: 35.98, category: "t-shirts" },
    hoodie: { label: "Hoodie Oversized", price: 27.99, fullPrice: 55.98, category: "sweatshirts" },
    combo: { label: "Combo — Hoodie + T-shirt", price: 39.99, fullPrice: 79.98, category: "combos" },
  };

  var DISCOUNT_LABEL = "-50%";

  var COLORS = [
    { id: "preto", label: "Preto", swatch: "#0a0a0a" },
    { id: "branco", label: "Branco", swatch: "#f5f4ef" },
  ];

  var SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

  function comboSavings() {
    var separate = FORMATS.tshirt.price + FORMATS.hoodie.price;
    var combo = FORMATS.combo.price;
    return Math.round((separate - combo) * 100) / 100;
  }

  function findDesign(slug) {
    for (var i = 0; i < DESIGNS.length; i++) {
      if (DESIGNS[i].slug === slug) return DESIGNS[i];
    }
    return null;
  }

  function money(n) {
    return n.toFixed(2).replace(".", ",") + " €";
  }

  function productTitle(designSlug, format) {
    var d = findDesign(designSlug);
    var f = FORMATS[format];
    if (!d || !f) return "";
    return d.name + " — " + f.label;
  }

  /* URL absoluto da foto, para poder ir na mensagem de WhatsApp (uma
     mensagem de wa.me é só texto — não leva anexos — por isso o que se
     envia é o link da foto, que o WhatsApp mostra em pré-visualização). */
  function photoUrl(designSlug) {
    var d = findDesign(designSlug);
    if (!d) return "";
    var origin = "https://alexffb.com";
    try {
      if (global.location && /^https?:$/.test(global.location.protocol)) {
        origin = global.location.origin;
      }
    } catch (e) {
      /* mantém o domínio de produção como fallback */
    }
    return origin + d.image;
  }

  global.ShopCatalog = {
    DESIGNS: DESIGNS,
    FORMATS: FORMATS,
    COLORS: COLORS,
    SIZES: SIZES,
    DISCOUNT_LABEL: DISCOUNT_LABEL,
    comboSavings: comboSavings,
    findDesign: findDesign,
    money: money,
    photoUrl: photoUrl,
    productTitle: productTitle,
  };
})(window);
