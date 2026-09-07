-- Loja "Anti University Social Club" (/loja) — checkout fecha-se sempre
-- por WhatsApp, sem dados pessoais recolhidos pelo site (nome/morada
-- ficam a ser trocados diretamente no WhatsApp). Esta tabela só regista
-- o conteúdo do carrinho no momento em que alguém carrega em "Comprar
-- pelo WhatsApp", como registo de segurança a par da cópia por email.

create table public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  items jsonb not null,
  total numeric(10, 2) not null,
  combo_savings numeric(10, 2) not null default 0,
  resend_ok boolean,
  resend_error text,
  created_at timestamptz not null default now()
);

alter table public.shop_orders enable row level security;

-- Mesma postura das outras tabelas: anon só pode inserir, nunca ler de
-- volta (sem service role no código do cliente).
create policy "Allow public insert" on public.shop_orders
  for insert
  to anon, authenticated
  with check (true);
