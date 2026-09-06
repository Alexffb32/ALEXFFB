# alexffb.com

Site do Alexandre Bento. `index.html` na raiz é o export estático do template
Framer atual (design/layout/cores/tipografia são a referência a preservar —
ver as regras no histórico de commits). `assets/`, `api/` e o resto da
estrutura foram construídos por cima desse export, sem tocar no design.

## Estrutura

- `index.html` — página principal (export Framer, root).
- `framerusercontent.com/`, `fonts.gstatic.com/`, `events.framer.com/` —
  espelho local dos recursos do export (fontes, imagens, vídeos, script de
  analytics), servidos a partir do próprio domínio.
- `merch/`, `comunidade/`, `produtos-digitais/`, `apps/` — as 4 páginas de
  waitlist dos "pilares", cada uma com formulário nome+email a submeter
  para uma lista separada no Resend.
- `assets/waitlist.css` / `assets/waitlist.js` — estilo e comportamento
  partilhado pelas 4 páginas de waitlist.
- `assets/contact-form.js` — liga o formulário de contacto nativo da
  página principal a `/api/contact`.
- `api/waitlist.js`, `api/contact.js`, `api/_lib/*` — funções serverless
  (Vercel) que validam o pedido, escrevem no Supabase (registo de apoio) e
  chamam o Resend (audiência + email de confirmação/notificação).
- `supabase/migrations/` — histórico do schema da base de dados.

## Configuração (Resend + Supabase)

Copia `.env.example` para `.env` e preenche os valores reais — ou define-os
como Environment Variables no projeto Vercel. Precisas de:

- Uma conta Resend com uma Audience criada por cada uma das 4 listas
  (Merch, Comunidade, Produtos Digitais, Apps).
- Um domínio verificado no Resend para o `RESEND_FROM_EMAIL` funcionar.
- O projeto Supabase já existente (`alexffb`) — as tabelas já têm o schema
  certo, só falta a anon key/URL nas env vars.

## Segurança

Só a anon/publishable key do Supabase é usada no lado do servidor, e as
tabelas têm RLS insert-only (sem SELECT) — nunca é usada uma service role
key aqui.
