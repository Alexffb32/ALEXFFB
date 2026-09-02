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

  // The footer's "Stay connected" block only has the email link — there's
  // no address anywhere in this export (the real Contact page with an
  // address block was never part of the original static export, only its
  // search index was — see README). Adds a real one as a new sibling
  // node rather than editing existing rich-text content, since editing
  // Framer-managed text is what gets reverted on hydration; a freshly
  // inserted node outside its managed subtree is left alone.
  function addAddress() {
    var mail = document.querySelector('[data-framer-name="Mail"]');
    if (!mail || mail.dataset.addressAdded) return;
    mail.dataset.addressAdded = "true";
    var p = document.createElement("p");
    p.textContent = "A Incubadora, A Praça, Fundão, Portugal";
    p.style.cssText =
      "font: inherit; font-size: 0.85em; opacity: 0.6; margin: 4px 0 0; color: inherit;";
    mail.insertAdjacentElement("afterend", p);
  }

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

  // Real-content rewrites (Pro Services copy, Aeternus Progressus role,
  // Selfmade Association texts) — same hydration-revert problem as
  // everything else here, so applied the same way: after hydration,
  // walking text nodes rather than editing the raw HTML.
  var CONTENT_EDITS = [
    ["Convert More, Grow Faster", "Vice-President, Selfmade Association"],
    ["Future-Proof & Scalable", "Project Manager, Aeternus Progressus"],
    ["Premium Services", "What I Do"],
    ["Pro ", "What I"],
    ["Services®", "Do"],
    [
      "Systems, marketing, AI and design, built to work together as one.",
      "Marketing, AI, design and systems — how I help the companies inside Aeternus Progressus grow, and what I do for Selfmade Association.",
    ],
    [
      "Strategy, branding, social media and funnels that turn attention into paying clients.",
      "Strategy, branding and marketing — how I help the companies inside Aeternus Progressus grow, alongside my own work at Layout Agency.",
    ],
    [
      "AI agents and automation that save time, cut costs and scale your output.",
      "Building AI agents and automations for the companies inside Aeternus Progressus.",
    ],
    [
      "Websites, apps, software and visual identities built to earn trust, convert and grow your revenue",
      "Websites, software and visual identities for the companies inside Aeternus Progressus — the same systems-building work that took Layout Agency to five-figure revenue before I turned 18",
    ],
    [
      "Digital processes and frameworks that make your business ready to scale.",
      "Coordinating teams and processes, from Erasmus+ mobility at Selfmade to project delivery at Aeternus Progressus.",
    ],
    ["Consultant", "Project Manager"],
    [
      "I joined Aeternus Progressus as a consultant and team member, working on marketing and business strategy",
      "I joined Aeternus Progressus as a Project Manager, working on marketing and business strategy",
    ],
    [
      "I'm the Vice-President of Selfmade Association, a youth organization based in Fundão that promotes entrepreneurship and international mobility through Erasmus+ programs. We connect young people from the interior of Portugal with opportunities abroad, and bring international youth to our region.",
      "Selfmade Association is a youth organization based in Fundão that promotes entrepreneurship and international mobility through Erasmus+ programs — connecting young people from the interior of Portugal with opportunities abroad, and bringing international youth to our region. I'm the Vice-President.",
    ],
    [
      "I joined Selfmade Association and was elected Vice-President. We're a Fundão-based youth organization that uses Erasmus+ to fight for something simple: giving young people from the interior of Portugal the same international opportunities as everyone else.",
      "As Vice-President, I help run the podcast we produce together, coordinate Erasmus+ mobility opportunities, and push entrepreneurship programs that give young people from the interior of Portugal practical tools to build something of their own — not just motivational talk.",
    ],
  ];

  function fixContentText() {
    CONTENT_EDITS.forEach(function (pair) {
      replaceWord(document.body, pair[0], pair[1]);
    });
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
    addAddress();
    fixContentText();
  }

  fixAll();

  // Framer's hydration revert happens once, within ~500ms of load (verified
  // with Playwright). A couple of staggered re-checks catch that with
  // margin. A continuous MutationObserver was tried here before and
  // dropped: observing the whole document body during Framer's own hero
  // entrance animation (which mounts/animates many nodes in that window)
  // fired this patch dozens of times a second, competing with Framer's own
  // animation loop for the main thread — the likely cause of the header's
  // reveal animation appearing to freeze partway through in production.
  setTimeout(fixAll, 800);
  setTimeout(fixAll, 2000);
})();
