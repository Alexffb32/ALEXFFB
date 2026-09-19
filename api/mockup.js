/* Gera a imagem do mockup da peça com a assinatura aplicada.
 *
 * É um GET determinístico: os mesmos parâmetros dão sempre a mesma
 * imagem. É por isso que não há upload nem storage em lado nenhum — o
 * carrinho guarda só cinco números e o link para esta rota é montado a
 * partir deles. E como é um URL de imagem normal, o WhatsApp mostra-o
 * em pré-visualização dentro da conversa, que é o objetivo: o Alexandre
 * recebe a peça já assinada, no sítio que o cliente escolheu.
 *
 *   /api/mockup?d=<design>&s=front|back&x=0.5&y=0.74&z=0.34&r=-4
 *
 * O sistema de coordenadas é o mesmo do editor (ver ShopCatalog.SIGNATURE):
 * x/y é o centro da assinatura em fração da tela, z a largura em fração
 * da largura, r a rotação em graus no sentido dos ponteiros do relógio —
 * igual ao `rotate()` do CSS, para o que se vê no ecrã e o que sai daqui
 * serem a mesma coisa.
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { rateLimit } = require("./_lib/rateLimit");

const MOCKUP_DIR = path.join(process.cwd(), "assets", "mockups");

/* Lista fechada: o `d` vem do cliente e é usado para escolher um
   ficheiro, por isso nunca pode ser interpolado num caminho. */
const DESIGNS = {
  "anti-university-social-club": "anti-university-social-club.png",
  "o-mundo-real": "o-mundo-real.png",
  "gente-qualificada": "gente-qualificada.png",
  "no-degree-required": "no-degree-required.png",
};

const FRONT = "front.png";
const SIGNATURE = "assinatura.png";

/* Os mesmos limites do cliente (ShopCatalog.SIGNATURE). Repetidos aqui
   de propósito: o cliente valida para dar boa experiência, o servidor
   valida porque é o único lado em que se pode confiar. */
const AREA = { x0: 0.2, y0: 0.2, x1: 0.8, y1: 0.92 };
const MIN_Z = 0.12;
const MAX_Z = 0.52;
const DEFAULTS = { x: 0.5, y: 0.76, z: 0.34, r: -4 };

function clamp(n, lo, hi) {
  return n < lo ? lo : n > hi ? hi : n;
}

function num(value, fallback, lo, hi) {
  const n = Number.parseFloat(value);
  return clamp(Number.isFinite(n) ? n : fallback, lo, hi);
}

function readQuery(req) {
  // Em Vercel `req.query` já vem preenchido; localmente pode não vir.
  if (req.query && typeof req.query === "object") return req.query;
  const url = new URL(req.url, "http://localhost");
  const out = {};
  url.searchParams.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

module.exports = async (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed." }));
    return;
  }

  const ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const { success } = rateLimit(`mockup:${ip}`, { max: 120 });
  if (!success) {
    res.statusCode = 429;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Too many requests. Please try again in a minute." }));
    return;
  }

  const q = readQuery(req);
  const side = q.s === "front" ? "front" : "back";
  const design = typeof q.d === "string" && DESIGNS[q.d] ? q.d : null;

  if (side === "back" && !design) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Unknown design." }));
    return;
  }

  const x = num(q.x, DEFAULTS.x, AREA.x0, AREA.x1);
  const y = num(q.y, DEFAULTS.y, AREA.y0, AREA.y1);
  const z = num(q.z, DEFAULTS.z, MIN_Z, MAX_Z);
  const r = num(q.r, DEFAULTS.r, -180, 180);

  const baseFile = side === "front" ? FRONT : DESIGNS[design];

  try {
    const basePath = path.join(MOCKUP_DIR, baseFile);
    const signaturePath = path.join(MOCKUP_DIR, SIGNATURE);
    const baseBuf = fs.readFileSync(basePath);
    const sigBuf = fs.readFileSync(signaturePath);

    const base = sharp(baseBuf);
    const baseMeta = await base.metadata();
    const W = baseMeta.width;
    const H = baseMeta.height;

    const sigWidth = Math.max(1, Math.round(z * W));

    // Redimensiona primeiro e só depois roda: rodar uma imagem já no
    // tamanho final evita o serrilhado de rodar e reescalar a seguir.
    // O fundo transparente mantém-se no crescimento da caixa.
    const rotated = await sharp(sigBuf)
      .resize({ width: sigWidth })
      .rotate(r, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer({ resolveWithObject: true });

    // `rotate` alarga a caixa para caber a imagem inclinada, e alarga-a
    // de forma simétrica — logo o centro da caixa continua a ser o
    // centro da assinatura, tal como no `translate(-50%,-50%) rotate()`
    // do editor.
    let left = Math.round(x * W - rotated.info.width / 2);
    let top = Math.round(y * H - rotated.info.height / 2);

    // O `composite` do sharp não aceita coordenadas negativas nem uma
    // camada que passe da base — mas o editor deixa (bem) a assinatura
    // chegar à bainha e às costuras, onde ela transborda. Recortamos a
    // parte visível, que é o que o browser faz sozinho com `overflow`.
    let srcLeft = 0;
    let srcTop = 0;
    let w = rotated.info.width;
    let h = rotated.info.height;
    if (left < 0) {
      srcLeft = -left;
      w -= srcLeft;
      left = 0;
    }
    if (top < 0) {
      srcTop = -top;
      h -= srcTop;
      top = 0;
    }
    if (left + w > W) w = W - left;
    if (top + h > H) h = H - top;

    let out;
    if (w <= 0 || h <= 0) {
      // Nada da assinatura cai dentro da peça — devolve a peça limpa em
      // vez de rebentar.
      out = await base.png({ compressionLevel: 9 }).toBuffer();
    } else {
      const visible =
        srcLeft === 0 && srcTop === 0 && w === rotated.info.width && h === rotated.info.height
          ? rotated.data
          : await sharp(rotated.data)
              .extract({ left: srcLeft, top: srcTop, width: w, height: h })
              .png()
              .toBuffer();

      out = await base
        .composite([{ input: visible, left, top }])
        .png({ compressionLevel: 9 })
        .toBuffer();
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", String(out.length));
    // Determinístico: o mesmo URL devolve sempre o mesmo PNG, por isso
    // pode ficar em cache para sempre — inclusive na CDN do WhatsApp.
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.end(req.method === "HEAD" ? undefined : out);
  } catch (error) {
    console.error("[api/mockup] failed to render mockup", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Could not render mockup." }));
  }
};
