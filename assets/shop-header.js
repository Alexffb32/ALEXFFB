(function () {
  "use strict";

  function updateCount() {
    var el = document.getElementById("shop-cart-count");
    if (!el || !window.ShopCart) return;
    var n = window.ShopCart.count();
    el.textContent = String(n);
    el.hidden = n === 0;
  }

  document.addEventListener("abwl:cart-changed", updateCount);
  document.addEventListener("DOMContentLoaded", updateCount);
  updateCount();
})();
