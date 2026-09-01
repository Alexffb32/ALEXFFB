/**
 * Framer's compiled Page Link / Image / rich-text components re-render from
 * their own bundled data on hydration, discarding whatever is in the server
 * HTML (confirmed via testing: editing the raw HTML alone gets silently
 * reverted ~500ms after load). This patch runs after hydration and keeps
 * re-asserting the intended nav/CTA/mailto/services-icon values, so it
 * survives any later re-render Framer's runtime triggers (resize, scroll,
 * breakpoint change, etc).
 */
(function () {
  "use strict";

  var SERVICE_ICONS = {
    "Man Wearing Glasses": {
      label: "Marketing and Funnels icon",
      paths: '<path d="M16 21 L112 21 L75 64 L75 97 L53 107 L53 64 Z"/>',
    },
    "Coffee Pack": {
      label: "Artificial Intelligence icon",
      paths:
        '<circle cx="30" cy="94" r="10"/><circle cx="98" cy="94" r="10"/><circle cx="64" cy="34" r="10"/>' +
        '<line x1="30" y1="94" x2="98" y2="94"/><line x1="30" y1="94" x2="64" y2="34"/><line x1="98" y1="94" x2="64" y2="34"/>',
    },
    Cream: {
      label: "Design and Development icon",
      paths: '<path d="M85 96 L117 64 L85 32"/><path d="M43 32 L11 64 L43 96"/>',
    },
    Bottle: {
      label: "Systems and Operations icon",
      paths:
        '<circle cx="64" cy="64" r="34"/><circle cx="64" cy="64" r="14"/>' +
        '<line x1="64" y1="30" x2="64" y2="16"/><line x1="64" y1="98" x2="64" y2="112"/>' +
        '<line x1="30" y1="64" x2="16" y2="64"/><line x1="98" y1="64" x2="112" y2="64"/>' +
        '<line x1="40" y1="40" x2="30" y2="30"/><line x1="88" y1="88" x2="98" y2="98"/>' +
        '<line x1="40" y1="88" x2="30" y2="98"/><line x1="88" y1="40" x2="98" y2="30"/>',
    },
  };

  function fixServiceIcons() {
    Object.keys(SERVICE_ICONS).forEach(function (alt) {
      var img = document.querySelector('img[alt="' + alt + '"]');
      if (!img) return;
      var icon = SERVICE_ICONS[alt];
      var wrapper = document.createElement("div");
      wrapper.innerHTML =
        '<svg width="100%" height="100%" viewBox="0 0 369 258" preserveAspectRatio="xMidYMid slice" ' +
        'style="display:block;border-radius:inherit;corner-shape:inherit" role="img" aria-label="' +
        icon.label +
        '"><rect width="369" height="258" fill="#0a0a0a"/>' +
        '<g transform="translate(120.5,65)" fill="none" stroke="#ff462e" stroke-width="8" ' +
        'stroke-linecap="round" stroke-linejoin="round">' +
        icon.paths +
        "</g></svg>";
      img.replaceWith(wrapper.firstChild);
    });
  }

  // The native "Submit Now" form posts to Framer's own hosted Forms API
  // (independent of self-hosting, but not verifiable end-to-end from here
  // — see README). This adds a second, guaranteed channel: on submit,
  // forward the same fields to our own /api/contact, which emails them
  // via Resend. Registered on the CAPTURE phase so it reads the field
  // values before Framer's own handler (bubble phase) has a chance to
  // clear/reset the form — both handlers fire independently, this one
  // never calls preventDefault so Framer's own submission still proceeds.
  function setupContactForward() {
    var form = document.querySelector("form");
    if (!form || form.__contactForwardAttached) return;
    form.__contactForwardAttached = true;

    form.addEventListener(
      "submit",
      function () {
        var name = form.querySelector('input[name="Name"]');
        var email = form.querySelector('input[name="Email"]');
        var message = form.querySelector('textarea[name="Message"]');
        var honeypot = form.querySelector('input[name="website"]');
        if (!name || !email || !message) return;

        fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.value,
            email: email.value,
            message: message.value,
            company: honeypot ? honeypot.value : "",
          }),
        }).catch(function () {});
      },
      true,
    );
  }

  function replaceWord(a, oldWord, newWord) {
    var walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.indexOf(oldWord) !== -1) {
        node.nodeValue = node.nodeValue.split(oldWord).join(newWord);
      }
    }
  }

  // Framer's Page Link component routes clicks through its own React
  // onClick handler (bound via event delegation, independent of the href
  // attribute) — so fixing href/text alone re-targets hover previews and
  // "copy link", but a real click still jumps to the original page.
  // Cloning the node drops React's internal fiber reference, so the
  // delegated listener no longer recognizes it as a Link component and
  // the click falls through to native anchor navigation via our href.
  function finalize(a, href) {
    a.setAttribute("href", href);
    var clone = a.cloneNode(true);
    a.parentNode.replaceChild(clone, a);
  }

  function fix() {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute("href");
      var text = a.textContent;

      if (href === "mailto:dummy@mail.com") {
        a.setAttribute("href", "mailto:contact@alexffb.com");
        return;
      }

      var norm = href.replace(/^\.\//, "/").replace(/\/$/, "");

      if (norm === "/about") {
        if (text.indexOf("View about") !== -1) {
          replaceWord(a, "View about", "Contact now");
          finalize(a, "/contact/");
        } else if (text.indexOf("About") !== -1) {
          replaceWord(a, "About", "Comunidade");
          finalize(a, "/comunidade/");
        }
      } else if (norm === "/work") {
        if (text.indexOf("View portfolio") !== -1) {
          replaceWord(a, "View portfolio", "Join the waitlist");
          finalize(a, "/comunidade/");
        } else if (text.indexOf("Work") !== -1) {
          replaceWord(a, "Work", "Merch");
          finalize(a, "/merch/");
        }
      } else if (norm === "/blog") {
        if (text.indexOf("Blog") !== -1) {
          replaceWord(a, "Blog", "Newsletter");
        } else if (text.indexOf("Insights") !== -1) {
          replaceWord(a, "Insights", "Newsletter");
        }
        finalize(a, "/newsletter/");
      }
    });
  }

  function fixAll() {
    fix();
    fixServiceIcons();
    setupContactForward();
  }

  fixAll();

  // Framer's runtime can re-render these components after our first pass
  // (breakpoint switch, scroll-triggered animation, etc) — keep correcting.
  // Coalesced via rAF since the page has its own scroll/hover animations
  // that mutate the DOM far more often than our targets actually change.
  var scheduled = false;
  function scheduleFix() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      fixAll();
    });
  }
  new MutationObserver(scheduleFix).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["href"],
  });
})();
