/* Carrinho da loja: guardado só neste dispositivo (localStorage), sem
   checkout automático nenhum — a compra fecha-se sempre por WhatsApp
   diretamente com o Alexandre. Partilhado pela página de produto, pelo
   carrinho e pelo contador no cabeçalho. */
(function (global) {
  "use strict";

  var STORAGE_KEY = "abwl_shop_cart_v1";
  var WHATSAPP_NUMBER = "447441488100";

  function readCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeCart(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      /* localStorage indisponível (modo privado, etc.) — o carrinho
         simplesmente não persiste entre visitas; nada mais a fazer. */
    }
    document.dispatchEvent(new CustomEvent("abwl:cart-changed"));
  }

  /* A colocação da assinatura faz parte da identidade da linha: duas
     t-shirts iguais assinadas em sítios diferentes são dois artigos
     diferentes e não podem somar quantidades. */
  function itemId(designSlug, format, color, size, signature) {
    var sig = global.ShopCatalog.signatureKey(signature) || "-";
    return [designSlug, format, color, size, sig].join("__");
  }

  function addItem(designSlug, format, color, size, qty, signature) {
    qty = qty || 1;
    signature = global.ShopCatalog.normalizeSignature(signature);
    var items = readCart();
    var id = itemId(designSlug, format, color, size, signature);
    var existing = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        existing = items[i];
        break;
      }
    }
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        id: id,
        designSlug: designSlug,
        format: format,
        color: color,
        size: size,
        qty: qty,
        signature: signature,
      });
    }
    writeCart(items);
  }

  function setQty(id, qty) {
    var items = readCart();
    items = items
      .map(function (it) {
        if (it.id !== id) return it;
        it.qty = qty;
        return it;
      })
      .filter(function (it) {
        return it.qty > 0;
      });
    writeCart(items);
  }

  function removeItem(id) {
    writeCart(readCart().filter(function (it) { return it.id !== id; }));
  }

  function clearCart() {
    writeCart([]);
  }

  function count() {
    return readCart().reduce(function (sum, it) { return sum + it.qty; }, 0);
  }

  function priceOf(it) {
    var f = global.ShopCatalog.FORMATS[it.format];
    return f ? f.price : 0;
  }

  function totals(items) {
    items = items || readCart();
    var total = 0;
    var comboSavings = 0;
    // "comboSavings" ficou com o nome antigo por compatibilidade com o
    // registo de encomendas; conta agora a poupança real de combos E packs
    // face às mesmas peças compradas em separado.
    items.forEach(function (it) {
      total += priceOf(it) * it.qty;
      comboSavings += global.ShopCatalog.bundleSavings(it.format) * it.qty;
    });
    return {
      total: Math.round(total * 100) / 100,
      comboSavings: Math.round(comboSavings * 100) / 100,
    };
  }

  /**
   * Monta a mensagem de WhatsApp pronta a enviar, no mesmo formato para
   * um artigo só (comprar direto na página de produto) ou vários (o
   * carrinho todo).
   *
   * Sem emojis: alguns (o burro, por exemplo) são de versões recentes do
   * Unicode e aparecem como quadrado vazio em muitos telemóveis — o que
   * dava mensagens com símbolos partidos. Aqui só se usa texto simples e
   * o *negrito* do próprio WhatsApp.
   *
   * As fotos vão como LINK e não como anexo: um link wa.me só transporta
   * texto, é uma limitação do próprio WhatsApp. O link abre a foto do
   * produto e o WhatsApp mostra pré-visualização do primeiro.
   */
  function buildWhatsAppMessage(items) {
    var catalog = global.ShopCatalog;
    var lines = [];
    lines.push("*ANTI UNIVERSITY SOCIAL CLUB*");
    lines.push(items.length > 1 ? "*Nova encomenda (carrinho)*" : "*Nova encomenda*");
    lines.push("alexffb.com/loja");
    lines.push("");
    lines.push(
      items.length > 1
        ? "Olá! Gostaria de encomendar os artigos do meu carrinho."
        : "Olá! Gostaria de encomendar este artigo.",
    );
    lines.push("");

    var totalsInfo = totals(items);

    items.forEach(function (it, idx) {
      var design = catalog.findDesign(it.designSlug);
      var format = catalog.FORMATS[it.format];
      var unit = format ? format.price : 0;
      var subtotal = Math.round(unit * it.qty * 100) / 100;
      lines.push("*" + (idx + 1) + ". " + (design ? design.name : it.designSlug) + "*");
      lines.push("Formato: " + (format ? format.label : it.format));
      if (design && design.includes) {
        lines.push(
          "Inclui: " +
            design.includes
              .map(function (slug) {
                var d = catalog.findDesign(slug);
                return d ? d.name : slug;
              })
              .join(", "),
        );
      }
      lines.push("Cor: " + (it.color === "branco" ? "Branco" : "Preto"));
      lines.push("Tamanho: " + it.size);
      lines.push("Quantidade: " + it.qty);
      lines.push("Preço unitário: " + catalog.money(unit));
      lines.push("Subtotal: *" + catalog.money(subtotal) + "*");
      var sig = catalog.normalizeSignature(it.signature);
      if (sig) {
        lines.push("Assinatura à mão: " + catalog.signaturePlace(sig));
        // O mockup é um URL de imagem normal, gerado a pedido a partir
        // destes números — o WhatsApp mostra-o como pré-visualização.
        lines.push("Mockup: " + catalog.mockupUrl(it.designSlug, sig));
      }
      var photo = catalog.photoUrl(it.designSlug);
      if (photo) lines.push("Foto: " + photo);
      lines.push("");
    });

    lines.push("*TOTAL: " + catalog.money(totalsInfo.total) + "*");
    if (totalsInfo.comboSavings > 0) {
      lines.push("Poupança em packs e combos: " + catalog.money(totalsInfo.comboSavings));
    }
    lines.push("");
    lines.push("Portes grátis para Portugal Continental. Morada e pagamento combinamos aqui.");

    return lines.join("\n");
  }

  function whatsAppUrl(items) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(buildWhatsAppMessage(items));
  }

  /**
   * Regista a encomenda no Supabase (via /api/shop-order, que também
   * envia uma cópia por email ao Alexandre pela Resend) e só depois abre
   * o WhatsApp — sem dados pessoais nenhuns, é só o conteúdo do
   * carrinho, já que o nome/morada ficam a ser trocados diretamente no
   * WhatsApp entre o cliente e o Alexandre.
   */
  function checkoutViaWhatsApp(items) {
    var totalsInfo = totals(items);
    var payload = {
      items: items.map(function (it) {
        var design = global.ShopCatalog.findDesign(it.designSlug);
        var format = global.ShopCatalog.FORMATS[it.format];
        var sig = global.ShopCatalog.normalizeSignature(it.signature);
        return {
          signature: sig,
          mockupUrl: sig ? global.ShopCatalog.mockupUrl(it.designSlug, sig) : null,
          designSlug: it.designSlug,
          designName: design ? design.name : it.designSlug,
          format: it.format,
          formatLabel: format ? format.label : it.format,
          color: it.color,
          size: it.size,
          qty: it.qty,
          unitPrice: format ? format.price : 0,
        };
      }),
      total: totalsInfo.total,
      comboSavings: totalsInfo.comboSavings,
    };

    fetch("/api/shop-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(function () {
      /* Best-effort: mesmo que o registo falhe, a encomenda não se pode
         perder — o WhatsApp abre-se de qualquer forma. */
    });

    window.open(whatsAppUrl(items), "_blank", "noopener,noreferrer");
  }

  global.ShopCart = {
    read: readCart,
    add: addItem,
    setQty: setQty,
    remove: removeItem,
    clear: clearCart,
    count: count,
    totals: totals,
    itemId: itemId,
    buildWhatsAppMessage: buildWhatsAppMessage,
    whatsAppUrl: whatsAppUrl,
    checkoutViaWhatsApp: checkoutViaWhatsApp,
  };
})(window);
