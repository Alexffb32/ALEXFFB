(function () {
  "use strict";

  var catalog = window.ShopCatalog;
  var cart = window.ShopCart;
  if (!catalog || !cart) return;

  var params = new URLSearchParams(window.location.search);
  var designSlug = params.get("d") || catalog.DESIGNS[0].slug;
  var formatKey = params.get("f") || "tshirt";
  var design = catalog.findDesign(designSlug);
  var format = catalog.FORMATS[formatKey];

  if (!design || !format) {
    document.getElementById("shop-product-root").innerHTML =
      '<p>Produto não encontrado. <a href="/loja/">Voltar à loja</a>.</p>';
    return;
  }

  var state = { color: "preto", size: null };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderMedia() {
    var label = state.color === "branco" ? "Branco" : "Preto";
    document.getElementById("shop-main-media").innerHTML =
      '<div class="shop-card-placeholder" style="' +
      (state.color === "branco" ? "color:#111;" : "") +
      '">' +
      escapeHtml(design.name) +
      "<br><span style=\"opacity:.6;font-weight:600\">(mockup a caminho)</span></div>" +
      '<span class="shop-media-label">Vista frontal — ' +
      label +
      "</span>";
  }

  function renderSwatches() {
    var wrap = document.getElementById("shop-swatches");
    wrap.innerHTML = "";
    catalog.COLORS.forEach(function (c) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shop-swatch" + (state.color === c.id ? " is-selected" : "");
      btn.innerHTML =
        '<span class="shop-swatch-dot" style="background:' + c.swatch + '"></span>' + escapeHtml(c.label);
      btn.addEventListener("click", function () {
        state.color = c.id;
        renderSwatches();
        renderMedia();
      });
      wrap.appendChild(btn);
    });
  }

  function renderSizes() {
    var wrap = document.getElementById("shop-sizes");
    wrap.innerHTML = "";
    catalog.SIZES.forEach(function (s) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shop-size" + (state.size === s ? " is-selected" : "");
      btn.textContent = s;
      btn.addEventListener("click", function () {
        state.size = s;
        renderSizes();
        updateButtons();
      });
      wrap.appendChild(btn);
    });
  }

  function updateButtons() {
    var ready = !!state.size;
    document.getElementById("shop-add-cart").disabled = !ready;
    document.getElementById("shop-buy-whatsapp").disabled = !ready;
    document.getElementById("shop-size-hint").hidden = ready;
  }

  function currentItem() {
    return { designSlug: designSlug, format: formatKey, color: state.color, size: state.size, qty: 1 };
  }

  function showToast(text) {
    var toast = document.getElementById("shop-toast");
    toast.textContent = text;
    toast.classList.add("is-visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  document.title = catalog.productTitle(designSlug, formatKey) + ", Anti University Social Club";
  document.getElementById("shop-product-category").textContent = "Anti University Social Club — " + format.label;
  document.getElementById("shop-product-title").textContent = design.name;
  document.getElementById("shop-price").textContent = catalog.money(format.price);
  document.getElementById("shop-product-desc").innerHTML = "<p>" + escapeHtml(design.description) + "</p>";

  var comboNote = document.getElementById("shop-combo-savings");
  if (formatKey === "combo") {
    comboNote.hidden = false;
    comboNote.innerHTML =
      "Poupas <strong>" +
      catalog.money(catalog.comboSavings()) +
      "</strong> face a comprar a t-shirt e o hoodie em separado.";
  } else {
    comboNote.hidden = true;
  }

  renderMedia();
  renderSwatches();
  renderSizes();
  updateButtons();

  document.getElementById("shop-add-cart").addEventListener("click", function () {
    if (!state.size) return;
    cart.add(designSlug, formatKey, state.color, state.size, 1);
    showToast("Adicionado ao carrinho.");
  });

  document.getElementById("shop-buy-whatsapp").addEventListener("click", function () {
    if (!state.size) return;
    cart.checkoutViaWhatsApp([currentItem()]);
  });
})();
