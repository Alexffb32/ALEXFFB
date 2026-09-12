/* Contadores da loja. Serve qualquer elemento com [data-deadline]:
   - a barra do topo, que escreve tudo numa linha ([data-countdown-out]);
   - o bloco "Próxima coleção", que tem uma caixa por unidade
     ([data-countdown-days] e companhia).
   Assim pode haver mais do que um contador na mesma página, cada um com
   a sua data. */
(function () {
  "use strict";

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function setup(el) {
    var deadline = new Date(el.getAttribute("data-deadline")).getTime();
    if (!deadline) return;

    var out = el.querySelector("[data-countdown-out]");
    var parts = {
      days: el.querySelector("[data-countdown-days]"),
      hours: el.querySelector("[data-countdown-hours]"),
      minutes: el.querySelector("[data-countdown-minutes]"),
      seconds: el.querySelector("[data-countdown-seconds]"),
    };
    var endedText = el.getAttribute("data-ended-text") || "Terminou";
    var timer;

    function tick() {
      var diff = deadline - Date.now();
      if (diff <= 0) {
        if (out) out.textContent = endedText;
        Object.keys(parts).forEach(function (k) {
          if (parts[k]) parts[k].textContent = "00";
        });
        el.setAttribute("data-countdown-ended", "1");
        clearInterval(timer);
        return;
      }
      var totalSeconds = Math.floor(diff / 1000);
      var days = Math.floor(totalSeconds / 86400);
      var hours = Math.floor((totalSeconds % 86400) / 3600);
      var minutes = Math.floor((totalSeconds % 3600) / 60);
      var seconds = totalSeconds % 60;

      if (out) {
        out.textContent = days + "d " + pad(hours) + "h " + pad(minutes) + "m " + pad(seconds) + "s";
      }
      if (parts.days) parts.days.textContent = pad(days);
      if (parts.hours) parts.hours.textContent = pad(hours);
      if (parts.minutes) parts.minutes.textContent = pad(minutes);
      if (parts.seconds) parts.seconds.textContent = pad(seconds);
    }

    tick();
    timer = setInterval(tick, 1000);
  }

  var nodes = document.querySelectorAll("[data-deadline]");
  for (var i = 0; i < nodes.length; i++) {
    setup(nodes[i]);
  }
})();
