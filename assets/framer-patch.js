(function () {
  "use strict";

  // O export da Framer hidrata a página com React depois do primeiro
  // carregamento, e esse React volta a escrever o texto original (inglês,
  // por traduzir) gravado no bundle script_main.*.mjs, ignorando o HTML
  // estático que editámos. Este script corre depois disso e força de
  // volta o texto e os links certos, repetindo a correção porque a
  // hidratação pode acontecer em alturas ligeiramente diferentes.

  document.title = "Alexandre Bento, Empreendedor Self-Made";

  // Pares [texto antigo a procurar, texto novo] aplicados no menor
  // elemento cujo texto contenha o antigo (comparação sem maiúsculas).
  var TEXT_FIXES = [
    ["Conversion-Focused Web Designer for", "18 anos, disciplina todos os dias, a construir o meu caminho."],
    ["Being a Web Designer is one of the best jobs in the world", "Ser Web Designer é um dos melhores trabalhos do mundo."],
    ["Somewhere along the way, design became about portfolios", "Algures pelo caminho, ter sucesso tornou-se uma checklist, tira o curso, arranja o emprego, espera pela tua vez."],
    ["I never bought into that.", "Nunca comprei essa ideia."],
    ["For me, design has always been about one thing", "Aos 16 anos co-fundei a Layout Agency e levei-a a receita de cinco dígitos antes de fazer 18 anos, sem nunca ter pisado uma sala de aula universitária. Hoje sou Vice-Presidente da Associação Selfmade, trabalho com jovens empreendedores por Portugal e pela Europa, e conduzo grandes projetos que vão ajudar a moldar o futuro da Europa através da Aeternus Progressus."],
    ["That's the question I've been obsessed with", "Disciplina é a base de tudo isto, no ginásio, no desporto, e no trabalho, todos os dias, sem exceções."],
    ["I'm Xavien Miller.", "Este site é onde tudo isto vive, conteúdo, comunidade, produtos, e os negócios que vou construindo pelo caminho. Não sou inalcançável. Se queres evoluir e construir algo teu, podes sempre contar comigo para te ajudar a lá chegar."],
    ["If that's you, we should talk.", ""],
    ["Schedule a call on cal.com", ""],
    ["Synox is a modern finance platform", "Anti University Social Club, a primeira coleção. Streetwear para quem constrói o próprio caminho. Lançamento: 7 de setembro, segunda-feira."],
    ["Sastik Help Desk provides reliable IT support", "Uma rede de jovens empreendedores que preferem construir a esperar. Brevemente."],
    ["Innomax is a modern AI and data technology platform", "Cursos, ebooks e templates a partir do que já construí de verdade, não teoria."],
    ["Brickox is a modern construction platform", "Ferramentas que estou a construir, e ferramentas de parceiros em quem acredito."],
    ["comunidades", "Comunidade"],
    ["infoproduros", "Produtos Digitais"],
    ["apps & softwares", "Apps & Software"],
    ["testimonials", "Afiliações"],
    ["Project Mannager", "Project Manager"],
    ["Co-Founder", "Co-Fundador"],
    ["let’s build something people remember", "Vamos Conectar-nos"],
    ["get in touch", "Contacto"],
    ["Tell me about your", "Seja um negócio que queiras construir, uma parceria, ou só dizer olá, começa aqui."],
    ["I reply within 24 hours", "Leio tudo pessoalmente e respondo em 24 horas."],
    ["Xavien Miller © Copyright 2026", "Alexandre Bento © 2026. Todos os direitos reservados."],
    ["Available for new projects & role", "A construir algo novo, sempre."],
    ["life behind the desk", "Para Lá do Ecrã"],
    ["criação de conteudo", "Criação de Conteúdo"],
    ["eventos & projetos", "Eventos & Projetos"],
    ["viagens & lyfestyle", "Viagens & Lifestyle"],
    ["giveaways & sorteios", "Giveaways & Sorteios"],
  ];

  function norm(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  function applyTextFixes() {
    for (var i = 0; i < TEXT_FIXES.length; i++) {
      var needle = TEXT_FIXES[i][0].toLowerCase();
      var replacement = TEXT_FIXES[i][1];
      var all = document.querySelectorAll("body *");
      var best = null;
      var bestLen = Infinity;
      for (var j = 0; j < all.length; j++) {
        var el = all[j];
        if (el.children.length > 6) continue; // evita apanhar wrappers grandes de mais
        var t = norm(el.textContent).toLowerCase();
        if (t.indexOf(needle) !== -1 && t.length < bestLen) {
          bestLen = t.length;
          best = el;
        }
      }
      if (best && norm(best.textContent) !== replacement) {
        best.textContent = replacement;
      }
    }
  }

  // 4 pilares: link + texto do botão, na ordem em que aparecem na página.
  var CARD_LINKS = ["/merch", "/comunidade", "/produtos-digitais", "/apps"];
  function fixCardLinks() {
    var links = document.querySelectorAll('a[href*="case-study"]');
    for (var i = 0; i < links.length && i < CARD_LINKS.length; i++) {
      links[i].setAttribute("href", CARD_LINKS[i]);
      if (norm(links[i].textContent) !== "Entra na waitlist") {
        links[i].textContent = "Entra na waitlist";
      }
    }
  }

  // Botões/links que ainda apontam para o Cal.com pessoal do template.
  function fixCalLinks() {
    var anchors = document.querySelectorAll('a[href*="cal.com"]');
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      var label = norm(a.textContent);
      if (/book\s*a\s*call/i.test(label)) {
        a.setAttribute("href", "#contact");
        a.removeAttribute("target");
        if (label !== "Enviar Mensagem") a.textContent = "Enviar Mensagem";
      } else {
        // microcopy "Schedule a call on cal.com": já não faz sentido, esconde.
        var wrapper = a.closest('[class]') || a;
        wrapper.style.display = "none";
      }
    }
  }

  function patch() {
    applyTextFixes();
    fixCardLinks();
    fixCalLinks();
    if (document.title !== "Alexandre Bento, Empreendedor Self-Made") {
      document.title = "Alexandre Bento, Empreendedor Self-Made";
    }
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
