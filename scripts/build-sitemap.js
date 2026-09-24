#!/usr/bin/env node
/* Gera o sitemap.xml a partir das páginas que existem mesmo no repositório.
 *
 * O sitemap anterior tinha três URLs escritos à mão e estava desatualizado
 * — faltavam as páginas legais e não podia sequer conhecer as páginas de
 * produto, que ainda não existiam. Escrito à mão, volta a desatualizar-se
 * na próxima página que se criar.
 *
 * Regra: entra tudo o que a própria página declara como indexável. Uma
 * página com `noindex` (o carrinho, o molde de produto) fica de fora —
 * listar no sitemap um URL que se pede ao Google para não indexar é um
 * sinal contraditório, e aparece no Search Console como aviso.
 *
 *     node scripts/build-sitemap.js
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE = "https://alexffb.com";
const SKIP_DIRS = new Set(["node_modules", ".git", "framerusercontent.com", "fonts.gstatic.com", "events.framer.com", "framer.com", "scripts", "api", "supabase", "assets"]);

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (entry.name === "index.html") {
      out.push(full);
    }
  }
  return out;
}

function urlFor(file) {
  const rel = path.relative(ROOT, path.dirname(file)).split(path.sep).join("/");
  return rel === "" ? SITE + "/" : SITE + "/" + rel + "/";
}

function isIndexable(html) {
  const m = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i);
  return !(m && /noindex/i.test(m[1]));
}

function canonicalOf(html) {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  return m ? m[1] : null;
}

function main() {
  const files = walk(ROOT, []);
  const entries = [];
  const skipped = [];

  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const url = urlFor(file);
    if (!isIndexable(html)) {
      skipped.push(url + "  (noindex)");
      continue;
    }
    const canonical = canonicalOf(html);
    if (!canonical) {
      throw new Error("página indexável sem canonical: " + file);
    }
    // O sitemap tem de listar exatamente o URL canónico, senão o Google
    // recebe duas formas do mesmo endereço e escolhe ele.
    if (canonical !== url) {
      throw new Error(
        "canonical não bate com o caminho: " + file + "\n  canonical: " + canonical + "\n  esperado : " + url,
      );
    }
    entries.push({ url, lastmod: fs.statSync(file).mtime.toISOString().slice(0, 10) });
  }

  entries.sort((a, b) => (a.url === SITE + "/" ? -1 : b.url === SITE + "/" ? 1 : a.url.localeCompare(b.url)));

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries
      .map((e) => "  <url>\n    <loc>" + e.url + "</loc>\n    <lastmod>" + e.lastmod + "</lastmod>\n  </url>\n")
      .join("") +
    "</urlset>\n";

  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml);
  entries.forEach((e) => console.log("  " + e.url));
  skipped.forEach((s) => console.log("  - " + s));
  console.log("\n" + entries.length + " URLs no sitemap, " + skipped.length + " fora por noindex");
}

main();
