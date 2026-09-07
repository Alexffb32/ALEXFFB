/* Carrinho da loja: guardado só neste dispositivo (localStorage), sem
   checkout automático nenhum — a compra fecha-se sempre por WhatsApp
   diretamente com o Alexandre. Partilhado pela página de produto, pelo
   carrinho e pelo contador no cabeçalho. */
(function (global) {
  "use strict";

  var STORAGE_KEY = "abwl_shop_cart_v1";
  var WHATSAPP_NUMBER = "351968398460";
  var PAYMENT_IBAN = "PT50 0036 0011 99100034823 58";
  var PAYMENT_MBWAY = "968 398 460";

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

  function itemId(designSlug, format, color, size) {
    return [designSlug, format, color, size].join("__");
  }

  function addItem(designSlug, format, color, size, qty) {
    qty = qty || 1;
    var items = readCart();
    var id = itemId(designSlug, format, color, size);
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
      items.push({ id: id, designSlug: designSlug, format: format, color: color, size: size, qty: qty });
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
    var comboUnit = global.ShopCatalog.comboSavings();
    items.forEach(function (it) {
      total += priceOf(it) * it.qty;
      if (it.format === "combo") comboSavings += comboUnit * it.qty;
    });
    return {
      total: Math.round(total * 100) / 100,
      comboSavings: Math.round(comboSavings * 100) / 100,
    };
  }

  function colorEmoji(colorId) {
    return colorId === "branco" ? "⚪" : "⚫";
  }

  /**
   * Monta a mensagem de WhatsApp pronta a enviar, no mesmo formato para
   * um artigo só (comprar direto na página de produto) ou vários (o
   * carrinho todo).
   */
  function buildWhatsAppMessage(items) {
    var catalog = global.ShopCatalog;
    var lines = [];
    lines.push("🐺 *ALEXFFB.COM*");
    lines.push("*ANTI UNIVERSITY SOCIAL CLUB*");
    lines.push(items.length > 1 ? "*NOVA ENCOMENDA DO CARRINHO*" : "*NOVA ENCOMENDA*");
    lines.push("");
    lines.push(
      items.length > 1
        ? "Olá! Gostaria de encomendar todos os artigos disponíveis no meu carrinho."
        : "Olá! Gostaria de encomendar este artigo.",
    );
    lines.push("");
    lines.push("📦 *ARTIGOS*");
    lines.push("");

    var totalsInfo = totals(items);

    items.forEach(function (it, idx) {
      var design = catalog.findDesign(it.designSlug);
      var format = catalog.FORMATS[it.format];
      var unit = format ? format.price : 0;
      var subtotal = Math.round(unit * it.qty * 100) / 100;
      lines.push("*ARTIGO " + (idx + 1) + "*");
      lines.push((design ? design.name : it.designSlug) + " — " + (format ? format.label : it.format));
      lines.push("Cor: " + colorEmoji(it.color) + " " + (it.color === "branco" ? "Branco" : "Preto"));
      lines.push("Tamanho: " + it.size);
      lines.push("Quantidade: " + it.qty + " | Preço unitário: " + catalog.money(unit));
      lines.push("*Subtotal: " + catalog.money(subtotal) + "*");
      if (idx < items.length - 1) lines.push("--------------------");
    });

    lines.push("");
    lines.push("💰 *TOTAL: " + catalog.money(totalsInfo.total) + "*");
    if (totalsInfo.comboSavings > 0) {
      lines.push("🎉 *POUPANÇA COM COMBOS: " + catalog.money(totalsInfo.comboSavings) + "*");
    }
    lines.push("");
    lines.push("*Dados para pagamento:*");
    lines.push("");
    lines.push("Transferência bancária: " + PAYMENT_IBAN);
    lines.push("MB WAY: " + PAYMENT_MBWAY);

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
        return {
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
