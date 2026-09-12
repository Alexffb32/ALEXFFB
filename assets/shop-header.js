(function () {
  "use strict";

  var lastCount = null;

  function updateCount() {
    var el = document.getElementById("shop-cart-count");
    if (!el || !window.ShopCart) return;
    var n = window.ShopCart.count();
    el.textContent = String(n);
    el.hidden = n === 0;
    if (lastCount !== null && n > lastCount) {
      el.classList.remove("is-bumped");
      // Força reflow para poder reiniciar a animação mesmo que a classe
      // já lá estivesse de um bump anterior muito recente.
      void el.offsetWidth;
      el.classList.add("is-bumped");
    }
    lastCount = n;
  }

  document.addEventListener("abwl:cart-changed", updateCount);
  document.addEventListener("DOMContentLoaded", updateCount);
  updateCount();
})();
