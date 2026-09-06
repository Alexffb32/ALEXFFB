(function () {
  "use strict";

  var form = document.getElementById("waitlist-form");
  if (!form) return;

  var list = form.getAttribute("data-list");
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitLabel = submitBtn.textContent;
  var messageEl = document.getElementById("waitlist-message");

  function showMessage(text, isError) {
    messageEl.textContent = text;
    messageEl.classList.remove("is-error", "is-success");
    messageEl.classList.add(isError ? "is-error" : "is-success");
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var name = form.elements["name"] ? form.elements["name"].value.trim() : "";
    var email = form.elements["email"].value.trim();
    var company = form.elements["company"] ? form.elements["company"].value : "";

    if (!name || name.length < 2) {
      showMessage("Por favor insere o teu nome.", true);
      return;
    }
    if (!isValidEmail(email)) {
      showMessage("Por favor insere um email válido.", true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "A juntar…";

    fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, email: email, list: list, company: company }),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, status: response.status, data: data };
        });
      })
      .then(function (result) {
        if (result.ok) {
          showMessage("Feito! Já estás na lista — avisamos-te assim que houver novidades.", false);
          form.reset();
        } else if (result.status === 429) {
          showMessage("Demasiadas tentativas — tenta novamente daqui a um minuto.", true);
        } else {
          showMessage("Algo correu mal. Tenta novamente daqui a instantes.", true);
        }
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      })
      .catch(function () {
        showMessage("Algo correu mal. Tenta novamente daqui a instantes.", true);
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      });
  });
})();
