(function () {
  "use strict";

  var catalog = window.ShopCatalog;
  var cart = window.ShopCart;
  if (!catalog || !cart) return;

  // Cada design tem a sua página estática (/loja/<slug>/), que declara o
  // design em data-design no <html>. O ?d= antigo continua a funcionar
  // como alternativa, para não partir links já partilhados.
  var params = new URLSearchParams(window.location.search);
  var designSlug =
    document.documentElement.getAttribute("data-design") ||
    params.get("d") ||
    catalog.DESIGNS[0].slug;
  var design = catalog.findDesign(designSlug);

  if (!design) {
    document.getElementById("shop-product-root").innerHTML =
      '<p>Produto não encontrado. <a href="/loja/">Voltar à loja</a>.</p>';
    return;
  }

  var initialFormat = params.get("f");
  if (!catalog.FORMATS[initialFormat]) initialFormat = "tshirt";

  var state = { format: initialFormat, color: "branco", size: null, signature: null };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderMedia() {
    document.getElementById("shop-main-media").innerHTML =
      '<span class="shop-product-badge-discount">' + catalog.DISCOUNT_LABEL + "</span>" +
      '<img src="' + design.image + '" alt="' + escapeHtml(design.name) + " — vista de costas\">" +
      '<span class="shop-media-label">Vista de costas</span>';
  }

  function renderFormats() {
    var wrap = document.getElementById("shop-formats");
    wrap.innerHTML = "";
    Object.keys(catalog.FORMATS).forEach(function (key) {
      var f = catalog.FORMATS[key];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shop-format" + (state.format === key ? " is-selected" : "");
      btn.textContent = f.label + " — " + catalog.money(f.price);
      btn.addEventListener("click", function () {
        state.format = key;
        renderFormats();
        updatePrice();
      });
      wrap.appendChild(btn);
    });
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
    var stickyBuy = document.getElementById("shop-sticky-cta-buy");
    if (stickyBuy) stickyBuy.disabled = !ready;
  }

  function updatePrice() {
    var format = catalog.FORMATS[state.format];
    // O <title> fica como vem do HTML. Reescrevê-lo a cada mudança de
    // formato apagava o título otimizado da página em qualquer motor que
    // execute JavaScript, e o Google executa.
    document.getElementById("shop-product-category").textContent = "Anti University Social Club — " + format.label;

    var priceEl = document.getElementById("shop-price");
    var wasEl = document.getElementById("shop-price-was");
    var offEl = document.getElementById("shop-price-off");
    priceEl.classList.add("is-updating");
    if (wasEl) wasEl.classList.add("is-updating");
    setTimeout(function () {
      priceEl.textContent = catalog.money(format.price);
      priceEl.classList.remove("is-updating");
      if (wasEl) {
        wasEl.textContent = catalog.money(format.fullPrice);
        wasEl.classList.remove("is-updating");
      }
      if (offEl) offEl.textContent = catalog.DISCOUNT_LABEL;
    }, 140);

    var comboNote = document.getElementById("shop-combo-savings");
    if (state.format === "combo") {
      comboNote.hidden = false;
      comboNote.innerHTML =
        "Poupas <strong>" +
        catalog.money(catalog.comboSavings()) +
        "</strong> face a comprar a t-shirt e o hoodie em separado.";
    } else {
      comboNote.hidden = true;
    }

    updateStickyCta();
  }

  function updateStickyCta() {
    var format = catalog.FORMATS[state.format];
    var titleEl = document.getElementById("shop-sticky-cta-title");
    var priceEl = document.getElementById("shop-sticky-cta-price");
    if (!titleEl || !priceEl) return;
    titleEl.textContent = design.name + " — " + format.label;
    priceEl.textContent = catalog.money(format.price);
  }

  function currentItem() {
    return {
      designSlug: designSlug,
      format: state.format,
      color: state.color,
      size: state.size,
      qty: 1,
      signature: state.signature,
    };
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

  document.getElementById("shop-product-title").textContent = design.name;
  document.getElementById("shop-product-desc").innerHTML = "<p>" + escapeHtml(design.description) + "</p>";

  // Editor de assinatura: opcional, e só entra se o script tiver
  // carregado — a página continua a vender sem ele.
  var signatureRoot = document.getElementById("shop-signature");
  if (signatureRoot && window.ShopSignature) {
    var editor = window.ShopSignature.create(signatureRoot, { designSlug: designSlug });
    if (editor) {
      editor.onChange(function (value) {
        state.signature = value;
      });
    }
  }

  /* Ligações para os outros designs. Sem isto cada página de produto era
     uma folha solta: só se chegava lá pela grelha, e de lá não se ia para
     lado nenhum a não ser para trás. Ligadas entre si, o rastreador passa
     de uma para as outras e quem visita também. */
  function renderOtherDesigns() {
    var section = document.getElementById("shop-more");
    var wrap = document.getElementById("shop-more-grid");
    if (!section || !wrap) return;
    var others = catalog.DESIGNS.filter(function (d) {
      return d.slug !== designSlug;
    });
    if (!others.length) return;
    wrap.innerHTML = others
      .map(function (d) {
        return (
          '<a class="shop-more-card" href="' + catalog.productPath(d.slug) + '">' +
          '<span class="shop-more-media"><img src="' + d.image + '" alt="' +
          escapeHtml(d.name) + ' — t-shirt vista de costas" loading="lazy"></span>' +
          '<span class="shop-more-name">' + escapeHtml(d.name) + "</span>" +
          "</a>"
        );
      })
      .join("");
    section.hidden = false;
  }

  renderMedia();
  renderFormats();
  renderSwatches();
  renderSizes();
  renderOtherDesigns();
  updateButtons();
  updatePrice();

  document.getElementById("shop-add-cart").addEventListener("click", function () {
    if (!state.size) return;
    cart.add(designSlug, state.format, state.color, state.size, 1, state.signature);
    showToast(state.signature ? "Adicionado ao carrinho, já assinado." : "Adicionado ao carrinho.");
  });

  document.getElementById("shop-buy-whatsapp").addEventListener("click", function () {
    if (!state.size) return;
    cart.checkoutViaWhatsApp([currentItem()]);
  });

  var stickyBuyBtn = document.getElementById("shop-sticky-cta-buy");
  if (stickyBuyBtn) {
    stickyBuyBtn.addEventListener("click", function () {
      if (!state.size) return;
      cart.checkoutViaWhatsApp([currentItem()]);
    });
  }

  // Mostra a barra fixa de compra (mobile) só depois de os botões
  // principais terem sido vistos e saírem do ecrã para cima — nunca antes
  // disso, senão apareceria logo à entrada na página só por os botões
  // ainda não terem sido alcançados por scroll (estarem abaixo da dobra
  // não é o mesmo que teres passado por eles).
  var stickyBar = document.getElementById("shop-sticky-cta");
  var actionsEl = document.querySelector(".shop-actions");
  if (stickyBar && actionsEl && "IntersectionObserver" in window) {
    var hasBeenSeen = false;
    new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) hasBeenSeen = true;
        stickyBar.classList.toggle("is-visible", hasBeenSeen && !entries[0].isIntersecting);
      },
      { threshold: 0 },
    ).observe(actionsEl);
  }
})();
