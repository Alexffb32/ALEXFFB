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
      a.innerHTML =
        '<div class="shop-card-media">' +
        '<span class="shop-badge">Edição Limitada</span>' +
        '<img src="' +
        design.image +
        '" alt="' +
        escapeHtml(design.name) +
        ' — vista de costas" loading="lazy">' +
        '<span class="shop-card-quickview">Ver Produto' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
        "</span>" +
        "</div>" +
        '<p class="shop-card-title">' +
        escapeHtml(design.name) +
        "</p>" +
        '<p class="shop-card-price">Desde ' +
        catalog.money(catalog.FORMATS.tshirt.price) +
        " · Preço de lançamento</p>";
      grid.appendChild(a);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  render();
})();
