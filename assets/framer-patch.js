(function () {
  "use strict";

  // O export da Framer hidrata a página com React depois do primeiro
  // carregamento, e esse React volta a escrever o texto original (inglês,
  // por traduzir) gravado no bundle script_main.*.mjs, ignorando o HTML
  // estático que editámos. Este script corre depois disso e repõe o
  // texto certo.
  //
  // Regra de segurança (para nunca mais partir fonte/design): só se
  // toca no valor de nós de texto já existentes (Text.nodeValue), nunca
  // se substitui innerHTML/textContent de um elemento, exceto nos casos
  // marcados "container" abaixo, onde se confirma primeiro que o próprio
  // elemento (não um pai genérico) já tem o estilo de fonte inline antes
  // de lhe tocar — para nunca apagar sem querer um wrapper com o estilo.

  // O <title> vem do <head> e fica como está. Era definido aqui por JS, o
  // que apagava a versão do HTML assim que o script corria — e o Google
  // executa JavaScript, por isso era o título antigo que ele via.

  function norm(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  // Confirmado por teste direto (clique real, não só o atributo href): a
  // Framer liga o próprio onClick de React a estes links de página em
  // página, guardado nas props internas do componente, não no DOM — por
  // isso mudar o atributo href por JS não muda para onde o clique
  // realmente navega, e um clique real acaba na página de case-study
  // original em vez do href que aqui se define. Clonar o nó e substituí-lo
  // no DOM larga essa fiber/handler do React (o clone não tem as
  // propriedades internas __reactFiber/__reactProps que o React usa para
  // encontrar o handler), ficando só com um <a> normal que navega pelo
  // href. Mesma técnica já usada no site antigo para o mesmo problema.
  function detachFiber(el) {
    if (!el || !el.parentNode) return el;
    var clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
    return clone;
  }

  // Substituições simples: texto inteiro dentro de UM só nó de texto.
  var NODE_FIXES = [
    ["Xavien Miller © Copyright 2026. All Rights Reserved.", "Alexandre Bento © 2026. Todos os direitos reservados."],
    ["Available for new projects & role", "A construir algo novo, sempre."],
    ["Somewhere along the way, design became about portfolios", "Algures pelo caminho, ter sucesso tornou-se uma checklist, tira o curso, arranja o emprego, espera pela tua vez."],
    ["I never bought into that.", "Nunca comprei essa ideia."],
    ["For me, design has always been about one thing", "Aos 16 anos co-fundei a Layout Agency e levei-a a receita de cinco dígitos antes de fazer 18 anos, sem nunca ter pisado uma sala de aula universitária. Hoje sou Vice-Presidente da Associação Selfmade, trabalho com jovens empreendedores por Portugal e pela Europa, e conduzo grandes projetos que vão ajudar a moldar o futuro da Europa através da Aeternus Progressus."],
    ["does it work? Does the person who lands on this page", ""],
    ["That's the question I've been obsessed with", "Disciplina é a base de tudo isto, no ginásio, no desporto, e no trabalho, todos os dias, sem exceções."],
    ["I'm Xavien Miller.", "Este site é onde tudo isto vive, conteúdo, comunidade, produtos, e os negócios que vou construindo pelo caminho. Não sou inalcançável. Se queres evoluir e construir algo teu, podes sempre contar comigo para te ajudar a lá chegar."],
    ["If that's you, we should talk.", ""],
    ["Synox is a modern finance platform delivering secure financial solutions, smart investment tools, and digital services to help businesses and individuals achieve sustainable financial growth.", "Anti University Social Club, a primeira coleção. Streetwear para quem constrói o próprio caminho. Lançamento: 7 de setembro, segunda-feira."],
    ["Sastik Help Desk provides reliable IT support and customer service, helping businesses resolve technical issues quickly with responsive assistance and efficient support solutions.", "Uma rede de jovens empreendedores que preferem construir a esperar. Brevemente."],
    ["Innomax is a modern AI and data technology platform delivering intelligent automation, scalable software, and data-driven solutions to help businesses innovate and digital growth.", "Cursos, ebooks e templates a partir do que já construí de verdade, não teoria."],
    ["Brickox is a modern construction platform delivering residential, commercial, and industrial building solutions with expert craftsmanship and reliable project execution.", "Ferramentas que estou a construir, e ferramentas de parceiros em quem acredito."],
    ["Comunidades", "Comunidade"],
    ["Infoproduros", "Produtos Digitais"],
    ["Apps & Softwares", "Apps & Software"],
    ["Project Mannager", "Project Manager"],
    ["Co-Founder", "Co-Fundador"],
    ["Tell me about your  business and what's not working I'll tell you if and how I can help.", "Seja um negócio que queiras construir, uma parceria, ou só dizer olá, começa aqui."],
    ["I reply within 24 hours. If your project is urgent, use the", "Leio tudo pessoalmente e respondo em 24 horas."],
    ["button to find a time directly.", ""],
    ["Criação de conteudo", "Criação de Conteúdo"],
    ["Eventos & projetos", "Eventos & Projetos"],
    ["viagens & lyfestyle", "Viagens & Lifestyle"],
    ["giveaways & sorteios", "Giveaways & Sorteios"],
    ["Schedule a call on cal.com", ""],
  ];

  // Kickers curtos que a Framer também reescreve letra a letra: aqui não
  // dá para procurar por texto (nenhum nó tem a frase toda), por isso
  // usam-se as classes exatas destes elementos-folha específicos, já
  // confirmadas por inspeção direta como o parágrafo certo, não um
  // wrapper acima dele.
  var CLASS_FIXES = [
    [".framer-htsawt", "Afiliações"],
    [".framer-8y2zdo", "Contacto"],
    [".framer-1a9lzsh", "Para Lá do Ecrã"],
  ];

  function fixByClass() {
    for (var i = 0; i < CLASS_FIXES.length; i++) {
      var el = document.querySelector(CLASS_FIXES[i][0]);
      if (el && norm(el.textContent) !== CLASS_FIXES[i][1]) {
        el.textContent = CLASS_FIXES[i][1];
      }
    }
  }

  // Cabeçalhos grandes que a Framer volta a desenhar como texto animado
  // letra a letra depois da hidratação: aqui é preciso substituir o
  // elemento que já tem o estilo da fonte inline, não um wrapper acima
  // dele. Cada entrada diz como reconhecer esse elemento com segurança.
  var HEADING_FIXES = [
    {
      match: "conversion-focused web designer for",
      newText: "18 anos. Disciplina todos os dias. A construir o meu caminho, sem atalhos.",
    },
    {
      match: "let’s build something people remember",
      newText: "Vamos Conectar-nos",
    },
    {
      match: "being a web designer is one of the best jobs in the world",
      newText: "Ninguém vai construir o teu caminho por ti.",
    },
  ];

  // Botões "Entra na waitlist" que a Framer redesenha como texto simples
  // dentro de um círculo pequeno (o texto todo não cabe): usam-se as
  // classes exatas destes dois círculos, já confirmadas por inspeção
  // direta, para mostrar uma etiqueta mais curta que cabe no espaço. Não
  // são de nenhum projeto específico, por isso apontam para a newsletter
  // geral, não para /merch ou /comunidade (o que a hidratação lhes dava
  // por acaso).
  var SHORT_TEXT_FIXES = [
    [".framer-18lm3z0", "Waitlist"],
    [".framer-1mfibht", "Waitlist"],
  ];

  function fixShortText() {
    for (var i = 0; i < SHORT_TEXT_FIXES.length; i++) {
      var el = document.querySelector(SHORT_TEXT_FIXES[i][0]);
      if (!el) continue;
      if (norm(el.textContent) !== SHORT_TEXT_FIXES[i][1]) {
        el.textContent = SHORT_TEXT_FIXES[i][1];
      }
      if (el.getAttribute("href") !== "/newsletter/") {
        el.setAttribute("href", "/newsletter/");
      }
      if (el.getAttribute("data-abwl-detached") !== "1") {
        el = detachFiber(el);
        el.setAttribute("data-abwl-detached", "1");
      }
    }
  }

  // Botão extra "Merch" ao lado do "Waitlist" já existente, nas duas
  // barras de botões: a do hero (.framer-18lm3z0) e a fixa que segue a
  // página (.framer-1mfibht). A loja está ao vivo em /loja, por isso este
  // link aponta lá diretamente, não para uma waitlist.
  //
  // A ordem visual (Waitlist | Enviar Mensagem | Merch) e o botão do
  // asterisco escondido são tratados em CSS (ver index.html), que
  // sobrevive à hidratação sem precisar de correr outra vez.
  var MERCH_BUTTON_SOURCES = [".framer-1mfibht", ".framer-18lm3z0"];
  function addMerchButton() {
    for (var i = 0; i < MERCH_BUTTON_SOURCES.length; i++) {
      // querySelector devolve sempre o primeiro em ordem de DOM, ou seja o
      // "Waitlist" original — nunca o clone, que vem depois dele.
      var waitlistBtn = document.querySelector(MERCH_BUTTON_SOURCES[i]);
      if (!waitlistBtn || waitlistBtn.getAttribute("data-abwl-merch-added") === "1") continue;
      var merchBtn = waitlistBtn.cloneNode(true);
      merchBtn.removeAttribute("data-abwl-detached");
      // O original traz a animação de entrada da Framer (um id de "appear"
      // e um style inline com opacity:0.001). Dois nós com o mesmo id
      // confundiriam o animator, e o clone ficaria invisível se a animação
      // não corresse — por isso o clone entra já no estado final.
      merchBtn.removeAttribute("data-framer-appear-id");
      merchBtn.style.removeProperty("opacity");
      merchBtn.style.removeProperty("transform");
      merchBtn.setAttribute("data-abwl-merch-btn", "1");
      merchBtn.textContent = "Merch";
      merchBtn.setAttribute("href", "/loja/");
      waitlistBtn.insertAdjacentElement("afterend", merchBtn);
      waitlistBtn.setAttribute("data-abwl-merch-added", "1");
    }
  }

  // Linha de links legais no footer principal — o export da Framer não
  // trazia nenhum link para /privacidade, /cookies ou /termos (as
  // páginas já existem e cumprem RGPD/legislação de consumo, só
  // faltava ligá-las aqui).
  function addFooterLegalLinks() {
    var bottom = document.querySelector(".framer-ob91zf");
    if (!bottom || !bottom.parentNode) return;
    if (bottom.parentNode.querySelector(".abwl-footer-legal")) return;
    var row = document.createElement("div");
    row.className = "abwl-footer-legal";
    row.innerHTML =
      '<a href="/privacidade/">Política de Privacidade</a>' +
      '<a href="/cookies/">Política de Cookies</a>' +
      '<a href="/termos/">Termos e Condições</a>';
    // Um clique aqui borbulha até um antepassado que a Framer ainda
    // controla (o próprio <footer> faz parte da árvore React da
    // hidratação), e o listener delegado da Framer intercepta-o antes
    // de chegar à navegação nativa do link. stopPropagation() no
    // próprio nó novo (sem fiber nenhuma) trava o borbulhar já na
    // origem, antes de sair daqui.
    var links = row.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
    bottom.parentNode.insertBefore(row, bottom);
  }

  // Contacto direto (email + telefone) na secção "Vamos Conectar-nos",
  // logo abaixo do parágrafo da coluna esquerda — o export da Framer não
  // trazia nenhum contacto direto ali, só o CTA para o formulário.
  function addContactInfo() {
    var content = document.querySelector(".framer-byv80m");
    if (!content) return;
    if (content.querySelector(".abwl-contact-info")) return;
    var para = content.querySelector(".framer-1abtxxb");
    if (!para) return;
    var row = document.createElement("div");
    row.className = "abwl-contact-info";
    row.innerHTML =
      '<a href="mailto:contact@alexffb.com">contact@alexffb.com</a>' +
      '<a href="tel:+351968398460">+351 968 398 460</a>';
    var links = row.querySelectorAll("a");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
    para.insertAdjacentElement("afterend", row);
  }

  // As 4 fotos decorativas junto a "Ao que podes ter acesso" eram
  // screenshots de UI genéricos do template Framer (sites SaaS quaisquer,
  // nada a ver com o conteúdo real) — trocados por um ícone simples por
  // tópico. A hidratação repõe o src/alt originais do template tal como
  // repõe texto, por isso tem de se corrigir aqui, não só no HTML.
  var TOPIC_IMAGES = [
    { name: "Image1", src: "/assets/topics/criacao-de-conteudo.svg", alt: "Criação de Conteúdo" },
    { name: "Image2", src: "/assets/topics/eventos-e-projetos.svg", alt: "Eventos & Projetos" },
    { name: "Image3", src: "/assets/topics/viagens-e-lifestyle.svg", alt: "Viagens & Lifestyle" },
    { name: "Image4", src: "/assets/topics/giveaways-e-sorteios.svg", alt: "Giveaways & Sorteios" },
  ];
  // Esta secção está ligada a uma CMS Collection da Framer
  // (id UcWbpW2oX) que nunca foi preenchida com conteúdo real — o
  // próprio export mostra o aviso "Failed to resolve slug: Couldn't
  // find collection utils" na consola. Sem a collection real, a Framer
  // vai buscar (por fetch, já depois da hidratação, timing
  // imprevisível) imagens de demonstração diferentes a cada carregamento
  // à sua própria CDN — por isso o `patch()` correr só nos primeiros
  // segundos não chega: confirmado que o fetch pode resolver bem depois
  // da última tentativa agendada, ou re-escrever só o atributo `src` de
  // um <img> já existente (sem inserir/remover nós), o que nem sequer
  // aciona o MutationObserver de `childList`. Por isso cada <img> destes
  // fica com o SEU PRÓPRIO observer de atributos, que repõe o ícone
  // certo no instante em que a Framer tentar trocá-lo, para sempre.
  function fixTopicImages() {
    for (var i = 0; i < TOPIC_IMAGES.length; i++) {
      var t = TOPIC_IMAGES[i];
      var img = document.querySelector('[data-framer-name="' + t.name + '"] img');
      if (!img) continue;
      if (img.getAttribute("src") !== t.src) img.setAttribute("src", t.src);
      if (img.getAttribute("alt") !== t.alt) img.setAttribute("alt", t.alt);
      if (img.getAttribute("data-abwl-guarded") === "1") continue;
      img.setAttribute("data-abwl-guarded", "1");
      var guard = (function (target, wanted) {
        return new MutationObserver(function () {
          if (target.getAttribute("src") !== wanted.src) target.setAttribute("src", wanted.src);
          if (target.getAttribute("alt") !== wanted.alt) target.setAttribute("alt", wanted.alt);
        });
      })(img, t);
      guard.observe(img, { attributes: true, attributeFilter: ["src", "alt"] });
    }
  }

  function fixTextNodes() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var value = node.nodeValue;
      if (!value || !value.trim()) continue;
      var normalized = norm(value).toLowerCase();
      for (var i = 0; i < NODE_FIXES.length; i++) {
        var needle = norm(NODE_FIXES[i][0]).toLowerCase();
        if (normalized === needle || normalized.indexOf(needle) !== -1) {
          if (norm(value) !== NODE_FIXES[i][1]) {
            node.nodeValue = NODE_FIXES[i][1];
          }
          break;
        }
      }
    }
  }

  // Só mexe num elemento se ELE PRÓPRIO (não um pai genérico) já tiver
  // um estilo de fonte inline — assim nunca se apaga sem querer o
  // wrapper que carrega o design.
  function hasOwnFontStyle(el) {
    var style = el.getAttribute && el.getAttribute("style");
    return !!(style && /font-family|font-size/i.test(style));
  }

  function fixHeadings() {
    for (var i = 0; i < HEADING_FIXES.length; i++) {
      var fix = HEADING_FIXES[i];
      var all = document.querySelectorAll("body *");
      var best = null;
      var bestLen = Infinity;
      for (var j = 0; j < all.length; j++) {
        var el = all[j];
        if (!hasOwnFontStyle(el)) continue;
        var t = norm(el.textContent).toLowerCase();
        if (t.indexOf(fix.match) !== -1 && t.length < bestLen) {
          bestLen = t.length;
          best = el;
        }
      }
      if (best && norm(best.textContent) !== fix.newText) {
        best.textContent = fix.newText;
      }
    }
  }

  // 4 pilares, na ordem em que aparecem na página: Merch já está ao vivo
  // (loja em /loja), os outros 3 continuam a apontar para a waitlist
  // geral única. O clique real ainda ia parar às páginas de case-study
  // originais (Meetco/Sastik/Innomax/Brickox) — confirmado com um clique
  // a sério, não só a olhar para o atributo — porque a Framer liga aqui o
  // seu próprio onClick de navegação entre páginas do projeto, que ignora
  // por completo o href do DOM. detachFiber() larga esse onClick.
  var CARD_LINKS = [
    { href: "/loja/", label: "Entrar na Loja" },
    { href: "/newsletter/", label: "Entra na waitlist" },
    { href: "/newsletter/", label: "Entra na waitlist" },
    { href: "/newsletter/", label: "Entra na waitlist" },
  ];
  function fixCardLinks() {
    var links = document.querySelectorAll(".framer-Ik1cm");
    for (var i = 0; i < links.length && i < CARD_LINKS.length; i++) {
      var a = links[i];
      var target = CARD_LINKS[i];
      if (a.getAttribute("href") !== target.href) {
        a.setAttribute("href", target.href);
      }
      if (norm(a.textContent) !== target.label) {
        a.textContent = target.label;
      }
      if (a.getAttribute("data-abwl-detached") !== "1") {
        a = detachFiber(a);
        a.setAttribute("data-abwl-detached", "1");
      }
    }
  }

  // Ícones do cabeçalho (Email + 2 redes sociais): no export da Framer
  // são apenas <div>s decorativos, sem link nenhum. Aqui envolvem-se
  // num <a> real (só uma vez, marcado por data-abwl-fixed) e trocam-se
  // os 2 ícones genéricos por Instagram/YouTube.
  var INSTAGRAM_SVG =
    '<svg viewBox="0 0 24 24" fill="rgb(255,255,255)" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;display:block;opacity:0.85"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 2 .25 2.4.42.6.24 1 .53 1.5 1 .5.5.8.9 1 1.5.17.5.36 1.2.42 2.4.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.25 2-.42 2.4-.24.6-.53 1-1 1.5-.5.5-.9.8-1.5 1-.5.17-1.2.36-2.4.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-2-.25-2.4-.42-.6-.24-1-.53-1.5-1-.5-.5-.8-.9-1-1.5-.17-.5-.36-1.2-.42-2.4C2.21 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.06-1.2.25-2 .42-2.4.24-.6.53-1 1-1.5.5-.5.9-.8 1.5-1 .5-.17 1.2-.36 2.4-.42C8.4 2.21 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.52 0-4.76.07-.97.04-1.5.2-1.85.34-.46.18-.8.4-1.15.75-.35.35-.57.69-.75 1.15-.14.35-.3.88-.34 1.85C3.08 8.48 3.07 8.85 3.07 12s0 3.52.07 4.76c.04.97.2 1.5.34 1.85.18.46.4.8.75 1.15.35.35.69.57 1.15.75.35.14.88.3 1.85.34 1.24.06 1.61.07 4.76.07s3.52 0 4.76-.07c.97-.04 1.5-.2 1.85-.34.46-.18.8-.4 1.15-.75.35-.35.57-.69.75-1.15.14-.35.3-.88.34-1.85.06-1.24.07-1.61.07-4.76s0-3.52-.07-4.76c-.04-.97-.2-1.5-.34-1.85a3.1 3.1 0 0 0-.75-1.15 3.1 3.1 0 0 0-1.15-.75c-.35-.14-.88-.3-1.85-.34C15.52 4.01 15.15 4 12 4zm0 3.4A4.6 4.6 0 1 1 12 16.6 4.6 4.6 0 0 1 12 7.4zm0 1.8a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zm5.85-2.02a1.08 1.08 0 1 1-2.15 0 1.08 1.08 0 0 1 2.15 0z"/></svg>';
  var YOUTUBE_SVG =
    '<svg viewBox="0 0 24 24" fill="rgb(255,255,255)" xmlns="http://www.w3.org/2000/svg" style="width:17px;height:17px;display:block;opacity:0.85"><path d="M23.5 6.8a3 3 0 0 0-2.1-2.1C19.5 4.2 12 4.2 12 4.2s-7.5 0-9.4.5A3 3 0 0 0 .5 6.8 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.2 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.2zM9.6 15.5V8.5L15.8 12l-6.2 3.5z"/></svg>';

  function wrapHeaderIcon(container, href, iconHTML, opts) {
    var inner = container.firstElementChild;
    if (!inner) return;
    if (iconHTML) inner.innerHTML = iconHTML;
    var a = document.createElement("a");
    a.href = href;
    a.style.cssText = "display:block;height:100%;width:100%;text-decoration:none;";
    if (opts && opts.blank) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    if (opts && opts.label) a.setAttribute("aria-label", opts.label);
    container.insertBefore(a, inner);
    a.appendChild(inner);
  }

  // O export da Framer duplica esta fila de ícones: "Header Links" é a
  // versão usada num breakpoint, "Social Links" é a mesma fila (Email +
  // LinkedIn + Behance genéricos) repetida para outro breakpoint, num nó
  // completamente separado — confirmado por inspeção direta do HTML de
  // produção. As duas têm de ser corrigidas, senão só uma largura de
  // ecrã fica com os ícones certos e a outra continua a mostrar "in"/"Bē".
  function fixHeaderSocialLinksRow(row) {
    if (!row || row.getAttribute("data-abwl-fixed") === "1") return;
    var containers = row.children;
    if (containers.length < 3) return;
    wrapHeaderIcon(containers[0], "mailto:contact@alexffb.com", null, { label: "Email" });
    wrapHeaderIcon(containers[1], "https://instagram.com/alexffb_", INSTAGRAM_SVG, {
      blank: true,
      label: "Instagram",
    });
    wrapHeaderIcon(containers[2], "https://youtube.com/@alexffb", YOUTUBE_SVG, {
      blank: true,
      label: "YouTube",
    });
    row.setAttribute("data-abwl-fixed", "1");
  }

  function fixHeaderSocialLinks() {
    fixHeaderSocialLinksRow(document.querySelector('[data-framer-name="Header Links"]'));
    fixHeaderSocialLinksRow(document.querySelector('[data-framer-name="Social Links"]'));
  }

  // Botões/links que ainda apontam para o Cal.com pessoal do template.
  // Rola até ao <form> em si (não só até ao topo da secção "Contact"),
  // localizando-o pelo campo de email em vez de por id — o id do form
  // é removido pela própria hidratação da Framer, confirmado por teste
  // direto, por isso nunca se pode confiar nele para o alvo do scroll.
  function scrollToContactForm() {
    var email = document.querySelector('input[name="Email"]');
    var form = email && email.closest("form");
    (form || document.getElementById("contact")).scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function fixCalLinks() {
    var anchors = document.querySelectorAll('a[href*="cal.com"]');
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      var label = norm(a.textContent);
      if (/book\s*a\s*call/i.test(label)) {
        a.setAttribute("href", "#contact");
        a.removeAttribute("target");
        var walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
        var textNode;
        while ((textNode = walker.nextNode())) {
          if (/book\s*a\s*call/i.test(textNode.nodeValue)) {
            textNode.nodeValue = "Enviar Mensagem";
          }
        }
        if (a.getAttribute("data-abwl-scroll") !== "1") {
          a = detachFiber(a);
          a.setAttribute("data-abwl-scroll", "1");
          a.addEventListener("click", function (event) {
            event.preventDefault();
            scrollToContactForm();
          });
        }
      } else {
        a.style.display = "none";
      }
    }
  }

  // Vídeo da secção About: tira o HUD nativo do browser (controls) e
  // substitui por um botão de play central com efeito "liquid glass".
  // Marcado com data-abwl-fixed para só se montar uma vez.
  function fixAboutVideo() {
    var video = document.querySelector("video[controls]");
    if (!video || video.getAttribute("data-abwl-fixed") === "1") return;
    video.setAttribute("data-abwl-fixed", "1");
    video.removeAttribute("controls");

    var wrap = video.parentElement;
    if (wrap && getComputedStyle(wrap).position === "static") {
      wrap.style.position = "relative";
    }

    var btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("aria-label", "Reproduzir vídeo");
    btn.style.cssText =
      "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);" +
      "width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;" +
      "cursor:pointer;border:1px solid rgba(255,255,255,0.35);" +
      "background:rgba(255,255,255,0.14);backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);" +
      "box-shadow:0 8px 32px rgba(0,0,0,0.35),inset 0 1px 1px rgba(255,255,255,0.45),inset 0 -1px 1px rgba(0,0,0,0.15);" +
      "transition:transform 0.2s ease,background 0.2s ease;z-index:2;";
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" style="width:26px;height:26px;margin-left:3px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.35))"><path d="M6 4.5 L19 12 L6 19.5 Z" fill="#fff"/></svg>';

    btn.addEventListener("mouseenter", function () {
      btn.style.transform = "translate(-50%,-50%) scale(1.08)";
      btn.style.background = "rgba(255,255,255,0.2)";
    });
    btn.addEventListener("mouseleave", function () {
      btn.style.transform = "translate(-50%,-50%) scale(1)";
      btn.style.background = "rgba(255,255,255,0.14)";
    });
    btn.addEventListener("click", function () {
      video.play();
    });
    video.addEventListener("click", function () {
      if (!video.paused) video.pause();
    });
    video.addEventListener("play", function () {
      btn.style.display = "none";
    });
    video.addEventListener("pause", function () {
      btn.style.display = "flex";
    });
    video.addEventListener("ended", function () {
      btn.style.display = "flex";
    });

    (wrap || video.parentNode).appendChild(btn);
  }

  /* Níveis de cabeçalho.
   *
   * O export da Framer traz seis <h1> na home: as duas palavras do hero,
   * duas repetições delas na assinatura do rodapé, e mais dois títulos de
   * secção. Os quatro pilares são <h4> logo a seguir a um <h2>, saltando
   * o <h3>.
   *
   * O Google diz que vários <h1> não prejudicam o posicionamento, por
   * isso isto não é o que trava a indexação — mas para quem navega com
   * leitor de ecrã a página fica com seis títulos de primeiro nível, dois
   * deles repetidos, o que torna a estrutura inútil.
   *
   * A troca de tag é feita com um nó novo (o clone larga a fiber do
   * React, como em detachFiber) e o CSS da Framer trata p/h1/h2/h3 por
   * igual, por isso nada muda visualmente. */
  var HEADING_LEVELS = [
    // O hero é o título da página: fica o único <h1>.
    { sel: ".framer-1nujzqg h1", tag: "p" },   // "Bento", 2.ª metade do hero
    { sel: ".framer-1nn2aro h1", tag: "h2" },  // "...novidades"
    { sel: ".framer-rg7nzm h1", tag: "h2" },   // manifesto "Com 16 anos..."
    { sel: ".framer-yljb4s h1", tag: "p" },    // assinatura do rodapé
    { sel: ".framer-29p7eg h1", tag: "p" },    // assinatura do rodapé
    // Os 4 pilares vinham a <h4> logo abaixo de um <h2>.
    { sel: ".framer-15xneeu h4", tag: "h3" },
  ];

  function retag(el, tag) {
    if (!el || !el.parentNode) return null;
    if (el.tagName.toLowerCase() === tag) return el;
    var next = document.createElement(tag);
    for (var i = 0; i < el.attributes.length; i++) {
      next.setAttribute(el.attributes[i].name, el.attributes[i].value);
    }
    while (el.firstChild) next.appendChild(el.firstChild);
    el.parentNode.replaceChild(next, el);
    return next;
  }

  function fixHeadingLevels() {
    for (var i = 0; i < HEADING_LEVELS.length; i++) {
      var rule = HEADING_LEVELS[i];
      var nodes = document.querySelectorAll(rule.sel);
      for (var j = 0; j < nodes.length; j++) retag(nodes[j], rule.tag);
    }

    // O hero está partido em duas palavras, em dois elementos. O <h1>
    // ficaria a dizer só "Alexandre", por isso leva a segunda metade num
    // span invisível — é exatamente o que está escrito ao lado, não é
    // texto escondido a mais.
    var hero = document.querySelector(".framer-1bol87l h1");
    if (hero && !hero.querySelector(".abwl-sr-only")) {
      var span = document.createElement("span");
      span.className = "abwl-sr-only";
      span.textContent = " Bento";
      hero.appendChild(span);
    }
  }

  /* Texto alternativo das imagens da home.
   *
   * O export da Framer traz alt="" em tudo. Em ícones e fundos isso está
   * certo — um alt vazio diz ao leitor de ecrã "isto é decoração, salta"
   * e é melhor do que descrever um separador. Errado é nas imagens que
   * têm conteúdo: os logótipos das três organizações e as fotografias.
   *
   * A chave é o nome do ficheiro sem o sufixo de variante (_1, _3, _4),
   * porque o srcset serve tamanhos diferentes do mesmo original. */
  var IMAGE_ALT = {
    ErNgK84BhHKokmrzPKcUKmYLgr0: "Alexandre Bento",
    WjaAFec3PATGcV5KzKZq381iKk: "Logótipo da Associação Selfmade",
    FNVpPkhR5uBMvUKGdNUfzltvqX0: "Logótipo da Aeternus Progressus",
    bTpVhDhbSlC3IPyXKDUgm1rsnDY: "Logótipo da Layout Agency",
    "6VMMoPiYzYZbs0OEWoMbMsWsjrU": "Alexandre Bento de perfil, à frente da Torre Eiffel iluminada, à noite",
    ANc668CeddOzBUZsl7Lvn6QTQDA: "Alexandre Bento a fazer festas a um cavalo, num campo",
    OWvGPNnymLZcpsfwjmNcDYzXnWE: "Alexandre Bento de camisola de gola alta e óculos escuros, a bordo de um barco num lago",
    RGis8TSGSyHnrbCTWnKWhHCJU0: "Alexandre Bento a sair da água, numa praia",
    cPTQSImR2ymPA9OqRlQFxoyN8: "Alexandre Bento sentado, de camisa e gravata, com o telemóvel na mão",
    hpoqyWNUy1DGMusTBbxALq1Amg: "Alexandre Bento de fato e óculos escuros, ao ar livre ao fim da tarde",
    ulJ6DqAJLiqrQEuO0auYrrgLBM: "Alexandre Bento sentado numa cadeira, de camisa preta, num evento",
  };

  function imageKey(img) {
    var src = img.getAttribute("src") || img.currentSrc || "";
    var file = src.split("/").pop().split("?")[0];
    return file.replace(/\.[a-z0-9]+$/i, "").replace(/_\d+$/, "");
  }

  function fixImageAlt() {
    var imgs = document.querySelectorAll("img");
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      var wanted = IMAGE_ALT[imageKey(img)];
      if (!wanted) continue;
      if (img.getAttribute("alt") !== wanted) img.setAttribute("alt", wanted);
      // A hidratação repõe alt="" depois de já termos passado por aqui,
      // por isso cada imagem fica com o seu próprio guarda (o mesmo
      // padrão já usado nas imagens dos tópicos).
      if (img.getAttribute("data-abwl-alt-guard") === "1") continue;
      img.setAttribute("data-abwl-alt-guard", "1");
      (function (target) {
        var guard = new MutationObserver(function () {
          var want = IMAGE_ALT[imageKey(target)];
          if (want && target.getAttribute("alt") !== want) target.setAttribute("alt", want);
        });
        guard.observe(target, { attributes: true, attributeFilter: ["alt", "src"] });
      })(img);
    }
  }

  /* O <title> da página.
   *
   * O runtime da Framer escreve o nome da página do projeto ("Alexffb")
   * por cima do <title> do HTML quando o router monta. O Google executa
   * JavaScript, por isso era esse o título que ele via — não o que está
   * no HTML. O valor certo é guardado por um script inline no <head>,
   * antes de qualquer bundle poder correr.
   *
   * Além de o repor no patch(), fica um observador no próprio <title>:
   * se a Framer o reescrever depois da última passagem agendada, é
   * corrigido no mesmo instante. */
  function intendedTitle() {
    return window.__ABWL_TITLE__ || null;
  }

  function keepTitle() {
    var want = intendedTitle();
    if (want && document.title !== want) document.title = want;
  }

  (function watchTitle() {
    var el = document.querySelector("title");
    if (!el || !window.MutationObserver) return;
    new MutationObserver(keepTitle).observe(el, { childList: true, characterData: true, subtree: true });
  })();

  function patch() {
    keepTitle();
    fixTextNodes();
    fixHeadings();
    fixHeadingLevels();
    fixByClass();
    fixShortText();
    addMerchButton();
    addFooterLegalLinks();
    addContactInfo();
    fixTopicImages();
    fixImageAlt();
    fixCardLinks();
    fixCalLinks();
    fixHeaderSocialLinks();
    fixAboutVideo();
    // O <title> é definido no <head> e não se mexe: reescrevê-lo aqui
    // apagava a versão do HTML em qualquer motor de busca que execute
    // JavaScript (o Google executa), que foi o que aconteceu até agora.
  }

  patch();
  [100, 400, 800, 1500, 3000, 5000].forEach(function (ms) {
    setTimeout(patch, ms);
  });

  var scheduled = false;
  var observer = new MutationObserver(function () {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      patch();
    }, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
