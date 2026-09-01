(function () {
  "use strict";

  var form = document.getElementById("waitlist-form");
  if (!form) return;

  var list = form.getAttribute("data-list");
  var submitBtn = form.querySelector("button[type=submit]");
  var messageEl = document.getElementById("waitlist-message");
  var confirmedUrl = form.getAttribute("data-confirmed-url");
  var submitLabel = submitBtn.textContent;

  function showMessage(text, isError) {
    messageEl.textContent = text;
    messageEl.classList.remove("is-error", "is-success");
    messageEl.classList.add("is-visible", isError ? "is-error" : "is-success");
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var name = form.elements["name"].value.trim();
    var email = form.elements["email"].value.trim();
    var company = form.elements["company"] ? form.elements["company"].value : "";

    if (name.length < 2) {
      showMessage("Please enter your name.", true);
      return;
    }
    if (!isValidEmail(email)) {
      showMessage("Please enter a valid email address.", true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Joining…";

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
          window.location.href = confirmedUrl;
          return;
        }
        if (result.status === 429) {
          showMessage("Too many attempts — please try again in a minute.", true);
        } else {
          showMessage("Something went wrong. Please try again in a moment.", true);
        }
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      })
      .catch(function () {
        showMessage("Something went wrong. Please try again in a moment.", true);
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      });
  });
})();
