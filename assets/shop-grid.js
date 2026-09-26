(function () {
  "use strict";

  var catalog = window.ShopCatalog;
  var grid = document.getElementById("shop-grid");
  var bundleSlot = document.getElementById("shop-bundle");
  if (!grid || !catalog) return;

  /* Estrelas de um produto — só existe quando há avaliações reais. */
  function ratingHtml(slug) {
    var summary = catalog.ratingSummary(catalog.reviewsFor(slug));
    if (!summary) return "";
    return (
      '<span class="shop-card-rating" aria-label="' + summary.average.toFixed(1).replace(".", ",") +
      " em 5, " + summary.count + (summary.count === 1 ? " avaliação" : " avaliações") + '">' +
      '<span class="shop-stars" aria-hidden="true">★★★★★</span>' +
      summary.average.toFixed(1).replace(".", ",") + " (" + summary.count + ")</span>"
    );
  }

  /* O pack aparece antes dos designs soltos, em destaque: é a forma de
     comprar uma peça só começar a parecer a opção cara. */
  function renderBundles() {
    if (!bundleSlot || !catalog.BUNDLES.length) return;
    bundleSlot.innerHTML = catalog.BUNDLES.map(function (b) {
      var fk = catalog.formatsFor(b.slug)[0];
      var f = catalog.FORMATS[fk];
      var saving = catalog.bundleSavings(fk);
      return (
        '<a class="shop-bundle" href="' + catalog.productPath(b.slug) + '">' +
        '<div class="shop-bundle-media">' +
        '<span class="shop-badge-discount">' + catalog.discountLabel(fk) + "</span>" +
        '<img src="' + b.image + '" alt="As quatro t-shirts da coleção, uma de cada design" loading="lazy">' +
        "</div>" +
        '<div class="shop-bundle-body">' +
        '<p class="shop-eyebrow">O melhor preço da loja</p>' +
        '<p class="shop-bundle-title">' + escapeHtml(b.name) + "</p>" +
        ratingHtml(b.slug) +
        '<p class="shop-bundle-text">Os 4 designs em t-shirt oversized, no tamanho e na cor que escolheres. ' +
        "Cada t-shirt sai a " + catalog.money(Math.round((f.price / f.pieces) * 100) / 100) + ".</p>" +
        '<p class="shop-bundle-price">' +
        '<span class="shop-card-price-now">' + catalog.money(f.price) + "</span>" +
        '<span class="shop-card-price-was">' + catalog.money(f.fullPrice) + "</span>" +
        "</p>" +
        '<p class="shop-bundle-saving">Poupas <strong>' + catalog.money(saving) + "</strong> face a comprar as 4 em separado</p>" +
        '<span class="shop-btn shop-btn-primary shop-bundle-cta">Ver o pack</span>' +
        "</div>" +
        "</a>"
      );
    }).join("");
  }

  function render() {
    renderBundles();
    grid.innerHTML = "";
    catalog.DESIGNS.forEach(function (design, i) {
      var url = catalog.productPath(design.slug);
      var a = document.createElement("a");
      a.className = "shop-card";
      a.href = url;
      a.style.setProperty("--i", String(i));
      var tshirt = catalog.FORMATS.tshirt;
      a.innerHTML =
        '<div class="shop-card-media">' +
        '<span class="shop-badge-discount">' +
        catalog.discountLabel("tshirt") +
        "</span>" +
        '<img src="' +
        design.image +
        '" alt="' +
        escapeHtml(design.name) +
        ' — vista de costas" loading="lazy">' +
        '<span class="shop-card-quickview">Ver Produto' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
        "</span>" +
        "</div>" +
        '<div class="shop-card-info">' +
        '<p class="shop-card-title">' +
        escapeHtml(design.name) +
        "</p>" +
        '<span class="shop-card-dots">' +
        colorDots() +
        "</span>" +
        "</div>" +
        ratingHtml(design.slug) +
        '<p class="shop-card-price">' +
        '<span class="shop-card-price-now">' +
        catalog.money(tshirt.price) +
        "</span>" +
        '<span class="shop-card-price-was">' +
        catalog.money(tshirt.fullPrice) +
        "</span>" +
        "</p>";
      grid.appendChild(a);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Bolinhas das cores disponíveis (preto/branco), como nos cards de
  // qualquer loja — dá a informação sem obrigar a abrir o produto.
  function colorDots() {
    return catalog.COLORS.map(function (c) {
      return (
        '<span class="shop-card-dot" style="background:' +
        c.swatch +
        '" title="' +
        escapeHtml(c.label) +
        '" aria-label="' +
        escapeHtml(c.label) +
        '"></span>'
      );
    }).join("");
  }

  render();
})();
