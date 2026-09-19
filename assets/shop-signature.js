/* Editor de assinatura: o cliente arrasta, roda e escala a assinatura
   sobre a peça, como quem aplica um sticker numa skin de CS.

   O que o editor manipula são os quatro números definidos em
   ShopCatalog.SIGNATURE (x, y, z, r) mais a face escolhida. Nada aqui
   desenha para um canvas: o palco é HTML (uma <img> de fundo e uma
   camada por cima), o que dá arrasto suave e texto nítido em qualquer
   densidade de ecrã. A imagem final da encomenda é desenhada noutro
   sítio — em /api/mockup, no servidor — mas com o mesmo sistema de
   coordenadas normalizado, por isso os dois mostram exatamente o mesmo.

   Interação:
   - arrastar a assinatura move-a (o centro nunca sai da zona imprimível)
   - arrastar a pega roda e escala ao mesmo tempo, a partir do centro
   - dois dedos fazem pinça e torção
   - com foco no teclado: setas movem, + / - escalam, [ / ] rodam
*/
(function (global) {
  "use strict";

  var catalog = global.ShopCatalog;
  if (!catalog) return;

  var CFG = catalog.SIGNATURE;

  function clamp(n, lo, hi) {
    return n < lo ? lo : n > hi ? hi : n;
  }

  function angleOf(dx, dy) {
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  }

  /* Normaliza um ângulo para -180..180, para os controlos e o que fica
     guardado nunca divergirem (por exemplo 190 e -170 são o mesmo). */
  function wrapAngle(deg) {
    while (deg > 180) deg -= 360;
    while (deg < -180) deg += 360;
    return deg;
  }

  function create(root, options) {
    options = options || {};

    var state = {
      enabled: false,
      designSlug: options.designSlug || catalog.DESIGNS[0].slug,
      side: CFG.defaults.side,
      x: CFG.defaults.x,
      y: CFG.defaults.y,
      z: CFG.defaults.z,
      r: CFG.defaults.r,
    };

    var listeners = [];

    var els = {
      stage: root.querySelector("[data-sig-stage]"),
      base: root.querySelector("[data-sig-base]"),
      layer: root.querySelector("[data-sig-layer]"),
      ink: root.querySelector("[data-sig-ink]"),
      handle: root.querySelector("[data-sig-handle]"),
      sides: root.querySelector("[data-sig-sides]"),
      size: root.querySelector("[data-sig-size]"),
      rotation: root.querySelector("[data-sig-rotation]"),
      reset: root.querySelector("[data-sig-reset]"),
      toggle: root.querySelector("[data-sig-toggle]"),
      panel: root.querySelector("[data-sig-panel]"),
    };

    if (!els.stage || !els.layer || !els.ink) return null;

    els.ink.src = CFG.image;

    function emit() {
      var value = getValue();
      for (var i = 0; i < listeners.length; i++) listeners[i](value);
    }

    function getValue() {
      if (!state.enabled) return null;
      return catalog.normalizeSignature({
        side: state.side,
        x: state.x,
        y: state.y,
        z: state.z,
        r: state.r,
      });
    }

    /* --------------------------------------------------------------- *
     * Desenho                                                          *
     * --------------------------------------------------------------- */

    function paintLayer() {
      els.layer.style.left = state.x * 100 + "%";
      els.layer.style.top = state.y * 100 + "%";
      els.layer.style.width = state.z * 100 + "%";
      els.layer.style.transform = "translate(-50%, -50%) rotate(" + state.r + "deg)";
    }

    function paintBase() {
      var src = catalog.mockupBase(state.designSlug, state.side);
      if (els.base.getAttribute("src") !== src) els.base.setAttribute("src", src);
      els.base.alt =
        state.side === "front"
          ? "Frente da t-shirt, lisa"
          : "Costas da t-shirt, com o design da coleção";
    }

    function paintControls() {
      if (els.size) els.size.value = String(Math.round(state.z * 1000));
      if (els.rotation) els.rotation.value = String(Math.round(state.r));
      if (els.sides) {
        var btns = els.sides.querySelectorAll("[data-sig-side]");
        for (var i = 0; i < btns.length; i++) {
          var on = btns[i].getAttribute("data-sig-side") === state.side;
          btns[i].classList.toggle("is-selected", on);
          btns[i].setAttribute("aria-pressed", on ? "true" : "false");
        }
      }
    }

    function paint() {
      paintBase();
      paintLayer();
      paintControls();
    }

    /* --------------------------------------------------------------- *
     * Geometria                                                        *
     * --------------------------------------------------------------- */

    function stageRect() {
      return els.stage.getBoundingClientRect();
    }

    /* Centro da assinatura em píxeis do ecrã. */
    function centerPx(rect) {
      return { x: rect.left + state.x * rect.width, y: rect.top + state.y * rect.height };
    }

    /* Meia-caixa da assinatura já rodada, em píxeis. É isto que permite
       manter a assinatura INTEIRA dentro do tecido, e não só o seu
       centro: inclinada, uma assinatura larga ocupa muito mais altura do
       que a imagem original. A proporção vem da imagem carregada, para
       continuar certo se a assinatura for trocada por outra. */
    function halfExtentPx(rect) {
      var aspect = els.ink.naturalWidth && els.ink.naturalHeight
        ? els.ink.naturalWidth / els.ink.naturalHeight
        : 900 / 185;
      var w = state.z * rect.width;
      var h = w / aspect;
      var rad = (state.r * Math.PI) / 180;
      var c = Math.abs(Math.cos(rad));
      var s = Math.abs(Math.sin(rad));
      return { w: (c * w + s * h) / 2, h: (s * w + c * h) / 2 };
    }

    /* Limites do centro para a peça ficar toda dentro da zona
       imprimível. Se a assinatura for maior do que a zona num dos eixos,
       fica centrada nesse eixo — é o menos mau, e só acontece nos
       tamanhos/ângulos extremos. */
    function centerBounds(rect) {
      var a = CFG.area;
      var half = halfExtentPx(rect);
      var hx = half.w / rect.width;
      var hy = half.h / rect.height;
      var lo = { x: a.x0 + hx, y: a.y0 + hy };
      var hi = { x: a.x1 - hx, y: a.y1 - hy };
      if (lo.x > hi.x) lo.x = hi.x = (a.x0 + a.x1) / 2;
      if (lo.y > hi.y) lo.y = hi.y = (a.y0 + a.y1) / 2;
      return { lo: lo, hi: hi };
    }

    /* Volta a pôr o centro dentro dos limites. Chamado sempre que o
       tamanho ou o ângulo mudam, porque qualquer um deles pode passar a
       fazer a assinatura transbordar sem o centro se ter mexido. */
    function reclamp(rect) {
      var b = centerBounds(rect || stageRect());
      state.x = clamp(state.x, b.lo.x, b.hi.x);
      state.y = clamp(state.y, b.lo.y, b.hi.y);
    }

    function setCenterFromPx(px, py, rect) {
      var b = centerBounds(rect);
      state.x = clamp((px - rect.left) / rect.width, b.lo.x, b.hi.x);
      state.y = clamp((py - rect.top) / rect.height, b.lo.y, b.hi.y);
    }

    /* --------------------------------------------------------------- *
     * Arrasto, rotação e escala                                        *
     * --------------------------------------------------------------- */

    var pointers = {};
    var drag = null;
    var pinch = null;

    function activePointers() {
      var out = [];
      for (var id in pointers) if (pointers.hasOwnProperty(id)) out.push(pointers[id]);
      return out;
    }

    function beginPinch() {
      var p = activePointers();
      if (p.length < 2) return;
      var rect = stageRect();
      var dx = p[1].x - p[0].x;
      var dy = p[1].y - p[0].y;
      pinch = {
        dist: Math.sqrt(dx * dx + dy * dy) || 1,
        angle: angleOf(dx, dy),
        z: state.z,
        r: state.r,
        midX: (p[0].x + p[1].x) / 2,
        midY: (p[0].y + p[1].y) / 2,
        cx: state.x,
        cy: state.y,
        rect: rect,
      };
      drag = null;
    }

    function updatePinch() {
      var p = activePointers();
      if (!pinch || p.length < 2) return;
      var dx = p[1].x - p[0].x;
      var dy = p[1].y - p[0].y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      state.z = clamp((dist / pinch.dist) * pinch.z, CFG.limits.minZ, CFG.limits.maxZ);
      state.r = wrapAngle(pinch.r + (angleOf(dx, dy) - pinch.angle));

      // A pinça também arrasta: o ponto médio dos dois dedos leva a
      // assinatura com ele, que é o que se espera de um gesto destes.
      var midX = (p[0].x + p[1].x) / 2;
      var midY = (p[0].y + p[1].y) / 2;
      state.x = pinch.cx + (midX - pinch.midX) / pinch.rect.width;
      state.y = pinch.cy + (midY - pinch.midY) / pinch.rect.height;
      reclamp(pinch.rect);
      paintLayer();
      paintControls();
    }

    function onPointerDown(e, mode) {
      if (!state.enabled) return;
      pointers[e.pointerId] = { id: e.pointerId, x: e.clientX, y: e.clientY };
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {
        /* alguns browsers recusam a captura em elementos já libertados —
           o arrasto continua a funcionar pelos eventos no documento */
      }

      if (activePointers().length >= 2) {
        beginPinch();
        e.preventDefault();
        return;
      }

      var rect = stageRect();
      var c = centerPx(rect);
      if (mode === "handle") {
        var dx = e.clientX - c.x;
        var dy = e.clientY - c.y;
        drag = {
          mode: "handle",
          rect: rect,
          startDist: Math.sqrt(dx * dx + dy * dy) || 1,
          startAngle: angleOf(dx, dy),
          z: state.z,
          r: state.r,
        };
      } else {
        drag = {
          mode: "move",
          rect: rect,
          offX: c.x - e.clientX,
          offY: c.y - e.clientY,
        };
      }
      root.classList.add("is-dragging");
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (!pointers[e.pointerId]) return;
      pointers[e.pointerId].x = e.clientX;
      pointers[e.pointerId].y = e.clientY;

      if (pinch) {
        updatePinch();
        e.preventDefault();
        return;
      }
      if (!drag) return;

      if (drag.mode === "move") {
        setCenterFromPx(e.clientX + drag.offX, e.clientY + drag.offY, drag.rect);
      } else {
        var c = centerPx(drag.rect);
        var dx = e.clientX - c.x;
        var dy = e.clientY - c.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        state.z = clamp((dist / drag.startDist) * drag.z, CFG.limits.minZ, CFG.limits.maxZ);
        state.r = wrapAngle(drag.r + (angleOf(dx, dy) - drag.startAngle));
        reclamp(drag.rect);
      }
      paintLayer();
      paintControls();
      e.preventDefault();
    }

    function onPointerUp(e) {
      delete pointers[e.pointerId];
      if (activePointers().length < 2) pinch = null;
      if (activePointers().length === 0) {
        if (drag) emit();
        drag = null;
        root.classList.remove("is-dragging");
      }
    }

    els.layer.addEventListener("pointerdown", function (e) {
      onPointerDown(e, "move");
    });
    if (els.handle) {
      els.handle.addEventListener("pointerdown", function (e) {
        e.stopPropagation();
        onPointerDown(e, "handle");
      });
    }
    document.addEventListener("pointermove", onPointerMove, { passive: false });
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);

    /* --------------------------------------------------------------- *
     * Teclado — o arrasto com rato não pode ser a única forma de fazer  *
     * isto, senão quem navega por teclado fica de fora.                 *
     * --------------------------------------------------------------- */

    els.layer.addEventListener("keydown", function (e) {
      if (!state.enabled) return;
      var step = e.shiftKey ? 0.04 : 0.01;
      var a = CFG.area;
      var handled = true;
      switch (e.key) {
        case "ArrowLeft": state.x = clamp(state.x - step, a.x0, a.x1); break;
        case "ArrowRight": state.x = clamp(state.x + step, a.x0, a.x1); break;
        case "ArrowUp": state.y = clamp(state.y - step, a.y0, a.y1); break;
        case "ArrowDown": state.y = clamp(state.y + step, a.y0, a.y1); break;
        case "+": case "=":
          state.z = clamp(state.z + 0.02, CFG.limits.minZ, CFG.limits.maxZ); break;
        case "-": case "_":
          state.z = clamp(state.z - 0.02, CFG.limits.minZ, CFG.limits.maxZ); break;
        case "[": state.r = wrapAngle(state.r - (e.shiftKey ? 15 : 3)); break;
        case "]": state.r = wrapAngle(state.r + (e.shiftKey ? 15 : 3)); break;
        default: handled = false;
      }
      if (!handled) return;
      e.preventDefault();
      reclamp();
      paintLayer();
      paintControls();
      emit();
    });

    /* --------------------------------------------------------------- *
     * Controlos                                                        *
     * --------------------------------------------------------------- */

    if (els.sides) {
      els.sides.addEventListener("click", function (e) {
        var btn = e.target.closest ? e.target.closest("[data-sig-side]") : null;
        if (!btn) return;
        state.side = btn.getAttribute("data-sig-side") === "front" ? "front" : "back";
        paint();
        emit();
      });
    }

    if (els.size) {
      els.size.addEventListener("input", function () {
        state.z = clamp(Number(els.size.value) / 1000, CFG.limits.minZ, CFG.limits.maxZ);
        reclamp();
        paintLayer();
      });
      els.size.addEventListener("change", emit);
    }

    if (els.rotation) {
      els.rotation.addEventListener("input", function () {
        state.r = wrapAngle(Number(els.rotation.value));
        reclamp();
        paintLayer();
      });
      els.rotation.addEventListener("change", emit);
    }

    if (els.reset) {
      els.reset.addEventListener("click", function () {
        state.x = CFG.defaults.x;
        state.y = CFG.defaults.y;
        state.z = CFG.defaults.z;
        state.r = CFG.defaults.r;
        paint();
        emit();
      });
    }

    function setEnabled(on) {
      state.enabled = !!on;
      root.classList.toggle("is-enabled", state.enabled);
      if (els.panel) els.panel.hidden = !state.enabled;
      if (els.toggle) els.toggle.checked = state.enabled;
      if (state.enabled) paint();
      emit();
    }

    if (els.toggle) {
      els.toggle.addEventListener("change", function () {
        setEnabled(els.toggle.checked);
      });
    }

    function setDesign(slug) {
      state.designSlug = slug;
      paintBase();
    }

    function setValue(sig) {
      var n = catalog.normalizeSignature(sig);
      if (!n) {
        setEnabled(false);
        return;
      }
      state.side = n.side;
      state.x = n.x;
      state.y = n.y;
      state.z = n.z;
      state.r = n.r;
      setEnabled(true);
      reclamp();
      paint();
    }

    paint();
    setEnabled(false);

    return {
      getValue: getValue,
      setValue: setValue,
      setDesign: setDesign,
      setEnabled: setEnabled,
      onChange: function (fn) {
        listeners.push(fn);
      },
    };
  }

  global.ShopSignature = { create: create };
})(window);
