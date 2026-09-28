/* Formulário de /loja/avaliar/.
 *
 * A avaliação não é publicada daqui: segue por email para o Alexandre
 * (api/review.js), que a confirma contra uma encomenda real e só depois a
 * acrescenta a REVIEWS em assets/shop-catalog.js. Ver docs/LOJA.md.
 */
(function () {
  "use strict";

  var catalog = window.ShopCatalog;
  var form = document.getElementById("shop-review-form");
  if (!catalog || !form) return;

  var select = document.getElementById("shop-review-product");
  var status = document.getElementById("shop-review-status");
  var done = document.getElementById("shop-review-done");
  var submit = form.querySelector('button[type="submit"]');

  // A lista sai do catálogo, para um produto novo aparecer aqui sozinho.
  // ?p=<slug> pré-escolhe a peça (é o link que segue no WhatsApp).
  var wanted = new URLSearchParams(window.location.search).get("p");
  var placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Escolhe a peça";
  select.appendChild(placeholder);
  catalog.allProducts().forEach(function (p) {
    var opt = document.createElement("option");
    opt.value = p.slug;
    opt.textContent = p.bundle ? p.name + " (Pack 4 T-shirts)" : p.name;
    if (p.slug === wanted) opt.selected = true;
    select.appendChild(opt);
  });

  function setStatus(msg, isError) {
    status.textContent = msg;
    status.classList.toggle("is-error", !!isError);
  }

  function problem(data) {
    if (!data.product) return "Escolhe a peça que compraste.";
    if (!data.rating) return "Dá uma nota de 1 a 5 estrelas.";
    if (data.text.length < 10) return "Escreve pelo menos uma frase (10 caracteres).";
    if (data.name.length < 2) return "Diz-nos o teu nome.";
    if (!data.consent) return "Precisamos da tua autorização para publicar.";
    return "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var data = {
      product: String(fd.get("product") || ""),
      rating: Number(fd.get("rating") || 0),
      text: String(fd.get("text") || "").trim(),
      name: String(fd.get("name") || "").trim(),
      city: String(fd.get("city") || "").trim(),
      consent: fd.get("consent") === "on",
      company: String(fd.get("company") || ""),
    };
    var err = problem(data);
    if (err) {
      setStatus(err, true);
      return;
    }

    setStatus("A enviar…", false);
    if (window.ButtonFeedback) window.ButtonFeedback.busy(submit);
    else submit.disabled = true;

    fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        if (!res.ok) throw new Error(String(res.status));
        if (window.ButtonFeedback) window.ButtonFeedback.success(submit, 600);
        form.hidden = true;
        done.hidden = false;
        done.scrollIntoView({ block: "center", behavior: "smooth" });
      })
      .catch(function () {
        if (window.ButtonFeedback) window.ButtonFeedback.idle(submit);
        else submit.disabled = false;
        setStatus("Não foi possível enviar agora. Tenta outra vez, ou manda-nos a avaliação pelo WhatsApp.", true);
      });
  });
})();
