/* Catálogo da loja "Anti University Social Club". Fonte única de verdade
   para preços/produtos, partilhada pela grid, pela página de produto e
   pelo carrinho — para nunca haver dois sítios a inventar o mesmo preço.

   Imagens: 1 foto de costas por design (assets/products/), a mesma é
   usada seja qual for o formato escolhido (T-shirt/Hoodie/Combo) até
   haver fotos separadas por peça.

   Preços: sem "preço riscado" nenhum — nenhuma destas peças foi vendida
   antes, por isso mostrar um preço "anterior" ao lado seria uma prática
   de preços proibida em Portugal (Decreto-Lei 109-G/2021, que exige que
   o preço riscado tenha sido mesmo praticado nos últimos 30 dias). Em
   vez disso, cada preço tem só a etiqueta "Preço de lançamento". A única
   poupança real e legítima mostrada é a do Combo, que compara o preço
   do combo com a soma real de comprar as duas peças em separado — uma
   comparação genuína entre dois preços atuais, não um desconto fictício. */
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

  var FORMATS = {
    tshirt: { label: "T-shirt Oversized", price: 17.99, category: "t-shirts" },
    hoodie: { label: "Hoodie Oversized", price: 27.99, category: "sweatshirts" },
    combo: { label: "Combo — Hoodie + T-shirt", price: 39.99, category: "combos" },
  };

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

  global.ShopCatalog = {
    DESIGNS: DESIGNS,
    FORMATS: FORMATS,
    COLORS: COLORS,
    SIZES: SIZES,
    comboSavings: comboSavings,
    findDesign: findDesign,
    money: money,
    productTitle: productTitle,
  };
})(window);
