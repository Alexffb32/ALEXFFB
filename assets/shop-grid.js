(function () {
  "use strict";

  var catalog = window.ShopCatalog;
  var grid = document.getElementById("shop-grid");
  if (!grid || !catalog) return;

  function render() {
    grid.innerHTML = "";
    catalog.DESIGNS.forEach(function (design, i) {
      var url = "/loja/produto/?d=" + encodeURIComponent(design.slug);
      var a = document.createElement("a");
      a.className = "shop-card";
      a.href = url;
      a.style.setProperty("--i", String(i));
      var tshirt = catalog.FORMATS.tshirt;
      a.innerHTML =
        '<div class="shop-card-media">' +
        '<span class="shop-badge">Edição Limitada</span>' +
        '<span class="shop-badge-discount">' +
        catalog.DISCOUNT_LABEL +
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
