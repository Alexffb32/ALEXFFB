(function () {
  "use strict";

  var form = document.getElementById("contact-form");
  if (!form) return;

  var submitBtn = form.querySelector('button[type="submit"]');
  var submitLabel = submitBtn ? submitBtn.textContent : "";

  function setStatus(text) {
    var el = document.getElementById("contact-form-status");
    if (!el) {
      el = document.createElement("p");
      el.id = "contact-form-status";
      el.style.cssText = "margin-top:12px;font-size:14px;color:#bebebe;";
      form.appendChild(el);
    }
    el.textContent = text;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var name = form.querySelector('input[name="Name"]');
    var email = form.querySelector('input[name="Email"]');
    var message = form.querySelector('textarea[name="Message"]');
    var honeypotWebsite = form.querySelector('input[name="website"]');
    var honeypotCompany = form.querySelector('input[name="company"]');

    if (!name || !email || !message) return;

    var payload = {
      name: name.value.trim(),
      email: email.value.trim(),
      message: message.value.trim(),
      company: honeypotCompany ? honeypotCompany.value : "",
      website: honeypotWebsite ? honeypotWebsite.value : "",
    };

    if (!payload.name || !payload.email || !payload.message) {
      setStatus("Preenche o nome, o email e a mensagem.");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
    }
    setStatus("A enviar…");

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, status: response.status, data: data };
        });
      })
      .then(function (result) {
        if (result.ok) {
          setStatus("Mensagem enviada. Respondo em 24 horas.");
          form.reset();
        } else if (result.status === 429) {
          setStatus("Demasiadas tentativas, tenta novamente daqui a um minuto.");
        } else {
          setStatus("Algo correu mal. Tenta novamente daqui a instantes.");
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitLabel;
        }
      })
      .catch(function () {
        setStatus("Algo correu mal. Tenta novamente daqui a instantes.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitLabel;
        }
      });
  });
})();
