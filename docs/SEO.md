# SEO do alexffb.com

Estado depois da ronda de setembro de 2026. Divide-se em três partes: o
diagnóstico, o que já está feito no código, e o que só o Alexandre pode
fazer (porque exige a conta dele ou pessoas de fora).

---

## 1. Porque é que o site não aparecia no Google

Não há uma causa única, mas há uma que pesa muito mais do que as outras.

### A causa principal: o Google provavelmente nunca soube que o site existe

O Google encontra páginas de duas maneiras: seguindo links de páginas que
já conhece, ou porque alguém lhe entregou o site no Search Console. Um
domínio novo, sem nenhum site externo a apontar para ele e sem estar
registado no Search Console, pode ficar meses sem ser rastreado — não por
estar mal feito, mas por ser invisível.

Nada no repositório prova que o site foi alguma vez submetido. E, à data
desta ronda, o único link externo conhecido a apontar para o alexffb.com
vinha das bios do Instagram e do YouTube.

**Isto não se resolve com código.** Resolve-se com os passos da secção 3.

### Causas secundárias, essas sim corrigidas aqui

| Problema | Efeito |
|---|---|
| As 4 páginas de produto viviam todas em `/loja/produto/?d=<slug>`, marcadas `noindex` | Do ponto de vista do Google, a loja tinha **zero** páginas de produto |
| `termos`, `privacidade` e `cookies` a `noindex` | Menos páginas indexáveis e menos sinais de confiança |
| `sitemap.xml` com 3 URLs, escrito à mão | Metade do site fora do mapa |
| `<html lang="en">` na home, com o conteúdo todo em português | Sinal de idioma errado |
| O JavaScript reescrevia o `<title>` em **três** sítios | O Google executa JavaScript: via o título errado, não o do HTML |
| `og:image` era um caminho relativo (`framerusercontent.com/...`) | Nenhuma pré-visualização nas redes sociais — as imagens sociais exigem URL absoluto |
| Sem dados estruturados em lado nenhum | Sem elegibilidade para resultados enriquecidos |
| Favicon: um PNG de 6250×6250 com 170 KB, em todas as páginas | Na newsletter eram 61% do peso da página |

---

## 2. O que está feito no código

### Indexação e URLs
- Cada design tem agora a sua página: `/loja/anti-university-social-club/`,
  `/loja/o-mundo-real/`, `/loja/gente-qualificada/`, `/loja/no-degree-required/`.
  São geradas por `scripts/build-product-pages.js` a partir do molde
  `loja/produto/index.html` e do catálogo, para não haver conteúdo
  duplicado à mão.
- Os links antigos com `?d=` fazem 301 para o URL limpo (`vercel.json`).
- `noindex` removido das páginas legais. Mantido em dois sítios, de
  propósito: o **carrinho** (depende de quem visita, não tem nada que
  mostrar numa pesquisa) e o **molde** `/loja/produto/`.
- `sitemap.xml` gerado por `scripts/build-sitemap.js`, que lê as páginas
  reais, exclui as `noindex` e **rebenta** se um canonical não bater
  certo com o caminho do ficheiro. 3 → 10 URLs.

### Cabeça de cada página
Título, descrição, canonical, `og:*` completo com URL absoluto,
`twitter:card`, `lang="pt-PT"` e `viewport` com `initial-scale=1`
(faltava, e sem isso o iOS aplica zoom ao rodar o ecrã).

### Dados estruturados (JSON-LD)
- Home: `Person` + `WebSite`
- `/loja/`: `CollectionPage` + `ItemList` dos 4 produtos + `BreadcrumbList`
- Cada design: `Product` com `AggregateOffer` (17,99–36,99 €); o Pack 4
  T-shirts com um `Offer` único (54,99 €). Ambos com portes grátis
  (`shippingDetails`) e política de devolução de 14 dias
  (`hasMerchantReturnPolicy`). Mais `BreadcrumbList`.
- Páginas legais e newsletter: `WebPage` + `BreadcrumbList`

