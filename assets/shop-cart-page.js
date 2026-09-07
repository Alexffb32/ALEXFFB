(function () {
  "use strict";

  var catalog = window.ShopCatalog;
  var cart = window.ShopCart;
  if (!catalog || !cart) return;

  var listEl = document.getElementById("shop-cart-list");
  var emptyEl = document.getElementById("shop-cart-empty");
  var layoutEl = document.getElementById("shop-cart-layout");
  var summaryEl = document.getElementById("shop-summary-rows");
  var totalEl = document.getElementById("shop-summary-total-value");
  var savingsRow = document.getElementById("shop-summary-savings-row");
  var savingsValue = document.getElementById("shop-summary-savings-value");

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function render() {
    var items = cart.read();

    if (!items.length) {
      layoutEl.hidden = true;
      emptyEl.hidden = false;
      return;
    }
    layoutEl.hidden = false;
    emptyEl.hidden = true;

    listEl.innerHTML = "";
    items.forEach(function (it) {
      var design = catalog.findDesign(it.designSlug);
      var format = catalog.FORMATS[it.format];
      var unit = format ? format.price : 0;
      var subtotal = Math.round(unit * it.qty * 100) / 100;

      var row = document.createElement("div");
      row.className = "shop-cart-item";
      row.innerHTML =
        '<div class="shop-cart-item-media"><div class="shop-card-placeholder" style="font-size:10px;padding:8px;' +
        (it.color === "branco" ? "color:#111;" : "") +
        '">' +
        escapeHtml(design ? design.name : it.designSlug) +
        "</div></div>" +
        "<div>" +
        '<p class="shop-cart-item-title">' +
        escapeHtml(design ? design.name : it.designSlug) +
        " — " +
        escapeHtml(format ? format.label : it.format) +
        "</p>" +
        '<p class="shop-cart-item-meta">Cor: ' +
        (it.color === "branco" ? "Branco" : "Preto") +
        " · Tamanho: " +
        escapeHtml(it.size) +
        "</p>" +
        '<div class="shop-qty">' +
        '<button type="button" data-action="dec">−</button>' +
        '<span>' + it.qty + '</span>' +
        '<button type="button" data-action="inc">+</button>' +
        "</div>" +
        '<button type="button" class="shop-remove" data-action="remove">Remover</button>' +
        "</div>" +
        '<div class="shop-item-price">' +
        catalog.money(subtotal) +
        "</div>" +
        '<div class="shop-cart-item-buy">' +
        '<button type="button" class="shop-btn shop-btn-secondary" data-action="buy-single">Comprar este artigo pelo WhatsApp</button>' +
        "</div>";

      row.querySelector('[data-action="dec"]').addEventListener("click", function () {
        cart.setQty(it.id, Math.max(0, it.qty - 1));
      });
      row.querySelector('[data-action="inc"]').addEventListener("click", function () {
        cart.setQty(it.id, it.qty + 1);
      });
      row.querySelector('[data-action="remove"]').addEventListener("click", function () {
        cart.remove(it.id);
      });
      row.querySelector('[data-action="buy-single"]').addEventListener("click", function () {
        cart.checkoutViaWhatsApp([it]);
      });

      listEl.appendChild(row);
    });

    var totalsInfo = cart.totals(items);
    var totalQty = items.reduce(function (sum, it) { return sum + it.qty; }, 0);

    summaryEl.innerHTML =
      '<div class="shop-summary-row"><span>Artigos no carrinho</span><strong>' +
      totalQty +
      "</strong></div>";

    if (totalsInfo.comboSavings > 0) {
      savingsRow.hidden = false;
      savingsValue.textContent = "-" + catalog.money(totalsInfo.comboSavings);
    } else {
      savingsRow.hidden = true;
    }

    totalEl.textContent = catalog.money(totalsInfo.total);

    document.getElementById("shop-buy-all").onclick = function () {
      cart.checkoutViaWhatsApp(cart.read());
    };
  }

  document.getElementById("shop-clear-cart").addEventListener("click", function () {
    cart.clear();
  });

  document.addEventListener("abwl:cart-changed", render);
  render();
})();
