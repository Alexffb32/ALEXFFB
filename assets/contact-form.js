(function () {
  "use strict";

  // O <form> nativo (originalmente id="contact-form" no export estático)
  // perde esse id quando a Framer hidrata a página — confirmado por teste
  // direto, não é suposição. Por isso nunca se procura por id: encontra-se
  // o form sempre a partir de um campo estável (o input "Email"), tanto
  // aqui como no envio, para nunca depender de uma referência antiga a um
  // nó que a Framer possa ter substituído.
  function findForm() {
    var email = document.querySelector('input[name="Email"]');
    return email ? email.closest("form") : null;
  }

  function directChildOf(root, el) {
    var node = el;
    while (node && node.parentElement !== root) {
      node = node.parentElement;
    }
    return node;
  }

  function ensureConsentField() {
    var form = findForm();
    if (!form || form.querySelector("#contact-form-consent")) return;
    var submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;
    var wrap = document.createElement("label");
    wrap.style.cssText =
      "display:flex;align-items:flex-start;gap:10px;margin:16px 0;color:#bebebe;font-size:13px;line-height:1.5em;cursor:pointer;";
    wrap.innerHTML =
      '<input type="checkbox" id="contact-form-consent" required style="flex:none;width:16px;height:16px;margin-top:2px;accent-color:#bebebe;">' +
      '<span>Li e aceito a <a href="/privacidade/" target="_blank" rel="noopener noreferrer" style="color:#bebebe;text-decoration:underline;">Política de Privacidade</a> e os <a href="/termos/" target="_blank" rel="noopener noreferrer" style="color:#bebebe;text-decoration:underline;">Termos e Condições</a>.</span>';
    var anchor = directChildOf(form, submitBtn) || submitBtn;
    form.insertBefore(wrap, anchor);
  }

  ensureConsentField();
  [100, 300, 600, 1200, 2500, 4000].forEach(function (ms) {
    setTimeout(ensureConsentField, ms);
  });

  // Reage a re-renders tardios do form, com debounce e um limite de
  // tentativas para nunca entrar em loop com um re-render que a apague de
  // imediato outra vez.
  var consentRetries = 0;
  var consentScheduled = false;
  new MutationObserver(function () {
    if (consentScheduled || consentRetries >= 20) return;
    consentScheduled = true;
    setTimeout(function () {
      consentScheduled = false;
      consentRetries += 1;
      ensureConsentField();
    }, 300);
  }).observe(document.body, { childList: true, subtree: true });

  function setStatus(form, text) {
    var el = form.querySelector("#contact-form-status");
    if (!el) {
      el = document.createElement("p");
      el.id = "contact-form-status";
      el.style.cssText = "margin-top:12px;font-size:14px;color:#bebebe;";
      form.appendChild(el);
    }
    el.textContent = text;
  }

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || !(form instanceof HTMLFormElement) || !form.querySelector('input[name="Email"]')) return;
    event.preventDefault();

    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.textContent : "";
    var name = form.querySelector('input[name="Name"]');
    var email = form.querySelector('input[name="Email"]');
    // A Framer hidrata este textarea com name="Email" (bug do próprio
    // template, não é um erro de digitação nosso — confirmado por
    // inspeção direta: o <textarea> real fica com o mesmo atributo name
    // do campo de email, nunca "Message"). Como é o único textarea do
    // formulário, identifica-se pela tag, não pelo name.
    var message = form.querySelector("textarea");
    var honeypotWebsite = form.querySelector('input[name="website"]');
    var honeypotCompany = form.querySelector('input[name="company"]');
    var consent = form.querySelector("#contact-form-consent");

    if (!name || !email || !message) return;

    var payload = {
      name: name.value.trim(),
      email: email.value.trim(),
      message: message.value.trim(),
      consent: !!(consent && consent.checked),
      company: honeypotCompany ? honeypotCompany.value : "",
      website: honeypotWebsite ? honeypotWebsite.value : "",
    };

    if (!payload.name || !payload.email || !payload.message) {
      setStatus(form, "Preenche o nome, o email e a mensagem.");
      return;
    }
    if (!payload.consent) {
      setStatus(form, "Tens de aceitar a Política de Privacidade e os Termos e Condições.");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
    }
    setStatus(form, "A enviar…");

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
          setStatus(form, "Mensagem enviada. Respondo em 24 horas.");
          form.reset();
        } else if (result.status === 429) {
          setStatus(form, "Demasiadas tentativas, tenta novamente daqui a um minuto.");
        } else {
          setStatus(form, "Algo correu mal. Tenta novamente daqui a instantes.");
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitLabel;
        }
      })
      .catch(function () {
        setStatus(form, "Algo correu mal. Tenta novamente daqui a instantes.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitLabel;
        }
      });
  });
})();