`aggregateRating` e `review` só entram quando há avaliações reais em
`REVIEWS` (ver `docs/LOJA.md`). Inventá-las é motivo de penalização manual
além de ser mentira.

### O caso do `<title>` (vale a pena saber)

Havia três coisas a reescrever o título da home por JavaScript, e a
última só apareceu depois de corrigir um erro do servidor de testes que
estava a impedir o bundle da Framer de carregar:

1. `framer-patch.js`, logo no topo do ficheiro;
2. `framer-patch.js`, outra vez, dentro do `patch()`;
3. **o próprio runtime da Framer**, que ao montar o router escreve o nome
   da página do projeto — `"Alexffb"` — por cima do que está no HTML.

Como o Google executa JavaScript, era `"Alexffb"` o título que ele via.
As duas primeiras foram removidas; a terceira não se pode remover, por
isso o título certo é guardado por um script inline no `<head>` (antes de
qualquer bundle poder correr) e reposto por um `MutationObserver` no
próprio elemento `<title>`. Verificado a manter-se aos 0,5 / 1,5 / 3 / 6 /
9 segundos.

Nota relacionada: a Framer também repõe a meta `robots` no valor dela,
`max-image-preview:large`. Isto é inofensivo — `index, follow` é o
comportamento por omissão do Google quando não há `noindex` — por isso
não se anda a lutar com o framework por causa disso.

### Estrutura e acessibilidade
- Home: de **6 `<h1>`** para um só ("Alexandre Bento"). Os quatro pilares
  passaram de `<h4>` para `<h3>`, que era onde faltava um nível.
- Texto alternativo nos logótipos das três organizações e nas sete
  fotografias. Os ícones de 13–29px e o gradiente de fundo ficam com
  `alt=""` **de propósito**: são decoração, e descrevê-los só torna a
  leitura por voz mais barulhenta.

### Desempenho
| | Antes | Depois |
|---|---|---|
| Favicon (todas as páginas) | 170 KB | 1 KB |
| `/loja/` | 1401 KB | 747 KB |
| `/newsletter/` | 278 KB | ~108 KB |
| CLS da home | 0,152 | **0** |

O CLS vinha todo de um salto único: o texto da home está partido letra a
letra em `<span>`, e cada letra mudava de largura quando as fontes
acabavam de carregar. Resolvido com `preload` das três fontes críticas.

**O que não foi resolvido:** a home transfere ~4 MB, dos quais ~1,85 MB
são o runtime do Framer e ~1,5 MB são as fotografias da galeria. O
runtime não se toca sem sair do Framer. As fotografias poderiam ser
adiadas com `loading="lazy"`, mas isso exige mexer no HTML gerado pelo
Framer, que a hidratação do React volta a escrever — é a troca que falta
fazer, e é uma decisão de arquitetura, não um ajuste.

### Ligações internas
- Links internos passaram todos à forma canónica (com barra final).
- Cada página de produto liga agora às outras três ("Os outros designs").
  Antes cada uma era uma folha solta.
- O rodapé da loja ganhou links para a home e para a newsletter.
- Zero links internos quebrados (verificado página a página).

### HTTPS
Já estava: a Vercel força HTTPS no edge e o site envia
`Strict-Transport-Security` com `preload`. Não há um único `http://` no
conteúdo.

---

## 3. O que só o Alexandre pode fazer

### 3.1 Search Console — é isto que destranca tudo

1. Entrar em <https://search.google.com/search-console>.
2. **Adicionar propriedade → Prefixo do URL**, escrever
   `https://alexffb.com` (é o caminho mais rápido; a opção "Domínio" exige
   um registo DNS na Squarespace Domains, onde o domínio está).
3. Escolher o método **"Etiqueta HTML"**. Vai aparecer uma linha assim:
   ```html
   <meta name="google-site-verification" content="XXXXXXXXXXXX">
   ```
   **Manda-me esse `content`** e eu ponho-o no `<head>` da home. (Não deixei
   um marcador vazio: uma etiqueta de verificação com um valor inventado
   falha na mesma e só confunde.)
