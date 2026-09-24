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
      seoTitle: "T-shirt Anti University Social Club",
      seoDescription:
        "O logo da coleção: um burro de arreios dentro de um símbolo de proibido. T-shirt ou hoodie oversized, em preto ou branco. Edição limitada, sem reposição.",
      short: "O símbolo da coleção.",
      description:
        "O logo principal da drop: um burro de arreios dentro de um símbolo de proibido. Para quem decidiu não esperar por autorização de ninguém.",
      image: "/assets/products/anti-university-social-club-back.webp",
      mockup: "/assets/mockups/anti-university-social-club.png",
    },
    {
      slug: "o-mundo-real",
      name: "O Mundo Real",
      seoTitle: "T-shirt O Mundo Real",
      seoDescription:
        "\u201cO mundo real não quer saber do teu 1.º diploma.\u201d Um burro formado, de touca e diploma na boca. T-shirt ou hoodie oversized, edição limitada.",
      short: "O mundo real não quer saber do teu 1º diploma.",
      description:
        "Um burro formado, touca e diploma na boca. O mundo real não vem com boletim de notas — vem com resultados.",
      image: "/assets/products/o-mundo-real-back.webp",
      mockup: "/assets/mockups/o-mundo-real.png",
    },
    {
      slug: "gente-qualificada",
      name: "Gente Qualificada",
      seoTitle: "T-shirt Gente Qualificada",
      seoDescription:
        "\u201cContinuem a estudar... vou precisar de gente qualificada a trabalhar para mim.\u201d T-shirt ou hoodie oversized, edição limitada, sem reposição.",
      short: "Vou precisar de gente qualificada.",
      description:
        "Uma mão com anel de coroa segura um peão de xadrez em forma de burro acorrentado. “Continuem a estudar... vou precisar de gente qualificada a trabalhar para mim.”",
      image: "/assets/products/gente-qualificada-back.webp",
      mockup: "/assets/mockups/gente-qualificada.png",
    },
    {
      slug: "no-degree-required",
      name: "No Degree Required",
      seoTitle: "T-shirt No Degree Required",
      seoDescription:
        "Três homens de fato montados em burros, e um a apontar à câmara. No degree required. T-shirt ou hoodie oversized, edição limitada.",
      short: "Nenhum diploma é necessário.",
      description:
        "Três homens de fato, montados em burros. Um deles aponta à câmara. No degree required.",
      image: "/assets/products/no-degree-required-back.webp",
      mockup: "/assets/mockups/no-degree-required.png",
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


  /* ---------------------------------------------------------------- *
   * Assinatura à mão (extra opcional)                                 *
   * ---------------------------------------------------------------- *
   * O cliente escolhe a face (frente ou costas) e arrasta/roda/escala
   * a assinatura sobre a peça, como quem aplica um sticker numa skin
   * de CS. O que fica guardado no carrinho não é uma imagem — são
   * cinco números. A imagem do mockup é depois reconstruída a partir
   * deles, tanto no ecrã (canvas) como no servidor (/api/mockup), o
   * que evita ter de alojar ficheiros em lado nenhum e mantém o
   * carrinho pequeno o suficiente para o localStorage.
   *
   * Sistema de coordenadas (o mesmo nos dois lados):
   *   x, y  centro da assinatura, 0..1 da largura/altura do mockup
   *   z     largura da assinatura, 0..1 da largura do mockup
   *   r     rotação em graus, -180..180
   *   side  "front" | "back"
   *
   * A imagem base é sempre a t-shirt branca: são os únicos mockups
   * que existem por agora. A cor escolhida vai à parte, em texto, na
   * encomenda. */
  var SIGNATURE = {
    image: "/assets/mockups/assinatura.png",
    frontMockup: "/assets/mockups/front.png",
    /* Tamanho da tela dos mockups — todos foram normalizados para isto,
       para a frente e as costas ficarem alinhadas entre si. */
    canvas: { width: 480, height: 512 },
    price: 0,
    defaults: { side: "back", x: 0.5, y: 0.76, z: 0.34, r: -4 },
    limits: { minZ: 0.12, maxZ: 0.52 },
    /* Zona imprimível: o tecido utilizável entre as mangas e abaixo da
       gola. O editor mantém aqui dentro a assinatura inteira, não só o
       centro — mesma ideia do sticker que não sai da arma. Este
       `normalizeSignature` só garante o centro, que é o guarda-costas
       barato; o enquadramento fino, que precisa de saber a proporção da
       imagem, é feito no editor. */
    area: { x0: 0.2, y0: 0.2, x1: 0.8, y1: 0.92 },
  };

  var SIGNATURE_SIDES = [
    { id: "front", label: "Frente" },
    { id: "back", label: "Costas" },
  ];

  function clamp(n, lo, hi) {
    return n < lo ? lo : n > hi ? hi : n;
  }

  /* Põe uma assinatura dentro dos limites válidos e arredonda-a. Passa
     por aqui tudo o que venha do utilizador, do localStorage ou de um
     link partilhado — é o único sítio que decide o que é válido. */
  function normalizeSignature(sig) {
    if (!sig) return null;
    var side = sig.side === "front" ? "front" : "back";
    var a = SIGNATURE.area;
    function round(n, d) {
      var f = Math.pow(10, d);
      return Math.round(n * f) / f;
    }
    var x = Number(sig.x);
    var y = Number(sig.y);
    var z = Number(sig.z);
    var r = Number(sig.r);
    return {
      side: side,
      x: round(clamp(isFinite(x) ? x : SIGNATURE.defaults.x, a.x0, a.x1), 4),
      y: round(clamp(isFinite(y) ? y : SIGNATURE.defaults.y, a.y0, a.y1), 4),
      z: round(clamp(isFinite(z) ? z : SIGNATURE.defaults.z, SIGNATURE.limits.minZ, SIGNATURE.limits.maxZ), 4),
      r: round(clamp(isFinite(r) ? r : SIGNATURE.defaults.r, -180, 180), 1),
    };
  }

  /* A imagem base sobre a qual a assinatura é desenhada: a frente é a
     mesma peça lisa para todos os designs; as costas trazem o desenho. */
  function mockupBase(designSlug, side) {
    if (side === "front") return SIGNATURE.frontMockup;
    var d = findDesign(designSlug);
    return d && d.mockup ? d.mockup : SIGNATURE.frontMockup;
  }

  /* Duas etiquetas: a seca, para botões e tabelas, e a que já traz a
     preposição certa ("nas costas", não "na costas") para entrar a meio
     de uma frase. */
  function signatureLabel(sig) {
    if (!sig) return "";
    return sig.side === "front" ? "Frente" : "Costas";
  }

  function signaturePlace(sig) {
    if (!sig) return "";
    return sig.side === "front" ? "na frente" : "nas costas";
  }

  /* Identidade da colocação, para o carrinho conseguir distinguir duas
     peças iguais assinadas em sítios diferentes. */
  function signatureKey(sig) {
    if (!sig) return "";
    return [sig.side, sig.x, sig.y, sig.z, sig.r].join(",");
  }

  /* URL do mockup gerado no servidor. É determinístico: os mesmos
     números dão sempre a mesma imagem, por isso não é preciso guardar
     nada — o link pode ir direto para o WhatsApp, que o pré-visualiza
     como imagem. */
  function mockupUrl(designSlug, sig) {
    sig = normalizeSignature(sig);
    if (!sig) return "";
    var q =
      "d=" + encodeURIComponent(designSlug) +
      "&s=" + sig.side +
      "&x=" + sig.x +
      "&y=" + sig.y +
      "&z=" + sig.z +
      "&r=" + sig.r;
    return originUrl("/api/mockup") + "?" + q;
  }

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
  function originUrl(path) {
    var origin = "https://alexffb.com";
    try {
      if (global.location && /^https?:$/.test(global.location.protocol)) {
        origin = global.location.origin;
      }
    } catch (e) {
      /* mantém o domínio de produção como fallback */
    }
    return origin + path;
  }

  /* Cada design tem o seu URL próprio (/loja/<slug>/), servido por uma
     página estática com título, descrição e dados estruturados próprios.
     Antes tudo vivia em /loja/produto/?d=<slug>: uma página só, marcada
     como noindex, que o Google nunca podia mostrar. */
  function productPath(designSlug) {
    return "/loja/" + designSlug + "/";
  }

  function productUrl(designSlug) {
    return originUrl(productPath(designSlug));
  }

  function photoUrl(designSlug) {
    var d = findDesign(designSlug);
    if (!d) return "";
    return originUrl(d.image);
  }

  global.ShopCatalog = {
    DESIGNS: DESIGNS,
    FORMATS: FORMATS,
    COLORS: COLORS,
    SIZES: SIZES,
    DISCOUNT_LABEL: DISCOUNT_LABEL,
    SIGNATURE: SIGNATURE,
    SIGNATURE_SIDES: SIGNATURE_SIDES,
    comboSavings: comboSavings,
    findDesign: findDesign,
    mockupBase: mockupBase,
    mockupUrl: mockupUrl,
    normalizeSignature: normalizeSignature,
    signatureKey: signatureKey,
    signatureLabel: signatureLabel,
    signaturePlace: signaturePlace,
    money: money,
    photoUrl: photoUrl,
    productPath: productPath,
    productTitle: productTitle,
    productUrl: productUrl,
  };
})(window);
