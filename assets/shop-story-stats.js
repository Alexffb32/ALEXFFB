/* Efeito "slot machine" nos números da secção "18 valores. Zero
 * candidaturas." — cada carácter numérico gira por dígitos aleatórios e
 * trava da esquerda para a direita, com um pequeno "pop" de escala
 * quando o número inteiro assenta. Símbolos (+, k, €) ficam fixos.
 *
 * Falha em silêncio: se o browser não tiver IntersectionObserver, ou se
 * a pessoa preferir menos movimento, os números ficam estáticos no texto
 * final que já está no HTML — nada depende deste script para ler certo.
 */
(function () {
  "use strict";

  var nums = document.querySelectorAll(".shop-stat-num");
  if (!nums.length) return;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function randomDigit() {
    return String(Math.floor(Math.random() * 10));
  }

  function roll(el, delay) {
    var final = el.textContent;
    var chars = final.split("");
    var duration = 900;
    var start = null;

    el.classList.add("is-rolling");

    function frame(ts) {
      if (start === null) start = ts;
      var elapsed = ts - start;
      if (elapsed < 0) {
        requestAnimationFrame(frame);
        return;
      }
      var progress = Math.min(1, elapsed / duration);
      var out = "";
      for (var i = 0; i < chars.length; i++) {
        if (!/[0-9]/.test(chars[i])) {
          out += chars[i];
          continue;
        }
        // Os dígitos travam da esquerda para a direita, um a um.
        var lockAt = (i + 1) / chars.length;
        out += progress >= lockAt ? chars[i] : randomDigit();
      }
      el.textContent = out;
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.textContent = final;
        el.classList.remove("is-rolling");
        el.classList.add("is-landed");
      }
    }

    setTimeout(function () {
      requestAnimationFrame(frame);
    }, delay);
  }

  function playAll() {
    nums.forEach(function (el, i) {
      roll(el, i * 120);
    });
  }

  if (reduceMotion || !("IntersectionObserver" in window)) return;

  var played = false;
  var stats = document.querySelector(".shop-story-stats");
  if (!stats) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !played) {
          played = true;
          playAll();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.4 },
  );
  observer.observe(stats);
})();