4. Depois de verificado: **Sitemaps → adicionar `sitemap.xml`**.
5. **Inspeção de URL** → colar `https://alexffb.com/` → **Pedir indexação**.
   Repetir para `https://alexffb.com/loja/`. Isto força o Google a ir lá
   em horas em vez de semanas.
6. Fazer o mesmo no **Bing Webmaster Tools** — importa direto do Search
   Console e leva dois minutos. O Bing alimenta também o DuckDuckGo e o
   ChatGPT.

Depois de submeter, dar **uma a duas semanas** antes de tirar conclusões.
A secção "Páginas" do Search Console vai dizer exatamente o que foi
indexado e o que não foi, e porquê.

### 3.2 Estratégia de backlinks

Um backlink é um link de outro site para o teu. Servem duas coisas:
fazem o Google descobrir o site, e dizem-lhe que vale a pena mostrá-lo.
Sem nenhum, um domínio novo fica praticamente invisível.

Por ordem de esforço/retorno:

**Nível 1 — hoje, meia hora, sem depender de ninguém**

Não passam autoridade (são quase todos `nofollow`), mas são os caminhos
por onde o Google costuma descobrir um site novo:

- Bio do Instagram (`@alexffb_`) e do YouTube (`@alexffb`) — link direto,
  não um encurtador.
- Secção "Sobre" do canal de YouTube e descrição de cada vídeo.
- Perfil de LinkedIn: campo do site, e um post a apresentar a loja.
- Se houver GitHub, o campo de website do perfil.

**Nível 2 — esta semana, três emails**

São os melhores links ao alcance imediato, e são legítimos porque as
relações são reais:

- **Layout Agency** — página de equipa a ligar ao alexffb.com como
  co-fundador.
- **Associação Selfmade** — página de direção, como Vice-Presidente.
- **Aeternus Progressus** — página de equipa, como Project Manager.

Pedir explicitamente um link no nome, não só a menção.

**Nível 3 — o que muda mesmo a escala**

A história é genuinamente noticiável em Portugal: 18 anos, média de 18 no
secundário, recusou a universidade, negócio de cinco dígitos antes dos 18.
Um artigo numa publicação destas vale mais do que cem diretórios:

- Link To Leaders, Startup Portugal, ECO/Pessoas, Executive Digest,
  Dinheiro Vivo, Shifter, SAPO Tek, Observador (Lifestyle).
- Jornais e rádios regionais — muito mais fáceis de conseguir, e contam.
- Podcasts portugueses de empreendedorismo: as notas de episódio ligam
  quase sempre.
- Imprensa universitária e associações de estudantes: dada a coleção,
  o ângulo é bom e a audiência é exatamente a certa.

Modelo de email: assunto direto, três frases com o ângulo, um link para
a página da história (`/loja/#shop-story`), e disponibilidade para
entrevista. Sem anexos.

**O que não fazer, nunca**

Comprar links, redes de blogues (PBN), submissão em massa a diretórios,
troca de links em massa, comentários com link. Tudo isto está explicitamente
coberto pela política de spam da Google e arrisca uma penalização manual,
que é muito mais difícil de reverter do que a situação atual.

### 3.3 Uma correção de conteúdo pendente

A home ainda diz **"Lançamento: 7 de setembro, segunda-feira"** — data já
passada. Datas velhas visíveis prejudicam a confiança de quem chega pela
pesquisa.

---

## 4. Como regenerar

Depois de mexer no catálogo, nos designs ou em qualquer página:

```bash
node scripts/build-product-pages.js   # páginas de produto a partir do molde
node scripts/build-sitemap.js         # sitemap a partir das páginas reais
```

O segundo falha de propósito se encontrar uma página indexável sem
canonical, ou com um canonical que não corresponde ao caminho do
ficheiro — é a rede de segurança contra o erro mais fácil de cometer aqui.
