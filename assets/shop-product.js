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

  var isBundle = !!design.bundle;
  var allowedFormats = catalog.formatsFor(designSlug);
  var initialFormat = params.get("f");
  if (allowedFormats.indexOf(initialFormat) === -1) initialFormat = allowedFormats[0];

  // O M vem escolhido: é o tamanho mais pedido, e assim o botão de compra
  // funciona à primeira, sem obrigar a ir procurar os tamanhos.
  var state = {
    format: initialFormat,
    color: "branco",
    size: catalog.DEFAULT_SIZE,
    signature: null,
  };

  function colorLabel(id) {
    for (var i = 0; i < catalog.COLORS.length; i++) {
      if (catalog.COLORS[i].id === id) return catalog.COLORS[i].label;
    }
    return id;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderMedia() {
    document.getElementById("shop-main-media").innerHTML =
      '<span class="shop-product-badge-discount" id="shop-media-discount">' +
      catalog.discountLabel(state.format) + "</span>" +
      (isBundle
        ? '<img src="' + design.image + '" alt="As quatro t-shirts da coleção, uma de cada design">' +
          '<span class="shop-media-label">Os 4 designs</span>'
        : '<img src="' + design.image + '" alt="' + escapeHtml(design.name) + ' — vista de costas">' +
          '<span class="shop-media-label">Vista de costas</span>');
  }

  function renderFormats() {
    var wrap = document.getElementById("shop-formats");
    wrap.innerHTML = "";
    allowedFormats.forEach(function (key) {
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
        updateStickyCta();
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
        updateStickyCta();
      });
      wrap.appendChild(btn);
    });
  }

  function updateButtons() {
    var ready = !!state.size;
    document.getElementById("shop-add-cart").disabled = !ready;
    document.getElementById("shop-buy-whatsapp").disabled = !ready;
    document.getElementById("shop-size-hint").hidden = ready;
    ["shop-sticky-cta-buy", "shop-sticky-cta-add"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = !ready;
    });
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
      if (offEl) offEl.textContent = catalog.discountLabel(state.format);
      var mediaBadge = document.getElementById("shop-media-discount");
      if (mediaBadge) mediaBadge.textContent = catalog.discountLabel(state.format);
    }, 140);

    // O Pack não tem "preço de lançamento": o riscado é o preço real das
    // 4 t-shirts em separado, e é isso que a etiqueta diz.
    var tag = document.getElementById("shop-price-tag");
    if (tag) tag.textContent = state.format === "pack4" ? "4 t-shirts em separado" : "Preço de lançamento";

    var comboNote = document.getElementById("shop-combo-savings");
    var saving = catalog.bundleSavings(state.format);
    if (saving > 0) {
      comboNote.hidden = false;
      comboNote.innerHTML =
        "Poupas <strong>" +
        catalog.money(saving) +
        "</strong> face a comprar " +
        (state.format === "pack4" ? "as 4 t-shirts" : "a t-shirt e o hoodie") +
        " em separado.";
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
    var metaEl = document.getElementById("shop-sticky-cta-meta");
    if (metaEl) metaEl.textContent = colorLabel(state.color) + " · " + (state.size || "sem tamanho");
  }

  /* Upsell do pack em cada página de design: é aqui que comprar uma peça
     só tem de começar a parecer a escolha cara. */
  function renderUpsell() {
    var el = document.getElementById("shop-upsell");
    if (!el || isBundle || !catalog.BUNDLES.length) return;
    var b = catalog.BUNDLES[0];
    var fk = catalog.formatsFor(b.slug)[0];
    var f = catalog.FORMATS[fk];
    el.href = catalog.productPath(b.slug);
    el.innerHTML =
      '<img src="' + b.image + '" alt="" loading="lazy">' +
      "<span><strong>Leva os 4 designs por " + catalog.money(f.price) + "</strong>" +
      "Cada t-shirt fica a " + catalog.money(Math.round((f.price / f.pieces) * 100) / 100) +
      " — poupas " + catalog.money(catalog.bundleSavings(fk)) + ".</span>" +
      '<span class="shop-upsell-go" aria-hidden="true">→</span>';
    el.hidden = false;
  }

  /* Estrelas antes do título e lista de avaliações — só existem quando há
     avaliações reais no catálogo. */
  function renderReviews() {
    var list = catalog.reviewsFor(designSlug);
    var summary = catalog.ratingSummary(list);
    if (!summary) return;
    var avg = summary.average.toFixed(1).replace(".", ",");
    var rating = document.getElementById("shop-rating");
    if (rating) {
      rating.innerHTML =
        '<span class="shop-stars" aria-hidden="true">★★★★★</span>' +
        "<strong>" + avg + "</strong> · " + summary.count + (summary.count === 1 ? " avaliação" : " avaliações");
      rating.setAttribute("aria-label", avg + " em 5, " + summary.count + " avaliações — ver avaliações");
      rating.hidden = false;
    }
    var section = document.getElementById("avaliacoes");
    var wrap = document.getElementById("shop-reviews-list");
    if (!section || !wrap) return;
    wrap.innerHTML = list
      .map(function (r) {
        var n = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 0)));
        return (
          '<figure class="shop-review">' +
          '<span class="shop-stars" aria-label="' + n + ' em 5">' + "★★★★★".slice(0, n) +
          '<span class="shop-stars-off">' + "★★★★★".slice(0, 5 - n) + "</span></span>" +
          "<blockquote>" + escapeHtml(r.text) + "</blockquote>" +
          "<figcaption>" + escapeHtml(r.name) + (r.city ? ", " + escapeHtml(r.city) : "") + "</figcaption>" +
          "</figure>"
        );
      })
      .join("");
    section.hidden = false;
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
  document.getElementById("shop-product-desc").innerHTML =
    "<p>" + escapeHtml(design.description) + "</p>" +
    (isBundle
      ? '<ul class="shop-includes">' +
        design.includes
          .map(function (slug) {
            var d = catalog.findDesign(slug);
            return d
              ? '<li><a href="' + catalog.productPath(d.slug) + '">' + escapeHtml(d.name) + "</a></li>"
              : "";
          })
          .join("") +
        "</ul>"
      : "");

  // O editor desenha a assinatura sobre o mockup de UM design; no pack há
  // quatro. Quem quiser as peças do pack assinadas pede no WhatsApp.
  if (isBundle) {
    var sigBox = document.getElementById("shop-signature");
    if (sigBox) {
      sigBox.innerHTML =
        '<p class="shop-sig-pack">Queres as 4 assinadas à mão? Diz-nos na conversa de WhatsApp — continua a ser oferta.</p>';
    }
  }

  // Editor de assinatura: opcional, e só entra se o script tiver
  // carregado — a página continua a vender sem ele.
  var signatureRoot = document.getElementById("shop-signature");
  if (signatureRoot && window.ShopSignature && !isBundle) {
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
    var title = document.getElementById("shop-more-title");
    if (title && isBundle) title.textContent = "Ou escolhe um só";
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
  renderUpsell();
  renderReviews();
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

  var stickyAddBtn = document.getElementById("shop-sticky-cta-add");
  if (stickyAddBtn) {
    stickyAddBtn.addEventListener("click", function () {
      if (!state.size) return;
      cart.add(designSlug, state.format, state.color, state.size, 1, state.signature);
      showToast(state.signature ? "Adicionado ao carrinho, já assinado." : "Adicionado ao carrinho.");
    });
  }

  var stickyBuyBtn = document.getElementById("shop-sticky-cta-buy");
  if (stickyBuyBtn) {
    stickyBuyBtn.addEventListener("click", function () {
      if (!state.size) return;
      cart.checkoutViaWhatsApp([currentItem()]);
    });
  }

  // A barra fixa aparece sempre que os botões principais NÃO estão no
  // ecrã — antes de lá chegares e depois de passares por eles. Como o
  // tamanho já vem escolhido, dá para comprar sem nunca ter de ir à
  // procura dos botões. Quando eles estão à vista, a barra sai, para não
  // haver dois "Comprar" no ecrã ao mesmo tempo.
  var stickyBar = document.getElementById("shop-sticky-cta");
  var actionsEl = document.querySelector(".shop-actions");
  if (stickyBar && actionsEl && "IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        var visible = !entries[0].isIntersecting;
        stickyBar.classList.toggle("is-visible", visible);
        document.body.classList.toggle("has-sticky-cta", visible);
      },
      { threshold: 0 },
    ).observe(actionsEl);
  }
})();
