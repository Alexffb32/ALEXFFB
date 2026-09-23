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

  /* ------------------------------------------------------------------ *
   * Quando é que o painel pode aparecer                                  *
   * ------------------------------------------------------------------ *
   * O painel muda de forma conforme o ecrã (ver shop.css): em ecrã largo
   * é uma coluna fixa à direita, em ecrã estreito é uma gaveta que sobe
   * do fundo. Isso muda o que ele tapa, e portanto quando pode abrir.
   *
   * "#shop-soon" bloqueia sempre: tem o mesmo formulário de newsletter, e
   * o painel por cima roubava-lhe o clique — foi um bug real.
   *
   * A história e a lista de quem saiu só bloqueiam a coluna lateral: é
   * texto para ler, e a lista tem uma coluna encostada à direita que
   * desaparecia por baixo do painel. A gaveta de fundo não tem esse
   * problema — tapa uma faixa em baixo, que se fecha. */
  var FORM_ZONE = ["shop-soon"];
  var READING_ZONES = ["shop-story", "shop-dropouts"];

  function isSidePanel() {
    return !window.matchMedia || !window.matchMedia("(max-width: 640px)").matches;
  }

  function zoneVisible(id) {
    var el = document.getElementById(id);
    return !!el && el.getAttribute("data-shop-news-quiet") === "1";
  }

  function anyVisible(ids) {
    for (var i = 0; i < ids.length; i++) if (zoneVisible(ids[i])) return true;
    return false;
  }

  /* `strict` distingue as duas chamadas: durante a navegação normal
     respeita-se tudo; à saída da página só o formulário interessa, porque
     tapar texto a quem já está de saída não custa nada. */
  function blocked(strict) {
    if (anyVisible(FORM_ZONE)) return true;
    return strict && isSidePanel() && anyVisible(READING_ZONES);
  }

  if ("IntersectionObserver" in window) {
    var zoneObserver = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          entries[i].target.setAttribute("data-shop-news-quiet", entries[i].isIntersecting ? "1" : "0");
        }
        if (blocked(true) && panel.classList.contains("is-open")) closePanel(panel);
      },
      { threshold: 0.15 },
    );
    FORM_ZONE.concat(READING_ZONES).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) zoneObserver.observe(el);
    });
  }

  var shown = false;

  function maybeShow(strict) {
    // Estando bloqueado não marca como mostrado: fica à espera de uma
    // janela livre em vez de gastar a única oportunidade que tem.
    if (shown || blocked(strict)) return;
    shown = true;
    open();
    window.removeEventListener("scroll", onScroll);
  }

  /* Limiar medido contra o início da zona de leitura, não contra a altura
     do documento. Uma percentagem da página inteira deixou de servir
     quando a loja ganhou a história e a lista: 35% passou a cair já lá
     dentro, e o painel nunca mais chegava a abrir. */
  function triggerPoint() {
    var first = document.getElementById(READING_ZONES[0]) || document.getElementById(FORM_ZONE[0]);
    if (first) {
      var top = first.getBoundingClientRect().top + window.scrollY;
      if (top > 0) return top * 0.55;
    }
    var max = document.body.scrollHeight - window.innerHeight;
    return max > 0 ? max * 0.35 : Infinity;
  }

  function onScroll() {
    if (window.scrollY > triggerPoint()) maybeShow(true);
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  /* Em ecrã largo a página é densa e o scroll quase nunca deixa uma janela
     livre, por isso há um segundo gatilho: o rato a sair pelo topo da
     janela, o sinal clássico de quem vai fechar o separador. Não precisa
     de guarda para toque — um dedo nunca gera um mouseout com o cursor
     acima do topo da página. */
  document.addEventListener("mouseout", function (e) {
    if (e.relatedTarget || e.clientY > 0) return;
    maybeShow(false);
  });

  setTimeout(function () {
    maybeShow(true);
  }, 25000);
})();
