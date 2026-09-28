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

      // Peça assinada: mostra o mockup real em vez da foto do catálogo,
      // para o cliente confirmar a colocação antes de fechar a compra.
      var sig = catalog.normalizeSignature(it.signature);
      var mediaSrc = sig ? catalog.mockupUrl(it.designSlug, sig) : design ? design.image : "";
      var sigLine = sig
        ? '<p class="shop-item-sig">Assinada à mão <strong>' +
          escapeHtml(catalog.signaturePlace(sig)) +
          "</strong></p>"
        : "";

      var row = document.createElement("div");
      row.className = "shop-cart-item";
      row.innerHTML =
        '<div class="shop-cart-item-media"><img src="' +
        escapeHtml(mediaSrc) +
        '" alt="' +
        escapeHtml(design ? design.name : it.designSlug) +
        (sig ? " — mockup com a assinatura" : "") +
        '"></div>' +
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
        sigLine +
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
        '<button type="button" class="shop-btn shop-btn-secondary" data-action="buy-single">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.1-.7.1-.8 1-.9 1.2-.3.2-.6.1a8 8 0 0 1-2.3-1.5 8.7 8.7 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.4-.5.2-.3v-.3c0-.1-.6-1.6-.9-2.1-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3 2 3.1 4.8 4.3c2.9 1.2 2.9.8 3.4.8s1.7-.7 2-1.4.3-1.2.2-1.4-.2-.2-.5-.3zM12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7 4z"/></svg>' +
        "Comprar este artigo pelo WhatsApp" +
        "</button>" +
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
    renderPackHint(items);

    document.getElementById("shop-buy-all").onclick = function () {
      cart.checkoutViaWhatsApp(cart.read());
    };
  }

  /* Quem já tem 2 ou mais t-shirts soltas fica a saber quanto falta para o
     pack dos 4 — ou quanto está a pagar a mais, se o pack já sai mais
     barato do que o que tem no carrinho. */
  function renderPackHint(items) {
    var el = document.getElementById("shop-cart-upsell");
    if (!el || !catalog.BUNDLES.length) return;
    var b = catalog.BUNDLES[0];
    var fk = catalog.formatsFor(b.slug)[0];
    var pack = catalog.FORMATS[fk];
    var hasPack = items.some(function (it) { return it.format === fk; });
    var tshirts = items
      .filter(function (it) { return it.format === "tshirt"; })
      .reduce(function (n, it) { return n + it.qty; }, 0);
    if (hasPack || tshirts < 2 || tshirts > pack.pieces) {
      el.hidden = true;
      return;
    }
    var paying = Math.round(tshirts * catalog.FORMATS.tshirt.price * 100) / 100;
    var diff = Math.round((pack.price - paying) * 100) / 100;
    el.href = catalog.productPath(b.slug);
    el.innerHTML =
      '<img src="' + b.image + '" alt="" loading="lazy">' +
      "<span>" +
      (diff > 0
        ? "<strong>Por mais " + catalog.money(diff) + " levas os 4 designs.</strong>" +
          "Tens " + tshirts + " t-shirts no carrinho; o pack com as 4 custa " + catalog.money(pack.price) + "."
        : "<strong>O pack sai mais barato: poupas " + catalog.money(-diff) + ".</strong>" +
          "As 4 t-shirts em pack custam " + catalog.money(pack.price) + ", em vez de " + catalog.money(paying) + ".") +
      "</span>" +
      '<span class="shop-upsell-go" aria-hidden="true">→</span>';
    el.hidden = false;
  }

  document.getElementById("shop-clear-cart").addEventListener("click", function () {
    cart.clear();
  });

  document.addEventListener("abwl:cart-changed", render);
  render();
})();
