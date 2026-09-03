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

  // "Stats & Facts" counters ("Revenue Generated"/"Projects Delivered"/
  // "Satisfaction Rate") ship in the Framer export with their target value
  // literally set to 0 — never configured with real numbers, not a broken
  // animation (verified: the SSR HTML itself already reads "+0k€" etc, and
  // hydration re-asserts that same 0 from the bundle). Confirmed real
  // figures below.
  var STATS_VALUES = {
    "Revenue Generated": "+10k€",
    "Projects Delivered": "+15",
    "Satisfaction Rate": "200%",
  };

  function findStatsCounter(label) {
    var labelEl = [].slice
      .call(document.querySelectorAll("p"))
      .filter(function (p) {
        return p.textContent.trim() === label;
      })[0];
    if (!labelEl) return null;
    // Each breakpoint renders this block under a differently-named variant
    // wrapper (desktop: data-framer-name="L", mobile: "S") — walk up from
    // the label instead of hardcoding one variant name, stopping at the
    // first ancestor whose subtree contains the actual Counter node.
    var el = labelEl.parentElement;
    for (var i = 0; i < 8 && el; i++) {
      var counter = el.querySelector('[data-framer-name="Counter"]');
      if (counter) return counter;
      el = el.parentElement;
    }
    return null;
  }

  function fixStatsNumbers() {
    Object.keys(STATS_VALUES).forEach(function (label) {
      var counter = findStatsCounter(label);
      if (!counter) return;
      var target = STATS_VALUES[label];
      counter.querySelectorAll("p").forEach(function (p) {
        if (p.textContent !== target) p.textContent = target;
      });
    });
  }

  // The counter is an animated component (counts up when scrolled into
  // view) — scoped observer per counter in case a later scroll-triggered
  // re-render restores the bundled 0, same class of bug already found and
  // fixed for the mobile story-section rebuild elsewhere in this file.
  function watchStatsNumbers() {
    Object.keys(STATS_VALUES).forEach(function (label) {
      var counter = findStatsCounter(label);
      if (!counter || counter.dataset.statsWatched) return;
      counter.dataset.statsWatched = "true";
      new MutationObserver(function () {
        fixStatsNumbers();
      }).observe(counter, { childList: true, subtree: true, characterData: true });
    });
  }

  // The Photography carousel's real photos still carry the Framer
  // template's generic stock-photo alt text ("Wine Bottle", "Coffee
  // Pack", etc — the same placeholder names some of them coincidentally
  // share with SERVICE_ICONS' keys below). Real descriptions, written by
  // looking at each actual photo (matched by the unique hash in its own
  // filename, which survives Framer's various resized/format srcset
  // variants of the same source image).
  var PHOTOGRAPHY_ALT = {
    "59bR0YzrNlNy1F8ridWYRImpJGQ": "Alex petting a horse in a field at dusk",
    otTcjBmzgoKP2bAbQfDlzuJI74: "Alex sitting at an outdoor bar table at night, holding a drink",
    LTGGpS68YVFGIKbQUPdendlRXM: "Alex looking at the Eiffel Tower at night in Paris",
    "BPv2Mfxz0yf9Vo3wTA7JjLuQ": "Alex standing in a park in front of a historic building in Portugal",
    V0LXLZQ2XChMipHbvhYXquZKOYQ:
      "Alex adjusting his sunglasses in a town square with historic buildings behind him",
    "6ZTVQKUyvqPzsmb0GpTRvSo9bSE": "Alex sitting in an armchair during an interview-style conversation",
    pEW6wChEJ9oPtq5AC9J2W7ZUPUw: "Alex and a friend making a playful face at an evening event",
    "63gZFNfxW0mHwO8cun7flzmgSW8": "Alex working at his computer desk with a European Union flag on the wall",
    bZBgulqVOgVYyMIJsyUiLXnCc: "Alex presenting on stage next to a colleague at a youth event",
    bhd4psKJlNHYiCYZgaKbss87o: "Alex sitting at a restaurant table with his chin resting on his hand",
    "dTLF38MUP0jQ26ES47bluAH51B0":
      "Alex looking out over the Tagus River toward the 25 de Abril bridge in Lisbon",
    Q05APsVgevvdhUTegZpbMNUywE:
      "Alex standing by a marina wearing sunglasses, with sailboats and a castle in the background",
    efcSlJOeyVcyJLg0QElKzmGhZuo: "Alex taking a mirror selfie at the gym wearing headphones",
    BsoCOoH3Y4yAY9hkjScrxaq6sI: "Alex sitting at an outdoor café table at night wearing a blazer",
  };

  function fixPhotographyAltText() {
    document.querySelectorAll('[data-framer-name="Custom Carousel"] img').forEach(function (img) {
      var src = img.currentSrc || img.src;
      Object.keys(PHOTOGRAPHY_ALT).forEach(function (hash) {
        if (src.indexOf(hash) !== -1 && img.alt !== PHOTOGRAPHY_ALT[hash]) {
          img.alt = PHOTOGRAPHY_ALT[hash];
        }
      });
    });
  }

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
    p.id = "footer-address";
    p.textContent = "A Incubadora, A Praça, Fundão, Portugal";
    p.style.cssText =
      "font: inherit; font-size: 0.85em; opacity: 0.6; margin: 4px 0 0; color: inherit;";
    mail.insertAdjacentElement("afterend", p);
  }

  // Confirmed real social links (Instagram/YouTube) — small text row under
  // the footer address, same "new node inserted after hydration" approach
  // as addAddress()/addConstructionNote() since there's nowhere in the
  // original Framer export to edit an existing social-links block into.
  var SOCIAL_LINKS = [
    { label: "Instagram", href: "https://www.instagram.com/alexffb_" },
    { label: "YouTube", href: "https://www.youtube.com/@alexffb" },
  ];

  function addSocialLinks() {
    var address = document.getElementById("footer-address");
    if (!address || address.dataset.socialLinksAdded) return;
    address.dataset.socialLinksAdded = "true";
    var row = document.createElement("p");
    row.style.cssText =
      "font: inherit; font-size: 0.85em; opacity: 0.6; margin: 8px 0 0; color: inherit; display: flex; gap: 12px;";
    SOCIAL_LINKS.forEach(function (social) {
      var a = document.createElement("a");
      a.href = social.href;
      a.textContent = social.label;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.cssText = "color: inherit; text-decoration: underline;";
      row.appendChild(a);
    });
    address.insertAdjacentElement("afterend", row);
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

  // Mobile breakpoint renders a different variant of the "What I Do" cards
  // with no <img> at all (text only) — fixServiceIcons() above has nothing
  // to swap in on a phone. Insert a small icon badge instead, matched by
  // each card's own title text and reusing the same icon paths.
  var MOBILE_SERVICE_ICONS = [
    { match: "Marketing and Funnels", paths: SERVICE_ICONS["Man Wearing Glasses"].paths },
    { match: "Artificial Intelligence", paths: SERVICE_ICONS["Coffee Pack"].paths },
    { match: "Design & Development", paths: SERVICE_ICONS.Cream.paths },
    { match: "Systems & Operations", paths: SERVICE_ICONS.Bottle.paths },
  ];

  function fixMobileServiceIcons() {
    if (!window.matchMedia("(max-width: 809px)").matches) return;
    document.querySelectorAll(".framer-8o6qg7").forEach(function (card) {
      var content = card.querySelector(".framer-1jgnho9");
      if (!content || content.querySelector("[data-service-icon]")) return;
      var titleEl = content.querySelector(".framer-v902ng p");
      if (!titleEl) return;
      var title = titleEl.textContent.trim();
      var icon = MOBILE_SERVICE_ICONS.filter(function (s) {
        return title.indexOf(s.match) !== -1;
      })[0];
      if (!icon) return;
      var badge = document.createElement("div");
      badge.setAttribute("data-service-icon", "true");
      badge.style.cssText =
        "width:40px;height:40px;border-radius:10px;background:#0a0a0a;display:flex;" +
        "align-items:center;justify-content:center;margin-bottom:12px;flex-shrink:0;";
      badge.innerHTML =
        '<svg width="22" height="22" viewBox="0 0 128 128" fill="none" stroke="#ff462e" ' +
        'stroke-width="8" stroke-linecap="round" stroke-linejoin="round">' +
        icon.paths +
        "</svg>";
      content.insertBefore(badge, content.firstChild);
      if (!content.dataset.serviceIconWatched) {
        content.dataset.serviceIconWatched = "true";
        new MutationObserver(function () {
          fixMobileServiceIcons();
        }).observe(content, { childList: true });
      }
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
  // Splits the single generic "get in touch" contact flow into two named
  // intents (B2B work vs. partnerships/media) without touching any of the
  // ~8 existing "Contact"/"Get in touch" CTA buttons scattered across
  // Home (all Framer-managed components, risky to restructure). Instead
  // this adds a small picker directly above the Contact page's own form:
  // clicking an option seeds the message textarea with a starter line,
  // so the same single form still works for anyone who arrives without
  // clicking either option.
  var CONTACT_INTENTS = [
    {
      label: "Work with me",
      prefix: "Re: Work with me — ",
      ptPrefix: "Re: Trabalha comigo — ",
    },
    {
      label: "Partnerships & Media",
      prefix: "Re: Partnerships & Media — ",
      ptPrefix: "Re: Parcerias & Media — ",
    },
  ];

  function addContactIntentPicker() {
    var form = document.querySelector("form");
    if (!form) return;
    var textarea = form.querySelector('textarea[name="Message"]');
    if (!textarea || form.dataset.intentPickerAdded) return;
    form.dataset.intentPickerAdded = "true";

    var wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;gap:8px;margin:0 0 16px;flex-wrap:wrap;";

    var buttons = CONTACT_INTENTS.map(function (opt) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = opt.label;
      btn.style.cssText =
        "padding:8px 16px;border-radius:999px;border:1px solid rgba(9,9,9,.15);" +
        "background:#fff;font:inherit;font-size:13px;cursor:pointer;color:inherit;" +
        "transition:background .15s ease,color .15s ease;";
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) {
          b.style.background = "#fff";
          b.style.color = "inherit";
        });
        btn.style.background = "#1e1e1e";
        btn.style.color = "#fff";
        var isPt = document.documentElement.lang === "pt";
        var prefix = isPt ? opt.ptPrefix : opt.prefix;
        var alreadyPrefixed = CONTACT_INTENTS.some(function (o) {
          return (
            textarea.value.indexOf(o.prefix) === 0 || textarea.value.indexOf(o.ptPrefix) === 0
          );
        });
        if (!textarea.value || alreadyPrefixed) {
          textarea.value = prefix;
        }
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      });
      wrap.appendChild(btn);
      return btn;
    });

    form.insertBefore(wrap, form.firstChild);
  }

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
    // The Photography section's own divider bar was left saying the
    // Framer template's default label instead of the section's real name
    // (every other section's divider repeats its own kicker — this one
    // didn't).
    ["Framer Developer", "Photography"],
    // Hero intro: the generic "young entrepreneur ... passionate about
    // tech" copy didn't say anything specific about Alex. Replaced with
    // the approved bio-driven version (18, no degree, Selfmade VP,
    // five-figure agency before turning 18), split across the same 4
    // <br>-separated lines the original used. The last pair's new text
    // deliberately reorders "grow & scale" -> "scale & grow" so it
    // doesn't contain its own old string as a substring — fixAll() runs
    // 3 times (immediate + 2 staggered re-checks), and a new value that
    // contains its own old value keeps growing a duplicate prefix on
    // every re-run otherwise (caught by testing, not guesswork).
    [",a young entrepreneur", "— 18, from Portugal, building without a university degree."],
    [
      "from Portugal, passionate about business, self-improvement & tech.",
      "Vice-President of Selfmade Association, founder of a five-figure",
    ],
    [
      "I build the digital systems & strategies that help businesses worldwide",
      "agency before I turned 18. Today I help businesses build the digital",
    ],
    ["grow & scale online.", "systems & strategies that help them scale & grow online."],
  ];

  function fixContentText() {
    CONTENT_EDITS.forEach(function (pair) {
      replaceWord(document.body, pair[0], pair[1]);
    });
  }

  // European Portuguese translation of every visible EN string on Home
  // and Contact (pt/index.html, pt/contact/index.html — same HTML shell,
  // same hydrated Framer bundle, only <html lang="pt"> + head meta differ).
  // Applied only when document.documentElement.lang === "pt", using the
  // exact same replaceWord()/TreeWalker substring mechanism as
  // CONTENT_EDITS above — so it also survives hydration-revert and, since
  // it's run at the very end of fixAll(), it also catches JS-inserted
  // strings (nav "Work" label, footer address/social links, construction
  // note, contact-intent picker buttons) that only exist after the other
  // fixAll() steps have run.
  //
  // Ordering matters: replaceWord does a plain substring .replace() per
  // text node, so a shorter/generic entry placed before a longer one that
  // contains it as a substring would corrupt the longer phrase before its
  // own (more specific) translation ever gets a chance to match. Every
  // entry below is ordered longest/most-specific first within its group
  // (e.g. "Contact Me!" / "Contact Now" / "Contact now" all before the
  // bare "Contact"; "Work with me" before bare "Work"; "My Journey"
  // before bare "My").
  //
  // Two visible EN strings are deliberately NOT in this dictionary:
  // "Hackathons" (a stats badge label) is a common loanword in PT tech/
  // entrepreneurship contexts — left as-is on purpose, not a missed
  // translation. "Selfmade Ass." (a Journey-timeline card's short-form
  // badge) is an abbreviation of the org's proper name "Selfmade
  // Association", same as the full form elsewhere in this dictionary —
  // proper nouns aren't translated anywhere in this file.
  var TRANSLATIONS_PT = [
    // Hero
    ["Born to Build.", "Nascido Para Construir."],
    ["Since 2007", "Desde 2007"],
    ["Hey, Just An Intro", "Só Uma Introdução"],
    ["Hi, I'm", "Olá, sou o"],
    ["Let's Start a Conversation", "Vamos Começar uma Conversa"],
    // Hero intro (matches CONTENT_EDITS' own rewritten EN text above,
    // split across the same 4 fragments/text nodes as the original)
    [
      "— 18, from Portugal, building without a university degree.",
      "— 18 anos, de Portugal, a construir sem tirar um curso superior.",
    ],
    [
      "Vice-President of Selfmade Association, founder of a five-figure",
      "Vice-Presidente da Selfmade Association, fundador de uma agência de cinco dígitos",
    ],
    [
      "agency before I turned 18. Today I help businesses build the digital",
      "antes dos 18 anos. Hoje ajudo negócios a construir os sistemas",
    ],
    [
      "systems & strategies that help them scale & grow online.",
      "e estratégias digitais que os ajudam a crescer e a escalar online.",
    ],
    // About / Selfmade
    [
      "Selfmade Association is a youth organization based in Fundão that promotes entrepreneurship and international mobility through Erasmus+ programs — connecting young people from the interior of Portugal with opportunities abroad, and bringing international youth to our region. I'm the Vice-President.",
      "A Selfmade Association é uma organização juvenil sediada no Fundão que promove o empreendedorismo e a mobilidade internacional através de programas Erasmus+ — ligando jovens do interior de Portugal a oportunidades no estrangeiro, e trazendo jovens internacionais para a nossa região. Sou o Vice-Presidente.",
    ],
    ["More about me", "Mais sobre mim"],
    [
      "Over 12 years of football taught me more about discipline than anything else ever could. Today I channel that same energy into the gym, into\nlearning and into every project I take on.\nThe moment you stop evolving is the moment someone else takes your spot.",
      "Mais de 12 anos de futebol ensinaram-me mais sobre disciplina do que qualquer outra coisa alguma vez poderia. Hoje canalizo essa mesma energia para o ginásio, para\naprender e para cada projeto que assumo.\nO momento em que paras de evoluir é o momento em que outra pessoa ocupa o teu lugar.",
    ],
    ["Lifestyle", "Estilo de Vida"],
    ["My Journey", "O Meu Percurso"],
    // Journey timeline
    [
      "I co-founded a digital agency at 16, creating funnels and digital strategies for businesses across Portugal. Before turning 18, I had already crossed five figures in revenue. I eventually left to pursue a bigger vision, but watching that agency keep growing without me is something I'll always be proud of.",
      "Co-fundei uma agência digital aos 16 anos, criando funis e estratégias digitais para negócios em Portugal. Antes de fazer 18 anos, já tinha ultrapassado os cinco dígitos em receita. Acabei por sair para perseguir uma visão maior, mas ver essa agência continuar a crescer sem mim é algo de que sempre me vou orgulhar.",
    ],
    [
      "As Vice-President, I help run the podcast we produce together, coordinate Erasmus+ mobility opportunities, and push entrepreneurship programs that give young people from the interior of Portugal practical tools to build something of their own — not just motivational talk.",
      "Como Vice-Presidente, ajudo a gerir o podcast que produzimos juntos, coordeno oportunidades de mobilidade Erasmus+, e impulsiono programas de empreendedorismo que dão a jovens do interior de Portugal ferramentas práticas para construírem algo próprio — não apenas conversa motivacional.",
    ],
    [
      "I joined Aeternus Progressus as a Project Manager, working on marketing and business strategy while helping public and private organizations across Portugal and Europe secure European funding and navigate digitalization projects. Real clients, real projects, already running.",
      "Entrei para a Aeternus Progressus como Gestor de Projeto, trabalhando em marketing e estratégia de negócio enquanto ajudo organizações públicas e privadas em Portugal e na Europa a garantir financiamento europeu e a navegar projetos de digitalização. Clientes reais, projetos reais, já em curso.",
    ],
    ["Co-Founder", "Co-Fundador"],
    ["Contact now", "Contacta agora"],
    // Education
    [
      "From 2022 to 2025 I completed a Computer Programming course at Escola Profissional do Fundão, where I served as class and course representative and graduated as a merited student with a final grade of 18 out of 20.",
      "De 2022 a 2025 completei um curso de Programação de Computadores na Escola Profissional do Fundão, onde fui delegado de turma e de curso e me formei como aluno com mérito, com uma nota final de 18 em 20.",
    ],
    // Stats badges
    ["3 Times Winner", "Vencedor 3 Vezes"],
    ["Youth political initiatives", "Iniciativas Políticas Juvenis"],
    ["4 Presidential Terms", "4 Mandatos Presidenciais"],
    ["Erasmus Projects", "Projetos Erasmus"],
    ["5 International Projects", "5 Projetos Internacionais"],
    ["Events & Communities", "Eventos & Comunidades"],
    ["6 Successfully Organized", "6 Organizados com Sucesso"],
    // Stats & Facts
    ["Stats & Facts", "Números & Factos"],
    [
      "I started with no budget, no team and no roadmap. Just a clear belief that hard work",
      "Comecei sem orçamento, sem equipa e sem plano. Só uma crença clara de que trabalho árduo",
    ],
    [
      "and the right systems could make a difference. Every number below was earned, not given.",
      "e os sistemas certos podiam fazer a diferença. Cada número abaixo foi conquistado, não dado.",
    ],
    ["Revenue Generated", "Receita Gerada"],
    ["Before turning 18 years old.", "Antes de fazer 18 anos."],
    ["Projects Delivered", "Projetos Entregues"],
    ["Across Portugal and worldwide.", "Por todo Portugal e pelo mundo."],
    ["Satisfaction Rate", "Taxa de Satisfação"],
    ["With every client, every project.", "Com cada cliente, cada projeto."],
    // What I Do
    ["What I Do", "O Que Eu Faço"],
    [
      "Marketing, AI, design and systems — how I help the companies inside Aeternus Progressus grow, and what I do for Selfmade Association.",
      "Marketing, IA, design e sistemas — como ajudo as empresas dentro da Aeternus Progressus a crescer, e o que faço pela Selfmade Association.",
    ],
    ["Vice-President, Selfmade Association", "Vice-Presidente, Selfmade Association"],
    ["Project Manager, Aeternus Progressus", "Gestor de Projeto, Aeternus Progressus"],
    ["Marketing and Funnels", "Marketing e Funis"],
    [
      "Strategy, branding and marketing — how I help the companies inside Aeternus Progressus grow, alongside my own work at Layout Agency.",
      "Estratégia, branding e marketing — como ajudo as empresas dentro da Aeternus Progressus a crescer, a par do meu próprio trabalho na Layout Agency.",
    ],
    ["Artificial Intelligence", "Inteligência Artificial"],
    [
      "Building AI agents and automations for the companies inside Aeternus Progressus.",
      "A construir agentes de IA e automações para as empresas dentro da Aeternus Progressus.",
    ],
    ["Design & Development", "Design & Desenvolvimento"],
    [
      "Websites, software and visual identities for the companies inside Aeternus Progressus — the same systems-building work that took Layout Agency to five-figure revenue before I turned 18",
      "Websites, software e identidades visuais para as empresas dentro da Aeternus Progressus — o mesmo trabalho de construção de sistemas que levou a Layout Agency a uma receita de cinco dígitos antes de eu fazer 18 anos",
    ],
    ["Systems & Operations", "Sistemas & Operações"],
    [
      "Coordinating teams and processes, from Erasmus+ mobility at Selfmade to project delivery at Aeternus Progressus.",
      "A coordenar equipas e processos, desde a mobilidade Erasmus+ na Selfmade até à entrega de projetos na Aeternus Progressus.",
    ],
    ["What I", "O Que Eu"],
    // Benefits
    ["Benefits of Hiring Me", "Vantagens de Trabalhar Comigo"],
    ["From idea to live. Fast", "Da ideia ao ar. Rápido"],
    ["Lightning-fast delivery without compromising quality", "Entrega ultrarrápida sem comprometer a qualidade"],
    ["FROM 0 TO LIVE IN ONE STEP", "DE 0 AO AR NUM SÓ PASSO"],
    ["All in one person", "Tudo numa só pessoa"],
    ["FULL TIME SUPPORT", "SUPORTE A TEMPO INTEIRO"],
    [
      "Direct access to me, always. You'll never wonder where things stand or what comes next. That's a promise.",
      "Acesso direto a mim, sempre. Nunca vais ficar na dúvida sobre o estado das coisas ou o que vem a seguir. É uma promessa.",
    ],
    // Photography
    ["Shots By Me", "Fotos Tiradas por Mim"],
    ["Photography", "Fotografia"],
    ["Every Pixel Clicked.", "Cada Pixel Clicado."],
    [
      "Capturing moments, creating memories. Through my lens, i capture stunning visuals that bring your brand to life with clarity, emotion, and impact.",
      "A capturar momentos, a criar memórias. Através da minha lente, capturo imagens impressionantes que dão vida à tua marca com clareza, emoção e impacto.",
    ],
    ["Book an appointment", "Marcar uma sessão"],
    // Five-figure story
    ["How it Started ?", "Como Começou?"],
    ["The Beginning of", "O Início da"],
    ["Own Story.", "Própria História."],
    ["Five-figure business before turning 18", "Negócio de cinco dígitos antes dos 18 anos"],
    [
      "I started in the business world at 16, and after trying several models, I joined forces with a friend and we founded an agency where we built digital funnels to help companies in the interior of Portugal grow online. At the time, I gave up on going to university, and even before I was 18, we had already made five figures in revenue with our own business.\nHowever, despite being a co-founder, I decided to leave to take advantage of a better opportunity, but I love continuing to see the agency I founded grow even though I'm no longer involved in operations.",
      "Comecei no mundo dos negócios aos 16 anos, e depois de experimentar vários modelos, juntei forças com um amigo e fundámos uma agência onde construímos funis digitais para ajudar empresas do interior de Portugal a crescer online. Na altura, desisti de ir para a universidade, e mesmo antes de fazer 18 anos, já tínhamos feito cinco dígitos em receita com o nosso próprio negócio.\nNo entanto, apesar de ser co-fundador, decidi sair para aproveitar uma oportunidade melhor, mas adoro continuar a ver a agência que fundei crescer, mesmo já não estando envolvido nas operações.",
    ],
    ["Join the waitlist", "Junta-te à lista de espera"],
    ["50+ People Rated", "Mais de 50 Pessoas Avaliaram"],
    // Contact section
    ["Let's Work Together", "Vamos Trabalhar Juntos"],
    ["Contact Me!", "Contacta-me!"],
    ["Contact Now", "Contacta Agora"],
    [
      "Let’s create something amazing together! Reach out I’d love to hear about your project and ideas.",
      "Vamos criar algo incrível juntos! Contacta-me, adorava ouvir falar do teu projeto e das tuas ideias.",
    ],
    ["24/7 Full Time Support", "Suporte 24/7 a Tempo Inteiro"],
    ["Available Worldwide", "Disponível em Todo o Mundo"],
    ["Work with me", "Trabalha comigo"],
    ["Partnerships & Media", "Parcerias & Media"],
    ["Submit Now", "Enviar Agora"],
    // Footer
    ["Stay connected®", "Fica em contacto®"],
    [
      "Crafted with creativity and passion. Let’s stay connected reach out anytime!",
      "Feito com criatividade e paixão. Fica em contacto, fala comigo quando quiseres!",
    ],
    ["This site is a work in progress and gets updated often.", "Este site ainda está em construção e é atualizado com frequência."],
    ["©Back to top", "©Voltar ao Topo"],
  ];

  // Short, generic words/phrases translated above are risky with a plain
  // substring replace: several of their own PT translations start with the
  // same stem as the EN key (e.g. "Contact" -> "Contacto"/"Contacta..." —
  // the translated word itself contains "Contact" as a leading substring),
  // which would re-match and corrupt already-translated text on fixAll()'s
  // later re-runs (confirmed by an automated check before shipping this —
  // same class of self-collision bug as the Fase 1 hero-copy fix, but not
  // fixable by reordering alone here since the collision is with the
  // *translation's own wording*, not another dictionary entry). Matched
  // with a word-boundary regex instead, so "Contact" only replaces the
  // standalone EN word, never the "Contact" inside "Contacta"/"Contacto".
  var TRANSLATIONS_PT_WORDS = [
    ["Home", "Início"],
    ["Work", "Trabalho"],
    ["Get in touch", "Fala comigo"],
    ["My", "Minha"],
    ["Do", "Faço"],
    ["Contact", "Contacto"],
    // Standalone role-badge labels (Journey timeline cards) — same
    // self-collision issue as "Contact": "Vice-President" is a literal
    // prefix of its own translation "Vice-Presidente".
    ["Vice-President", "Vice-Presidente"],
    ["Project Manager", "Gestor de Projeto"],
  ];

  function applyTranslations() {
    if (document.documentElement.lang !== "pt") return;
    TRANSLATIONS_PT.forEach(function (pair) {
      replaceWord(document.body, pair[0], pair[1]);
    });
    TRANSLATIONS_PT_WORDS.forEach(function (pair) {
      replaceWordBoundary(document.body, pair[0], pair[1]);
    });
    fixFormPlaceholdersPt();
  }

  function replaceWordBoundary(a, oldWord, newWord) {
    var escaped = oldWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    var re = new RegExp("\\b" + escaped + "\\b", "g");
    var walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (re.test(node.nodeValue)) {
        node.nodeValue = node.nodeValue.replace(re, newWord);
      }
      re.lastIndex = 0;
    }
  }

  // Placeholders live on the <input>/<textarea> element itself, not a text
  // node, so replaceWord()/TreeWalker can't reach them — set directly.
  function fixFormPlaceholdersPt() {
    if (document.documentElement.lang !== "pt") return;
    var map = { "Name*": "Nome*", "Message*": "Mensagem*" };
    Object.keys(map).forEach(function (ph) {
      document.querySelectorAll('[placeholder="' + ph + '"]').forEach(function (el) {
        if (el.placeholder !== map[ph]) el.placeholder = map[ph];
      });
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
      } else if (norm === "/work" && !a.hasAttribute("data-work-nav-link")) {
        // Repurposes the template's original "Work" nav slot into Merch —
        // NOT the same node as the new "Work" link addWorkNavLink() adds
        // below (that one carries data-work-nav-link so this branch skips
        // it; without the guard both nodes look identical to this check
        // once cloned, since the clone starts out as a copy of a link
        // this same fix() also processes).
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

  // The Photography section's "Custom Carousel" (a 3D fan of real photos,
  // 7 arms x 2 faces = 14 images) was exported from Framer with fixed
  // desktop pixel widths baked into inline styles (one arm alone is
  // 2800px wide) and no responsive recompute at this static-export
  // runtime. On a real phone viewport that means only whichever 2-3 cards
  // happen to overlap the narrow screen are visible — a different, much
  // smaller slice of the same 14 photos than desktop shows, not a content
  // difference. Below 810px (matching the site's own mobile breakpoint),
  // swap it for a plain horizontal-scroll strip built from the exact same
  // <img> elements already in the DOM, so mobile can reach every photo
  // desktop can.
  function fixPhotoGalleryMobile() {
    if (!window.matchMedia("(max-width: 809px)").matches) return;
    var carousel = document.querySelector('[data-framer-name="Custom Carousel"]');
    if (!carousel) return;
    // The carousel itself is hidden via a CSS rule (mobile-fixes.css),
    // not an inline style — a stylesheet rule survives Framer's React
    // re-rendering this element, where an inline style set from here
    // would get wiped the next time React touches it. Only the strip
    // insertion needs to be idempotent/re-checked here.
    if (
      carousel.nextElementSibling &&
      carousel.nextElementSibling.dataset.mobilePhotoStrip === "true"
    ) {
      return;
    }
    var imgs = carousel.querySelectorAll("img");
    if (!imgs.length) return;

    var strip = document.createElement("div");
    strip.dataset.mobilePhotoStrip = "true";
    strip.style.cssText =
      "display:flex;gap:12px;overflow-x:auto;padding:24px 20px 8px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;";

    imgs.forEach(function (img) {
      var clone = document.createElement("img");
      clone.src = img.currentSrc || img.src;
      // fixPhotographyAltText() runs before this in fixAll(), so img.alt is
      // already the real per-photo description (PHOTOGRAPHY_ALT) by now —
      // copy it instead of a generic fallback, or the mobile-only strip
      // silently drops all 14 real descriptions the desktop carousel keeps.
      clone.alt = img.alt || "Alex Bento";
      clone.loading = "lazy";
      clone.decoding = "async";
      clone.style.cssText =
        "flex:0 0 auto;width:180px;height:240px;object-fit:cover;border-radius:20px;scroll-snap-align:start;";
      strip.appendChild(clone);
    });

    carousel.parentNode.insertBefore(strip, carousel.nextSibling);

    if (!carousel.dataset.mobileGalleryWatched) {
      carousel.dataset.mobileGalleryWatched = "true";
      new MutationObserver(function () {
        fixPhotoGalleryMobile();
      }).observe(carousel.parentNode, { childList: true });
    }
  }

  // "Born to Build. Since 2007®" (the small overline above the huge
  // "Alexandre Bento*" name) is set with an inline font-size baked for
  // desktop widths. At phone widths "Since 2007®" wraps onto a second
  // line and collides with the giant name title sitting right below it
  // (verified visually). Shrinking just this line to fit its own row
  // fixes the collision without touching the name title itself.
  function fixMobileHeroTitle() {
    if (!window.matchMedia("(max-width: 809px)").matches) return;
    var h4 = [].slice
      .call(document.querySelectorAll("h4"))
      .filter(function (h) {
        return h.textContent.indexOf("Born to Build") !== -1;
      })[0];
    if (!h4 || h4.dataset.mobileFitted) return;
    var span = h4.querySelector("span");
    h4.dataset.mobileFitted = "true";
    h4.style.fontSize = "24px";
    h4.style.lineHeight = "30px";
    h4.style.whiteSpace = "nowrap";
    if (span) span.style.fontSize = "27px";
  }

  // Three mobile-only fixes bundled together since they all target real
  // video/media playback problems on phones (verified locally: these
  // clips never reach readyState > 0 on a narrow viewport, unlike
  // desktop):
  //  - "Lifestyle" gallery (3 background-video cards): never renders
  //    usefully on phones, so it's hidden there rather than shown broken.
  //  - The "Five-figure business" story clip: never starts loading on
  //    its own on mobile; forced to load/play here, and given a real
  //    portrait 9:16 frame (mobile-fixes.css) instead of its fixed
  //    380px-tall landscape-ish box.
  //  - The mobile hamburger overlay's nav links only exist in the DOM
  //    once a person actually opens the menu — every earlier fixAll()
  //    pass runs before that, so it was still shipping the original
  //    About/Work/Blog links (About even 404s, since that page was
  //    removed). Re-running the link fixer right after the menu opens
  //    catches it.
  function fixMobileMedia() {
    if (!window.matchMedia("(max-width: 809px)").matches) return;

    document.querySelectorAll(".framer-1qy6mcn, .framer-1vuq3rr").forEach(function (el) {
      el.style.display = "none";
    });

    var storyVideo = document.querySelector('video[src*="wCXHBJD62Phepy"]');
    if (storyVideo && !storyVideo.dataset.mobileForced) {
      storyVideo.dataset.mobileForced = "true";
      storyVideo.muted = true;
      storyVideo.setAttribute("playsinline", "");
      storyVideo.load();
      storyVideo.play().catch(function () {});
    }

    var menuToggle = document.querySelector('[data-framer-name="Mobile Menu Icon"]');
    if (menuToggle && !menuToggle.dataset.menuFixHooked) {
      menuToggle.dataset.menuFixHooked = "true";
      menuToggle.addEventListener("click", function () {
        setTimeout(fix, 250);
        setTimeout(fix, 600);
        setTimeout(addWorkNavLink, 250);
        setTimeout(addWorkNavLink, 600);
        setTimeout(applyTranslations, 250);
        setTimeout(applyTranslations, 600);
      });
    }

    rebuildMobileStorySection();
    watchMobileStorySection();
  }

  // The "Five-figure business" story block's text (badge/heading/body/
  // CTA) sits in a flex tree where every element checks out as
  // position:relative with zero margins, yet it visually renders on top
  // of the video image instead of below it — margin/position/DOM-order
  // fixes all measured "correct" while the browser kept painting it
  // overlapping. Rather than keep chasing whichever Framer flex quirk
  // causes that, this rebuilds the block from its own real content
  // (the actual DOM nodes, not copies, so the real link/video keep
  // working) into a plain, guaranteed-correct stacked layout: video,
  // then text below it. Desktop is untouched — this only runs under
  // the 809px breakpoint.
  function rebuildMobileStorySection() {
    var container = document.querySelector(".framer-1llmjrj");
    if (!container) return;
    // Structural check, not a one-shot flag: Framer's React tree can
    // re-render this subtree later (e.g. when its own scroll-triggered
    // entrance animation fires), which would silently restore the
    // original broken markup and undo a one-shot fix. Checking "is my
    // rebuilt wrapper still the only child" makes this call idempotent —
    // safe to re-run from the watcher below every time React touches it.
    if (
      container.children.length === 1 &&
      container.firstElementChild.dataset.mobileStoryWrap === "true"
    ) {
      return;
    }
    var video = container.querySelector("video");
    var heading = container.querySelector("h3");
    if (!video || !heading) return;

    var badgeTextEl = container.querySelector('[data-framer-name="Primary"] .framer-ef7rhz');
    var subtitleEl = container.querySelector("h5");
    var bodyEl = container.querySelector('[data-framer-name="Body Text"] p');
    var ctaLink = container.querySelector('a[href="/comunidade/"]');
    var ratingText = container.querySelector('[data-framer-name="Rating"] p');

    var wrap = document.createElement("div");
    wrap.dataset.mobileStoryWrap = "true";
    wrap.style.cssText = "display:flex;flex-direction:column;width:100%;";

    var videoBox = document.createElement("div");
    videoBox.style.cssText =
      "width:100%;aspect-ratio:9/16;border-radius:16px;overflow:hidden;position:relative;background:#0a0a0a;";
    video.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
    videoBox.appendChild(video);

    var textBox = document.createElement("div");
    textBox.style.cssText = "padding:24px 0 0;";

    if (badgeTextEl) {
      var badge = document.createElement("span");
      badge.textContent = badgeTextEl.textContent;
      badge.style.cssText =
        "display:inline-block;background:rgba(255,70,46,.1);color:#ff462e;font-size:13px;font-weight:600;padding:8px 14px;border-radius:10px;margin-bottom:16px;";
      textBox.appendChild(badge);
    }

    var h = document.createElement("h3");
    h.innerHTML = heading.innerHTML;
    h.style.cssText = "font-size:32px;line-height:1.15;font-weight:600;margin:0 0 16px;color:#1e1e1e;";
    textBox.appendChild(h);

    if (subtitleEl) {
      var sub = document.createElement("p");
      sub.textContent = subtitleEl.textContent;
      sub.style.cssText = "font-size:16px;font-weight:600;margin:0 0 8px;color:#1e1e1e;";
      textBox.appendChild(sub);
    }

    if (bodyEl) {
      var body = document.createElement("p");
      body.textContent = bodyEl.textContent;
      body.style.cssText = "font-size:15px;line-height:1.5;color:#63615e;margin:0 0 20px;white-space:pre-line;";
      textBox.appendChild(body);
    }

    if (ctaLink) {
      var cta = document.createElement("a");
      cta.href = ctaLink.getAttribute("href");
      cta.textContent = "Join the waitlist";
      cta.style.cssText =
        "display:inline-flex;align-items:center;gap:8px;background:#eaeaea;color:#090909;font-weight:600;font-size:15px;padding:14px 22px;border-radius:50px;text-decoration:none;margin-bottom:12px;";
      textBox.appendChild(cta);
    }

    if (ratingText) {
      var rating = document.createElement("p");
      rating.textContent = "★★★★★ " + ratingText.textContent;
      rating.style.cssText = "font-size:13px;color:#63615e;margin:0;";
      textBox.appendChild(rating);
    }

    wrap.appendChild(videoBox);
    wrap.appendChild(textBox);

    container.innerHTML = "";
    container.style.cssText += ";height:auto !important;overflow:visible !important;display:block !important;padding:0 20px;";
    container.appendChild(wrap);
  }

  // Belt-and-suspenders for the rebuild above: watch just this one small
  // subtree (not the whole document — that's what caused the header
  // animation freeze bug earlier) and re-run the idempotent rebuild
  // whenever Framer's React mutates it, in case a later re-render ever
  // restores the original broken markup after the initial fixAll() runs
  // have already finished.
  function watchMobileStorySection() {
    if (!window.matchMedia("(max-width: 809px)").matches) return;
    var container = document.querySelector(".framer-1llmjrj");
    if (!container || container.dataset.mobileStoryWatched) return;
    container.dataset.mobileStoryWatched = "true";
    new MutationObserver(function () {
      rebuildMobileStorySection();
    }).observe(container, { childList: true });
  }

  // The site is genuinely still being reshaped (waitlist pages, copy
  // rewrites, this same round of mobile fixes) — a small, honest note in
  // the footer instead of presenting it as a finished product.
  function addConstructionNote() {
    var mail = document.querySelector('[data-framer-name="Mail"]');
    var anchor = mail && mail.closest("section, footer");
    if (!anchor || anchor.dataset.constructionNoteAdded) return;
    anchor.dataset.constructionNoteAdded = "true";
    var p = document.createElement("p");
    p.textContent = "This site is a work in progress and gets updated often.";
    // opacity:0.5 (on inherited near-black text, over a white footer)
    // measured at 3.94:1 in a Lighthouse audit — fails WCAG AA's 4.5:1
    // for normal-size text. 0.6 reaches ~5.7:1, comfortably passing,
    // while still reading as a muted footnote.
    p.style.cssText =
      "font-size: 12px; opacity: 0.6; text-align: center; margin: 24px 0 0; padding: 0 20px;";
    anchor.appendChild(p);
  }

  // Reintroduces a "Work" nav link (client work + own products, see
  // /work/) — the original Framer template only had 3 spare nav slots
  // (About/Work/Blog), already all used by Comunidade/Merch/Newsletter,
  // so this is a genuinely new 4th slot rather than a repurpose. Clones
  // the real "Comunidade" link (keeps its exact styling/hover behavior)
  // instead of building a new node from scratch, then relabels it and
  // renumbers the three links after it.
  // Desktop nav ("Not Active" variant) and the mobile hamburger overlay
  // ("Mobile" variant, confirmed via testing to share the exact same
  // Text1/Text2/Indicator internal structure as desktop — an earlier,
  // wrong guess at a "Single Line Not Active" variant turned out to be a
  // different, not-actually-rendered component) both need this same
  // clone+renumber treatment, just scoped to their own variant name.
  function addWorkNavLinkForVariant(variant) {
    var comunidadeLink = document.querySelector('a[data-framer-name="' + variant + '"][href="/comunidade/"]');
    if (!comunidadeLink) return;
    var comunidadeContainer = comunidadeLink.parentElement;
    var navRow = comunidadeContainer && comunidadeContainer.parentElement;
    if (!navRow) return;

    var flagKey = "workLinkAdded" + variant.replace(/\s+/g, "");
    if (!navRow.dataset[flagKey]) {
      navRow.dataset[flagKey] = "true";
      var clone = comunidadeContainer.cloneNode(true);
      var cloneLink = clone.querySelector("a");
      cloneLink.setAttribute("data-work-nav-link", "true");
      var t1 = clone.querySelector(".framer-1xn2lzr p");
      var t2 = clone.querySelector(".framer-17j7mkn p");
      var indicator = clone.querySelector(".framer-bmdrp8 p");
      if (t1) t1.textContent = "Work";
      if (t2) t2.textContent = "Work";
      if (indicator) indicator.textContent = "02";
      // Reuses finalize()'s clone+replaceChild trick (defined above) to
      // drop the cloned Page Link's inherited React fiber reference,
      // instead of duplicating that same logic inline.
      finalize(cloneLink, "/work/");
      comunidadeContainer.insertAdjacentElement("beforebegin", clone);
    }

    // Re-set every pass (idempotent — always the same absolute target,
    // never incremented) since hydration can restore the original
    // "02/03/04" indicator numbers on these three existing links.
    var renumber = { "/comunidade/": "03", "/merch/": "04", "/newsletter/": "05" };
    Object.keys(renumber).forEach(function (href) {
      var link = document.querySelector('a[data-framer-name="' + variant + '"][href="' + href + '"]');
      var indicator = link && link.querySelector(".framer-bmdrp8 p");
      if (indicator && indicator.textContent !== renumber[href]) {
        indicator.textContent = renumber[href];
      }
    });
  }

  // The mobile overlay's row dividers turned out to be separate 1px
  // elements Framer positions to match its own original 4-item layout
  // (confirmed by inspection — not proper CSS borders), so inserting a
  // 5th item leaves one gap without a divider and misaligns the rest.
  // Simplest reliable fix: hide Framer's own divider elements for this
  // nav row and draw a real border-bottom on each item container
  // instead, which stays correct regardless of how many items there are.
  function fixMobileNavDividers() {
    var workLink = document.querySelector('a[data-work-nav-link][data-framer-name="Mobile"]');
    if (!workLink) return;
    var navRow = workLink.parentElement.parentElement;
    if (!navRow || navRow.dataset.dividersFixed) return;
    navRow.dataset.dividersFixed = "true";

    var itemContainers = [];
    Array.from(navRow.children).forEach(function (child) {
      if (child.querySelector("a")) {
        itemContainers.push(child);
      } else {
        child.style.display = "none";
      }
    });
    itemContainers.forEach(function (container, i) {
      if (i < itemContainers.length - 1) {
        container.style.borderBottom = "1px solid rgb(234, 234, 234)";
      }
    });
  }

  function addWorkNavLink() {
    addWorkNavLinkForVariant("Not Active");
    addWorkNavLinkForVariant("Mobile");
    fixMobileNavDividers();
  }

  // Subtle EN/PT switch in the header, next to the logo — plain text,
  // no flags or dropdown. Home and Contact now have real PT translations
  // (pt/index.html, pt/contact/index.html, sharing this same script), so
  // this is a real link pair rather than the earlier "coming soon" tooltip:
  // it preserves whichever of Home/Contact the visitor is currently on
  // (same pattern as the .wl-lang-toggle used on the simple waitlist pages).
  function addLanguageToggle() {
    var logo = document.querySelector('a[data-framer-name="Logo"]');
    if (!logo || logo.dataset.langToggleAdded) return;
    logo.dataset.langToggleAdded = "true";

    var isPt = document.documentElement.lang === "pt";
    var isContact = window.location.pathname.indexOf("/contact/") !== -1;
    var enHref = isContact ? "/contact/" : "/";
    var ptHref = isContact ? "/pt/contact/" : "/pt/";

    // Anchored right next to the logo (not the nav-links list) so it
    // never collides with the desktop link row or the mobile hamburger
    // icon, whose exact layout/width differs by breakpoint.
    var wrap = document.createElement("div");
    wrap.id = "lang-toggle";
    wrap.style.cssText =
      "display:inline-flex;align-items:center;gap:6px;margin-left:14px;" +
      "font-size:13px;font-weight:600;color:#090909;" +
      "text-shadow:0 1px 2px rgba(255,255,255,.9),0 0 6px rgba(255,255,255,.7);";

    var en = document.createElement("a");
    en.textContent = "EN";
    en.href = enHref;
    en.style.cssText =
      "text-decoration:none;color:inherit;opacity:" + (isPt ? "0.45" : "1") + ";cursor:pointer;";

    var sep = document.createElement("span");
    sep.textContent = "/";
    sep.style.cssText = "opacity:0.3;";

    var pt = document.createElement("a");
    pt.textContent = "PT";
    pt.href = ptHref;
    pt.style.cssText =
      "text-decoration:none;color:inherit;opacity:" + (isPt ? "1" : "0.45") + ";cursor:pointer;";

    wrap.appendChild(en);
    wrap.appendChild(sep);
    wrap.appendChild(pt);

    logo.insertAdjacentElement("afterend", wrap);
  }

  function fixAll() {
    fix();
    fixServiceIcons();
    fixMobileServiceIcons();
    fixStatsNumbers();
    watchStatsNumbers();
    fixPhotographyAltText();
    setupContactForward();
    addContactIntentPicker();
    addAddress();
    addSocialLinks();
    fixContentText();
    fixPhotoGalleryMobile();
    fixMobileHeroTitle();
    fixMobileMedia();
    addConstructionNote();
    addLanguageToggle();
    addWorkNavLink();
    applyTranslations();
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
