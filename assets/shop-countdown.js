(function () {
  "use strict";

  var el = document.getElementById("shop-countdown");
  if (!el) return;

  var deadline = new Date(el.getAttribute("data-deadline")).getTime();
  var numEl = document.getElementById("shop-countdown-num");

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function tick() {
    var diff = deadline - Date.now();
    if (diff <= 0) {
      numEl.textContent = "Edição encerrada";
      clearInterval(timer);
      return;
    }
    var totalSeconds = Math.floor(diff / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    numEl.textContent = days + "d " + pad(hours) + "h " + pad(minutes) + "m " + pad(seconds) + "s";
  }

  var timer;
  tick();
  timer = setInterval(tick, 1000);
})();
