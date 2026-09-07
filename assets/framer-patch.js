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

  document.title = "Alexandre Bento, Empreendedor Self-Made";

  function norm(s) {
    return (s || "").replace(/\s+/g, " ").trim();
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
      newText: "18 anos, disciplina todos os dias, a construir o meu caminho.",
    },
    {
      match: "let’s build something people remember",
      newText: "Vamos Conectar-nos",
    },
  ];

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
        var walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
        var textNode;
        while ((textNode = walker.nextNode())) {
          if (/book\s*a\s*call/i.test(textNode.nodeValue)) {
            textNode.nodeValue = "Enviar Mensagem";
          }
        }
      } else {
        a.style.display = "none";
      }
    }
  }

  function patch() {
    fixTextNodes();
    fixHeadings();
    fixByClass();
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
