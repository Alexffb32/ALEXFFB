(function () {
  "use strict";

  var catalog = window.ShopCatalog;
  var grid = document.getElementById("shop-grid");
  if (!grid || !catalog) return;

  function render() {
    grid.innerHTML = "";
    catalog.DESIGNS.forEach(function (design) {
      var url = "/loja/produto/?d=" + encodeURIComponent(design.slug);
      var a = document.createElement("a");
      a.className = "shop-card";
      a.href = url;
      a.innerHTML =
        '<div class="shop-card-media"><img src="' +
        design.image +
        '" alt="' +
        escapeHtml(design.name) +
        ' — vista de costas" loading="lazy"></div>' +
        '<p class="shop-card-title">' +
        escapeHtml(design.name) +
        "</p>" +
        '<p class="shop-card-price">Desde ' +
        catalog.money(catalog.FORMATS.tshirt.price) +
        " · Preço de lançamento</p>" +
        '<span class="shop-card-link">Ver produto →</span>';
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
