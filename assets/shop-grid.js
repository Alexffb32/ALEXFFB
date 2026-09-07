(function () {
  "use strict";

  var catalog = window.ShopCatalog;
  var grid = document.getElementById("shop-grid");
  if (!grid || !catalog) return;

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".shop-tab"));
  var activeCategory = "all";

  var PRODUCTS = [];
  catalog.DESIGNS.forEach(function (design) {
    Object.keys(catalog.FORMATS).forEach(function (formatKey) {
      PRODUCTS.push({ design: design, format: formatKey });
    });
  });

  function render() {
    grid.innerHTML = "";
    PRODUCTS.filter(function (p) {
      if (activeCategory === "all") return true;
      return catalog.FORMATS[p.format].category === activeCategory;
    }).forEach(function (p) {
      var format = catalog.FORMATS[p.format];
      var url = "/loja/produto/?d=" + encodeURIComponent(p.design.slug) + "&f=" + encodeURIComponent(p.format);
      var a = document.createElement("a");
      a.className = "shop-card";
      a.href = url;
      a.innerHTML =
        '<div class="shop-card-media"><div class="shop-card-placeholder">' +
        escapeHtml(p.design.name) +
        "<br><span style=\"opacity:.6;font-weight:600\">(mockup a caminho)</span></div></div>" +
        '<p class="shop-card-title">' +
        escapeHtml(p.design.name) +
        " — " +
        escapeHtml(format.label) +
        "</p>" +
        '<p class="shop-card-price">' +
        catalog.money(format.price) +
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

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("is-active"); });
      tab.classList.add("is-active");
      activeCategory = tab.getAttribute("data-category");
      render();
    });
  });

  render();
})();
