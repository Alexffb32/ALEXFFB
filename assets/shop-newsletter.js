/* Captação de email na loja: o formulário do bloco "Próxima coleção" e o
   painel lateral com a foto da coleção. Os dois usam o mesmo endpoint da
   waitlist geral (/api/waitlist, list="newsletter"), que exige
   consentimento explícito — daí a checkbox obrigatória, validada também
   do lado do servidor. */
(function () {
  "use strict";

  var DISMISS_KEY = "abwl_shop_news_panel_v1";
  var DISMISS_DAYS = 30;

  function setStatus(form, text, isError) {
    var el = form.querySelector("[data-shop-news-status]");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("is-error", !!isError);
  }

  function rememberDismissal() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch (e) {
      /* modo privado: o painel volta a aparecer na próxima visita */
    }
  }

  function closePanel(panelEl) {
    panelEl.classList.remove("is-open");
    panelEl.setAttribute("aria-hidden", "true");
  }

  function wireForm(form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var emailInput = form.querySelector('input[name="email"]');
      var consentInput = form.querySelector('input[name="consent"]');
      var honeypot = form.querySelector('input[name="company"]');
      var submitBtn = form.querySelector('button[type="submit"]');
      var email = emailInput ? emailInput.value.trim() : "";

      if (!email) {
        setStatus(form, "Escreve o teu email.", true);
        return;
      }
      if (consentInput && !consentInput.checked) {
        setStatus(form, "Tens de aceitar a Política de Privacidade e os Termos e Condições.", true);
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      setStatus(form, "A enviar…", false);

      fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          list: "newsletter",
          consent: true,
          company: honeypot ? honeypot.value : "",
        }),
      })
        .then(function (response) {
          if (response.ok) {
            form.reset();
            setStatus(form, "Estás dentro. Avisamos-te assim que a próxima coleção sair.", false);
            form.classList.add("is-done");
            // Já está na lista: o painel lateral não tem mais nada a pedir.
            rememberDismissal();
            var panelEl = document.getElementById("shop-news-panel");
            if (panelEl && !form.closest("#shop-news-panel")) closePanel(panelEl);
          } else if (response.status === 429) {
            setStatus(form, "Demasiadas tentativas. Tenta daqui a um minuto.", true);
          } else {
            setStatus(form, "Algo correu mal. Tenta novamente daqui a instantes.", true);
          }
        })
        .catch(function () {
          setStatus(form, "Algo correu mal. Tenta novamente daqui a instantes.", true);
        })
        .then(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  var forms = document.querySelectorAll("[data-shop-news-form]");
  for (var i = 0; i < forms.length; i++) {
    wireForm(forms[i]);
  }

  // --- Painel lateral ---------------------------------------------------
  var panel = document.getElementById("shop-news-panel");
  if (!panel) return;

  function dismissedRecently() {
    try {
      var raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) return false;
      var when = parseInt(raw, 10);
      if (!when) return false;
      return Date.now() - when < DISMISS_DAYS * 86400000;
    } catch (e) {
      return false;
    }
  }

  function open() {
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
  }

  function close() {
    closePanel(panel);
    rememberDismissal();
  }

  var closeBtn = panel.querySelector("[data-shop-news-close]");
  if (closeBtn) closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("is-open")) close();
  });

  if (dismissedRecently()) return;

  // O bloco "Próxima coleção" tem o mesmo formulário. Enquanto esse bloco
  // estiver à vista, o painel não abre (e fecha-se se estiver aberto) —
  // senão tapava precisamente o formulário que o utilizador ia usar,
  // bloqueando-lhe o clique.
  var inlineFormVisible = false;
  var soon = document.getElementById("shop-soon");
  if (soon && "IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        inlineFormVisible = entries[0].isIntersecting;
        if (inlineFormVisible && panel.classList.contains("is-open")) closePanel(panel);
      },
      { threshold: 0.15 },
    ).observe(soon);
  }

  // Aparece depois de haver algum sinal de interesse — 35% da página
  // percorrida ou 25 segundos — em vez de interromper logo à entrada.
  var shown = false;
  function maybeShow() {
    if (shown || inlineFormVisible) return;
    shown = true;
    open();
    window.removeEventListener("scroll", onScroll);
  }
  function onScroll() {
    var max = document.body.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    if (window.scrollY / max > 0.35) maybeShow();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  setTimeout(maybeShow, 25000);
})();
