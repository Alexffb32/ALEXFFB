/* Feedback nos botões que fazem uma ação de verdade: um spinner curto
 * que se torna um visto. Genérico de propósito — usa-se tanto nos
 * botões da loja (.shop-btn) como no botão da newsletter (.wl-submit),
 * por isso não depende de nenhum dos dois.
 *
 * Contrato do HTML: o botão tem de ter dois filhos,
 *   <span class="btn-icon">…svg…</span><span class="btn-label">Texto</span>
 * Um botão sem esta estrutura (ex: os que abrem o WhatsApp e saem logo
 * da página) não precisa disto — o spinner não faz sentido num clique
 * que já vai levar a pessoa para outro sítio.
 */
(function (global) {
  "use strict";

  var SPINNER =
    '<svg class="btn-spinner" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="40" stroke-dashoffset="14"/></svg>';
  var CHECK =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L19 7"/></svg>';

  function icon(btn) {
    return btn.querySelector(".btn-icon");
  }
  function label(btn) {
    return btn.querySelector(".btn-label");
  }

  /* Ação local e instantânea (ex: adicionar ao carrinho — não há rede,
     é só localStorage). O spinner aparece de imediato — "feedback em
     100ms" — para o clique não parecer que não fez nada, e o visto fica
     um pouco mais, para dar tempo de ser lido. */
  function pulse(btn, opts) {
    opts = opts || {};
    var ic = icon(btn);
    var lb = label(btn);
    if (!ic) return;
    var originalIcon = ic.innerHTML;
    var originalLabel = lb ? lb.textContent : null;

    btn.classList.add("is-busy");
    ic.innerHTML = SPINNER;

    setTimeout(function () {
      btn.classList.remove("is-busy");
      btn.classList.add("is-success");
      ic.innerHTML = CHECK;
      if (lb && opts.doneLabel) lb.textContent = opts.doneLabel;

      setTimeout(function () {
        btn.classList.remove("is-success");
        ic.innerHTML = originalIcon;
        if (lb && originalLabel !== null) lb.textContent = originalLabel;
      }, opts.holdMs || 900);
    }, opts.busyMs || 220);
  }

  /* Ação assíncrona de verdade (um POST). O spinner entra ao clicar e só
     sai quando success()/fail() forem chamados com a resposta real —
     nunca se promete um sucesso antes de ele acontecer. */
  function busy(btn) {
    var ic = icon(btn);
    btn.disabled = true;
    btn.classList.remove("is-success");
    btn.classList.add("is-busy");
    if (ic) {
      if (ic.dataset.original === undefined) ic.dataset.original = ic.innerHTML;
      ic.innerHTML = SPINNER;
    }
  }

  function success(btn, holdMs) {
    var ic = icon(btn);
    btn.classList.remove("is-busy");
    btn.classList.add("is-success");
    if (ic) ic.innerHTML = CHECK;
    setTimeout(function () {
      idle(btn);
    }, holdMs || 1400);
  }

  function idle(btn) {
    var ic = icon(btn);
    btn.disabled = false;
    btn.classList.remove("is-busy", "is-success");
    if (ic && ic.dataset.original !== undefined) ic.innerHTML = ic.dataset.original;
  }

  global.ButtonFeedback = { pulse: pulse, busy: busy, success: success, idle: idle };
})(window);
